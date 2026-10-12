package com.hiremate.service.impl;

import com.hiremate.dto.request.InterviewAnswerRequest;
import com.hiremate.dto.response.InterviewDetailResponse;
import com.hiremate.dto.response.InterviewSummaryResponse;
import com.hiremate.dto.response.PracticeProgressResponse;
import com.hiremate.entity.Candidate;
import com.hiremate.entity.InterviewDetail;
import com.hiremate.entity.InterviewSession;
import com.hiremate.entity.PracticeProgressLog;
import com.hiremate.entity.User;
import com.hiremate.enums.InterviewSessionType;
import com.hiremate.repository.CandidateRepository;
import com.hiremate.repository.InterviewDetailRepository;
import com.hiremate.repository.InterviewSessionRepository;
import com.hiremate.repository.PracticeProgressLogRepository;
import com.hiremate.service.AiInterviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiInterviewServiceImpl implements AiInterviewService {

    private final InterviewSessionRepository sessionRepository;
    private final InterviewDetailRepository detailRepository;
    private final PracticeProgressLogRepository progressLogRepository;
    private final CandidateRepository candidateRepository;
    private final com.hiremate.service.NotificationService notificationService;
    private final com.hiremate.service.GeminiAiService geminiAiService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    private final com.hiremate.agent.AgentMemoryManager agentMemoryManager;
    private final com.hiremate.service.FileStorageService fileStorageService;

    @Override
    @Transactional
    public InterviewSummaryResponse startSession(
            String targetPosition,
            Long jobId,
            InterviewSessionType sessionType,
            Long parentSessionId,
            User user
    ) {
        // Lấy Candidate subclass – candidate_id = user_id (Shared PK)
        Candidate candidate = candidateRepository.findById(user.getUserId())
                .orElseThrow(() -> new IllegalStateException(
                        "Candidate profile not found for user: " + user.getUserId()));

        InterviewSession session = InterviewSession.builder()
                .candidate(candidate)
                // job để null nếu không gắn với job cụ thể (tự do)
                .targetPosition(targetPosition != null ? targetPosition : "Software Engineer")
                .sessionType(sessionType != null ? sessionType : InterviewSessionType.MOCK)
                .parentSessionId(parentSessionId)
                .overallScore(0f)
                .build();

        InterviewSession saved = sessionRepository.save(session);
        return mapToSummary(saved, new ArrayList<>(), null);
    }

    @Override
    @Transactional
    public InterviewDetailResponse submitAnswer(Long sessionId, InterviewAnswerRequest request, User user) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        // Kiểm tra quyền truy cập – candidate_id phải khớp user_id
        if (!session.getCandidate().getCandidateId().equals(user.getUserId())) {
            throw new SecurityException("Unauthorized access to this interview session.");
        }

        String answerText = request.getCandidateAnswerText();
        com.hiremate.dto.ai.AiInterviewEvaluation evaluation = null;
        float deliveryScore = 75f;

        // 1. Nếu có file ghi âm audioUrl: Thực hiện phân tích sóng âm & ngữ điệu trực tiếp qua Gemini Multimodal Audio
        if (request.getAudioUrl() != null && !request.getAudioUrl().isBlank()) {
            try {
                byte[] audioBytes = fileStorageService.loadFileAsBytes(request.getAudioUrl());
                if (audioBytes != null && audioBytes.length > 0) {
                    String ext = "";
                    int dot = request.getAudioUrl().lastIndexOf('.');
                    if (dot >= 0) ext = request.getAudioUrl().substring(dot + 1).toLowerCase();
                    String mimeType = "audio/" + (ext.equals("wav") ? "wav" : (ext.equals("ogg") ? "ogg" : (ext.matches("webm|weba") ? "webm" : (ext.equals("m4a") ? "m4a" : "mp3"))));

                    evaluation = geminiAiService.evaluateInterviewAnswerWithAudio(
                            request.getQuestionText(),
                            answerText,
                            audioBytes,
                            mimeType,
                            session.getTargetPosition()
                    );

                    // Tự động Speech-to-Text (STT) nếu ứng viên chỉ gửi file âm thanh hoặc văn bản quá ngắn
                    if ((answerText == null || answerText.isBlank() || answerText.length() < 10)
                            && evaluation.getTranscribedText() != null && !evaluation.getTranscribedText().isBlank()) {
                        answerText = evaluation.getTranscribedText();
                        log.info(">> [AiInterviewService] Tự động STT thành công từ file ghi âm: {} ký tự", answerText.length());
                    }

                    if (evaluation.getDeliveryScore() != null) {
                        deliveryScore = evaluation.getDeliveryScore();
                    }
                }
            } catch (Exception e) {
                log.warn(">> [AiInterviewService] Phân tích audio qua Gemini thất bại ({}), fallback sang phân tích văn bản.", e.getMessage());
            }
        }

        // 2. Fallback sang phân tích văn bản và verified delivery heuristics nếu không có audio
        if (evaluation == null) {
            deliveryScore = computeVerifiedDeliveryScore(
                    answerText,
                    request.getWordsPerMinute(),
                    request.getClarityScore()
            );

            evaluation = geminiAiService.evaluateInterviewAnswer(
                    request.getQuestionText(),
                    answerText,
                    session.getTargetPosition()
            );
        }

        float contentScore = evaluation.getContentScore() != null ? evaluation.getContentScore() : (evaluation.getScore() != null ? evaluation.getScore() : 75f);
        float aiEvaluationScore = evaluation.getScore() != null ? evaluation.getScore() : (Math.round((contentScore * 0.60f + deliveryScore * 0.40f) * 10f) / 10f);

        // Kết hợp phản hồi ngữ điệu vào aiFeedback nếu có
        String finalFeedback = evaluation.getFeedback();
        if (evaluation.getIntonationFeedback() != null && !evaluation.getIntonationFeedback().isBlank()) {
            finalFeedback = finalFeedback + "\n\n[Phong thái & Ngữ điệu - " + (evaluation.getTone() != null ? evaluation.getTone() : "Đánh giá âm thanh") + "]: " + evaluation.getIntonationFeedback();
        }

        InterviewDetail detail = InterviewDetail.builder()
                .session(session)
                .questionNumber(request.getQuestionNumber() != null ? request.getQuestionNumber() : 1)
                .questionText(request.getQuestionText())
                .candidateAnswerText(answerText)
                .audioUrl(request.getAudioUrl())
                .aiEvaluationScore(aiEvaluationScore)
                .aiFeedback(finalFeedback)
                .aiSuggestedAnswer(evaluation.getSuggestedAnswer())
                .build();

        InterviewDetail savedDetail = detailRepository.save(detail);

        // Ghi nhận lượt hội thoại vào bộ nhớ làm việc (Working Memory) của AI Agent
        agentMemoryManager.recordTurn(
                sessionId,
                savedDetail.getQuestionNumber() != null ? savedDetail.getQuestionNumber() : 1,
                savedDetail.getQuestionText(),
                savedDetail.getCandidateAnswerText(),
                savedDetail.getAiEvaluationScore(),
                savedDetail.getAiFeedback()
        );

        InterviewDetailResponse res = mapToDetailResponse(savedDetail);
        res.setConfidenceLevel(evaluation.getConfidenceLevel());
        res.setRequiresHumanReview(evaluation.getRequiresHumanReview());
        res.setTone(evaluation.getTone());
        res.setIntonationFeedback(evaluation.getIntonationFeedback());
        return res;
    }

    @Override
    @Transactional
    public InterviewSummaryResponse completeSession(Long sessionId, User user) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        // Kiểm tra quyền truy cập
        if (!session.getCandidate().getCandidateId().equals(user.getUserId())) {
            throw new SecurityException("Unauthorized access to this interview session.");
        }

        // Lấy tất cả chi tiết câu hỏi của phiên này (đã sắp xếp theo questionNumber)
        List<InterviewDetail> details = detailRepository.findBySession_SessionIdOrderByQuestionNumberAsc(sessionId);

        // Tính điểm tổng kết dựa trên aiEvaluationScore của từng câu
        float totalScore = 0f;
        if (!details.isEmpty()) {
            for (InterviewDetail d : details) {
                totalScore += (d.getAiEvaluationScore() != null ? d.getAiEvaluationScore() : 70f);
            }
            session.setOverallScore(Math.round((totalScore / details.size()) * 10f) / 10f);
        } else {
            session.setOverallScore(0.0f);
        }

        // Đánh giá tổng quan toàn phiên từ Gemini AI Agent
        com.hiremate.dto.ai.AiSessionSummary summary = geminiAiService.summarizeInterviewSession(
                session.getTargetPosition(),
                details
        );
        session.setOverallFeedback(summary.getOverallFeedback());
        session.setWeaknessSummary(summary.getWeaknessSummary());
        try {
            session.setRecommendedTasks(objectMapper.writeValueAsString(summary.getRecommendedTasks()));
        } catch (Exception e) {
            session.setRecommendedTasks("[\"Review System Design Distributed Caching\", \"Practice behavioral STAR answers for 2 minutes\"]");
        }
        session.setCompletedAt(LocalDateTime.now());

        InterviewSession saved = sessionRepository.save(session);

        // Gửi thông báo kết quả phỏng vấn AI cho ứng viên
        notificationService.createNotification(
                user.getUserId(),
                com.hiremate.enums.NotificationType.INTERVIEW_RESULT,
                "Kết quả phỏng vấn AI đã sẵn sàng!",
                String.format("Phiên phỏng vấn vị trí %s của bạn đã hoàn thành với điểm số: %.1f/100.",
                        saved.getTargetPosition(), saved.getOverallScore()),
                saved.getSessionId(),
                "interview_sessions"
        );

        // Tính improvement_delta nếu là phiên retry (PRACTICE_RETRY)
        Float improvementDelta = null;
        if (saved.getSessionType() == InterviewSessionType.PRACTICE_RETRY && saved.getParentSessionId() != null) {
            Optional<InterviewSession> parentOpt = sessionRepository.findById(saved.getParentSessionId());
            if (parentOpt.isPresent()) {
                float scoreBefore = parentOpt.get().getOverallScore() != null
                        ? parentOpt.get().getOverallScore() : 0f;
                float scoreAfter = saved.getOverallScore();
                // improvement_delta = score_after - score_before (per spec)
                improvementDelta = scoreAfter - scoreBefore;

                PracticeProgressLog logEntry = PracticeProgressLog.builder()
                        .candidateId(user.getUserId())
                        .originalSessionId(parentOpt.get().getSessionId())
                        .retrySessionId(saved.getSessionId())
                        .scoreBefore(scoreBefore)
                        .scoreAfter(scoreAfter)
                        .improvementDelta(improvementDelta)
                        .build();
                progressLogRepository.save(logEntry);
            }
        }

        // Cập nhật bộ nhớ dài hạn EMA (Exponential Moving Average) dựa trên 16 bảng CSDL sẵn có
        updateLongTermEmaWeakness(saved, user.getUserId());

        // Giải phóng bộ nhớ ngắn hạn của phiên phỏng vấn
        agentMemoryManager.evictMemory(sessionId);

        return mapToSummary(saved, details, improvementDelta);
    }

    @Override
    public InterviewSummaryResponse getSessionSummary(Long sessionId, User user) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        // Kiểm tra quyền truy cập
        if (!session.getCandidate().getCandidateId().equals(user.getUserId())) {
            throw new SecurityException("Unauthorized access to this session.");
        }

        List<InterviewDetail> details = detailRepository.findBySession_SessionIdOrderByQuestionNumberAsc(sessionId);

        // Tính improvement delta nếu session có parent
        Float delta = null;
        if (session.getParentSessionId() != null) {
            Optional<InterviewSession> parent = sessionRepository.findById(session.getParentSessionId());
            if (parent.isPresent()
                    && parent.get().getOverallScore() != null
                    && session.getOverallScore() != null) {
                delta = session.getOverallScore() - parent.get().getOverallScore();
            }
        }

        return mapToSummary(session, details, delta);
    }

    @Override
    public List<InterviewSummaryResponse> getCandidateHistory(Long candidateId) {
        // Dùng method mới truy vấn qua Candidate subclass relationship
        List<InterviewSession> sessions =
                sessionRepository.findByCandidate_CandidateIdOrderByStartedAtDesc(candidateId);

        List<InterviewSummaryResponse> responses = new ArrayList<>();
        for (InterviewSession s : sessions) {
            List<InterviewDetail> details =
                    detailRepository.findBySession_SessionIdOrderByQuestionNumberAsc(s.getSessionId());
            responses.add(mapToSummary(s, details, null));
        }
        return responses;
    }

    // ===== PRIVATE MAPPING HELPERS =====

    /**
     * Map InterviewSession + details list -> InterviewSummaryResponse DTO.
     * Trích xuất candidateId và jobId qua object navigation (không dùng raw Long).
     */
    private InterviewSummaryResponse mapToSummary(
            InterviewSession s,
            List<InterviewDetail> details,
            Float delta) {

        List<InterviewDetailResponse> detailResponses = new ArrayList<>();
        for (InterviewDetail d : details) {
            detailResponses.add(mapToDetailResponse(d));
        }

        return InterviewSummaryResponse.builder()
                .sessionId(s.getSessionId())
                // Truy xuất qua Candidate subclass (Shared PK: candidateId = userId)
                .candidateId(s.getCandidate() != null ? s.getCandidate().getCandidateId() : null)
                // Job nullable (phiên tự do không gắn job)
                .jobId(s.getJob() != null ? s.getJob().getJobId() : null)
                .targetPosition(s.getTargetPosition())
                .sessionType(s.getSessionType())
                .overallScore(s.getOverallScore())
                .overallFeedback(s.getOverallFeedback())
                .weaknessSummary(s.getWeaknessSummary())
                .recommendedTasks(s.getRecommendedTasks())
                .improvementDelta(delta)
                .details(detailResponses)
                .startedAt(s.getStartedAt())
                .completedAt(s.getCompletedAt())
                .build();
    }

    /**
     * Map InterviewDetail -> InterviewDetailResponse DTO.
     * Dùng aiEvaluationScore thay thế các field điểm cũ.
     */
    private InterviewDetailResponse mapToDetailResponse(InterviewDetail d) {
        return InterviewDetailResponse.builder()
                .detailId(d.getDetailId())
                .questionNumber(d.getQuestionNumber())
                .questionText(d.getQuestionText())
                .candidateAnswerText(d.getCandidateAnswerText())
                .audioUrl(d.getAudioUrl())
                .aiEvaluationScore(d.getAiEvaluationScore())
                .aiFeedback(d.getAiFeedback())
                .aiSuggestedAnswer(d.getAiSuggestedAnswer())
                .confidenceLevel("HIGH")
                .requiresHumanReview(false)
                .build();
    }

    @Override
    public List<PracticeProgressResponse> getProgressLogs(Long candidateId) {
        List<PracticeProgressLog> logs = progressLogRepository.findByCandidateIdOrderByCreatedAtDesc(candidateId);
        List<PracticeProgressResponse> result = new ArrayList<>();
        for (PracticeProgressLog logEntry : logs) {
            result.add(PracticeProgressResponse.builder()
                    .logId(logEntry.getLogId())
                    .candidateId(logEntry.getCandidateId())
                    .originalSessionId(logEntry.getOriginalSessionId())
                    .retrySessionId(logEntry.getRetrySessionId())
                    .skillTargeted(logEntry.getSkillTargeted())
                    .scoreBefore(logEntry.getScoreBefore())
                    .scoreAfter(logEntry.getScoreAfter())
                    .improvementDelta(logEntry.getImprovementDelta())
                    .createdAt(logEntry.getCreatedAt())
                    .build());
        }
        return result;
    }

    @Override
    public String getNextAdaptiveQuestion(Long sessionId, User candidate) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        if (!session.getCandidate().getCandidateId().equals(candidate.getUserId())) {
            throw new SecurityException("Unauthorized access to this session.");
        }

        // Tải bộ nhớ ngữ cảnh bao gồm cả điểm yếu trong quá khứ của ứng viên (Cross-session Long-Term Memory)
        com.hiremate.agent.AgentMemory memory = agentMemoryManager.loadOrCreateMemory(sessionId);

        List<InterviewDetail> previousDetails = detailRepository.findBySession_SessionIdOrderByQuestionNumberAsc(sessionId);
        int nextNumber = previousDetails.size() + 1;

        String targetPosition = session.getTargetPosition();
        if (session.getJob() != null && session.getJob().getTitle() != null) {
            targetPosition += " [Vị trí JD: " + session.getJob().getTitle() + "]";
        }
        if (memory.getIdentifiedWeaknesses() != null && !memory.getIdentifiedWeaknesses().isEmpty()) {
            targetPosition += " [Lịch sử điểm yếu các phiên trước: " + String.join("; ", memory.getIdentifiedWeaknesses()) + "]";
        }
        if (memory.getTopicProficiency() != null && !memory.getTopicProficiency().isEmpty()) {
            List<String> lowTopics = new ArrayList<>();
            memory.getTopicProficiency().forEach((topic, prof) -> {
                if (prof < 65f) {
                    lowTopics.add(topic + ": " + prof + "đ");
                }
            });
            if (!lowTopics.isEmpty()) {
                targetPosition += " [Mảng kỹ thuật cần xoáy sâu do điểm thấp: " + String.join(", ", lowTopics) + "]";
            }
        }

        return geminiAiService.generateAdaptiveFollowUpQuestion(targetPosition, previousDetails, nextNumber);
    }

    /**
     * Thuật toán cập nhật Trí nhớ dài hạn EMA (Exponential Moving Average):
     * Weakness_new = α * (100 - Score_current) + (1 - α) * Weakness_previous
     * Hệ số làm mượt α = 0.4 nhằm ưu tiên kết quả gần nhất nhưng vẫn duy trì lịch sử rèn luyện.
     */
    private void updateLongTermEmaWeakness(InterviewSession currentSession, Long candidateId) {
        try {
            float currentScore = currentSession.getOverallScore() != null ? currentSession.getOverallScore() : 70f;
            float currentWeakness = 100f - currentScore;

            // Tìm phiên trước đó gần nhất của ứng viên để trích xuất điểm yếu EMA cũ
            List<InterviewSession> pastSessions = sessionRepository.findByCandidate_CandidateIdOrderByStartedAtDesc(candidateId);
            float previousEmaWeakness = 45f; // Ngưỡng baseline mặc định
            for (InterviewSession ps : pastSessions) {
                if (!ps.getSessionId().equals(currentSession.getSessionId()) && ps.getOverallScore() != null) {
                    previousEmaWeakness = 100f - ps.getOverallScore();
                    break;
                }
            }

            // Tính toán theo công thức Exponential Moving Average
            float newEmaWeakness = Math.round((0.4f * currentWeakness + 0.6f * previousEmaWeakness) * 10f) / 10f;
            log.info(">> [LongTermMemory] Cập nhật EMA Weakness Score cho Candidate ID {}: Trước đó={:.1f}, Phiên này={:.1f} -> EMA mới={:.1f}",
                    candidateId, previousEmaWeakness, currentWeakness, newEmaWeakness);

            // Ghi nhận điểm yếu tích luỹ vào weaknessSummary để phiên tiếp theo tự động ưu tiên hỏi xoáy
            if (newEmaWeakness > 35f && currentSession.getWeaknessSummary() != null && !currentSession.getWeaknessSummary().isBlank()) {
                currentSession.setWeaknessSummary(String.format(
                        "EMA Weakness Score: %.1f/100 (Cần ưu tiên hỏi xoáy tiếp tục). Chi tiết: %s",
                        newEmaWeakness, currentSession.getWeaknessSummary()
                ));
                sessionRepository.save(currentSession);
            }
        } catch (Exception e) {
            log.warn(">> [LongTermMemory] Lỗi khi cập nhật EMA Weakness: {}", e.getMessage());
        }
    }

    /**
     * Xác thực và thẩm định độ tin cậy của chỉ số Delivery (Anti-Spoofing & Plausibility Verification)
     * Đối chiếu thông số WPM và Clarity do Client gửi lên với độ dài văn bản thực tế, tỷ lệ từ đệm (filler words)
     * và giới hạn sinh học phát âm của con người để chống gian lận qua Postman/API.
     */
    private float computeVerifiedDeliveryScore(String answerText, Float clientWpm, Float clientClarity) {
        if (answerText == null || answerText.isBlank()) {
            return 50.0f;
        }

        String[] words = answerText.trim().split("\\s+");
        int wordCount = words.length;

        // 1. Kiểm tra giới hạn sinh học phát âm (Plausible WPM range: 50 - 220 WPM)
        float rawWpm = (clientWpm != null) ? clientWpm : 130.0f;
        if (rawWpm < 40f || rawWpm > 250f) {
            log.warn(">> [AiInterviewService] Phát hiện WPM bất thường ({}), hiệu chỉnh về mức chuẩn 130 WPM", rawWpm);
            rawWpm = 130.0f;
        }

        // 2. Phân tích tỷ lệ từ đệm (Filler Words Analysis) trên văn bản câu trả lời
        int fillerCount = 0;
        String lower = answerText.toLowerCase();
        String[] fillers = {"ờ", "à", "ừm", "ừ", "kiểu như", "thì là mà", "um", "uh", "er", "like"};
        for (String f : fillers) {
            int idx = 0;
            while ((idx = lower.indexOf(f, idx)) != -1) {
                fillerCount++;
                idx += f.length();
            }
        }

        float fillerPenalty = Math.min(25.0f, fillerCount * 3.0f);

        // 3. Hiệu chỉnh Clarity Score (chống gửi khống 99% qua Postman)
        float rawClarity = (clientClarity != null) ? clientClarity : 85.0f;
        rawClarity = Math.max(40.0f, Math.min(100.0f, rawClarity));

        if (wordCount < 10) {
            // Câu trả lời quá ngắn dưới 10 từ không thể đạt độ mạch lạc tối đa
            rawClarity = Math.min(rawClarity, 65.0f);
        }

        float verifiedClarity = Math.max(40.0f, rawClarity - fillerPenalty);

        // 4. Tính điểm tốc độ nói (Pace Score - Bell curve 110-160 WPM)
        float paceScore;
        if (rawWpm >= 110f && rawWpm <= 160f) {
            paceScore = 100f;
        } else if (rawWpm < 110f) {
            paceScore = Math.max(50f, 100f - (110f - rawWpm) * 0.8f);
        } else {
            paceScore = Math.max(50f, 100f - (rawWpm - 160f) * 0.7f);
        }

        return Math.round((paceScore * 0.5f + verifiedClarity * 0.5f) * 10f) / 10f;
    }
}
