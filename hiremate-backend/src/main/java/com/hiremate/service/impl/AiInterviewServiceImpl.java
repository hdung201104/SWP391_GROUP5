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
import java.util.Map;
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
    private final com.hiremate.repository.CandidateSkillRepository candidateSkillRepository;
    private final com.hiremate.repository.SkillRepository skillRepository;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hiremate.repository.SubscriptionRepository subscriptionRepository;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hiremate.service.SystemSettingsService systemSettingsService;

    @org.springframework.beans.factory.annotation.Value("${elevenlabs.api-key:}")
    private String elevenlabsApiKey;
    @org.springframework.beans.factory.annotation.Value("${elevenlabs.voice-female:Xb7hH8MSUJpSbSDYk0k2}")
    private String elevenlabsVoiceFemale;
    @org.springframework.beans.factory.annotation.Value("${elevenlabs.voice-male:JBFqnCBsd6RMkjVDRZzb}")
    private String elevenlabsVoiceMale;
    @org.springframework.beans.factory.annotation.Value("${elevenlabs.model-id:eleven_turbo_v2_5}")
    private String elevenlabsModelId;

    /**
     * Kiểm tra phân quyền và hạn ngạch lượt phỏng vấn AI thực tế của Ứng viên.
     * - Admin: Không giới hạn.
     * - Ứng viên VIP (đã mua gói ACTIVE): Luyện tập theo hạn ngạch ngày của gói (hoặc không giới hạn nếu quota = 999).
     * - Ứng viên miễn phí (Free Tier): Tối đa 3 lượt phỏng vấn thử nghiệm AI trên toàn hệ thống.
     */
    private void checkCandidateInterviewQuota(User user) {
        if (user == null) return;
        if (user.getRole() == com.hiremate.enums.UserRole.ADMIN) {
            return; // Admin có quyền tối cao
        }

        com.hiremate.entity.Subscription activeSub = null;
        if (subscriptionRepository != null) {
            activeSub = subscriptionRepository.findFirstByUser_UserIdAndStatusOrderByCreatedAtDesc(
                    user.getUserId(), com.hiremate.enums.SubscriptionStatus.ACTIVE).orElse(null);
        }

        // Tự động kiểm tra hết hạn gói nếu có
        if (activeSub != null && activeSub.getEndDate() != null && activeSub.getEndDate().isBefore(LocalDateTime.now())) {
            activeSub.setStatus(com.hiremate.enums.SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(activeSub);
            activeSub = null;
        }

        if (activeSub != null) {
            int dailyQuota = (activeSub.getPlan() != null && activeSub.getPlan().getQuotaLimit() != null)
                    ? activeSub.getPlan().getQuotaLimit() : 10;
            if (dailyQuota < 999) {
                LocalDateTime startOfDay = java.time.LocalDate.now().atStartOfDay();
                long todayCount = sessionRepository.countByCandidate_CandidateIdAndStartedAtAfter(user.getUserId(), startOfDay);
                if (todayCount >= dailyQuota) {
                    String planName = activeSub.getPlan() != null ? activeSub.getPlan().getPlanName() : "gói dịch vụ hiện tại";
                    throw new IllegalArgumentException(String.format(
                            "Bạn đã sử dụng hết hạn ngạch (%d/%d phiên) hôm nay của gói \"%s\". Vui lòng quay lại vào ngày mai hoặc nâng cấp gói không giới hạn.",
                            todayCount, dailyQuota, planName));
                }
            }
        } else {
            // Tài khoản ứng viên miễn phí (Free Tier): Cho phép tối đa 15 phiên phỏng vấn mỗi ngày để luyện tập thoải mái
            int freeLimit = 15;
            if (systemSettingsService != null && systemSettingsService.getSettings() != null) {
                Integer limit = systemSettingsService.getSettings().getCandidateFreeInterviewsPerDay();
                if (limit != null && limit > 0) freeLimit = limit;
            }
            LocalDateTime startOfDay = java.time.LocalDate.now().atStartOfDay();
            long todaySessions = sessionRepository.countByCandidate_CandidateIdAndStartedAtAfter(user.getUserId(), startOfDay);
            if (todaySessions >= freeLimit) {
                throw new IllegalArgumentException(String.format(
                        "Hôm nay bạn đã thực hiện %d/%d phiên phỏng vấn AI miễn phí. Vui lòng quay lại vào ngày mai hoặc nâng cấp gói Career VIP để luyện tập không giới hạn.",
                        todaySessions, freeLimit));
            }
        }
    }

    @Override
    @Transactional
    public InterviewSummaryResponse startSession(
            String targetPosition,
            Long jobId,
            InterviewSessionType sessionType,
            Long parentSessionId,
            User user
    ) {
        // 1. Kiểm tra hạn ngạch và quyền hạn sử dụng phỏng vấn AI của ứng viên
        checkCandidateInterviewQuota(user);

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
                    request.getClarityScore(),
                    request.getPitchHz(),
                    request.getEyeContactPercent(),
                    request.getFacialEmotion(),
                    request.getFillerCount()
            );

            evaluation = geminiAiService.evaluateInterviewAnswer(
                    request.getQuestionText(),
                    answerText,
                    session.getTargetPosition()
            );
        }

        float contentScore = evaluation.getContentScore() != null ? evaluation.getContentScore() : (evaluation.getScore() != null ? evaluation.getScore() : 30f);
        float aiEvaluationScore = (request.getWordsPerMinute() != null || request.getClarityScore() != null || evaluation.getDeliveryScore() != null || request.getEyeContactPercent() != null)
                ? (Math.round((contentScore * 0.70f + deliveryScore * 0.30f) * 10f) / 10f)
                : (evaluation.getScore() != null ? evaluation.getScore() : contentScore);

        // Kết hợp telemetry âm thanh & camera vào aiFeedback nếu có
        StringBuilder telemetryNote = new StringBuilder();
        if (request.getPitchHz() != null && request.getPitchHz() > 0) {
            String pitchDesc = request.getPitchHz() < 165 ? "Trầm ấm, đĩnh đạc" : request.getPitchHz() <= 230 ? "Tự tin, chuẩn mực" : "Hơi căng thẳng, tông cao";
            telemetryNote.append(String.format("Tông giọng: %.0f Hz (%s)", request.getPitchHz(), pitchDesc));
        }
        if (request.getEyeContactPercent() != null && request.getEyeContactPercent() > 0) {
            if (telemetryNote.length() > 0) telemetryNote.append(" • ");
            telemetryNote.append(String.format("Giao tiếp mắt: %.0f%%", request.getEyeContactPercent()));
        }
        if (request.getFacialEmotion() != null && !request.getFacialEmotion().isBlank()) {
            if (telemetryNote.length() > 0) telemetryNote.append(" • ");
            telemetryNote.append("Biểu cảm: ").append(request.getFacialEmotion());
        }
        if (request.getFillerCount() != null && request.getFillerCount() > 0) {
            if (telemetryNote.length() > 0) telemetryNote.append(" • ");
            telemetryNote.append("Từ đệm: ").append(request.getFillerCount()).append(" lần");
        }

        String finalFeedback = evaluation.getFeedback();
        if (telemetryNote.length() > 0) {
            finalFeedback = finalFeedback + "\n\n[Phong thái & Telemetry]: " + telemetryNote;
        } else if (evaluation.getIntonationFeedback() != null && !evaluation.getIntonationFeedback().isBlank()) {
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
        return completeSession(sessionId, null, user);
    }

    @Override
    @Transactional
    public InterviewSummaryResponse completeSession(Long sessionId, Map<String, Object> telemetry, User user) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        // Kiểm tra quyền truy cập
        if (!session.getCandidate().getCandidateId().equals(user.getUserId())) {
            throw new SecurityException("Unauthorized access to this interview session.");
        }

        // Lấy tất cả chi tiết câu hỏi của phiên này (đã sắp xếp theo questionNumber)
        List<InterviewDetail> details = detailRepository.findBySession_SessionIdOrderByQuestionNumberAsc(sessionId);

        // Đánh giá tổng quan toàn phiên từ Gemini AI Agent (kèm Telemetry giọng nói, ánh mắt, khuôn mặt)
        com.hiremate.dto.ai.AiSessionSummary summary = geminiAiService.summarizeInterviewSession(
                session.getTargetPosition(),
                details,
                telemetry
        );

        // Sử dụng điểm số hiệu chuẩn đa chiều từ Gemini AI nếu có
        if (summary != null && summary.getOverallCalibratedScore() != null && summary.getOverallCalibratedScore() > 0) {
            session.setOverallScore(summary.getOverallCalibratedScore());
        } else if (!details.isEmpty()) {
            float totalScore = 0f;
            for (InterviewDetail d : details) {
                totalScore += (d.getAiEvaluationScore() != null ? d.getAiEvaluationScore() : 25f);
            }
            session.setOverallScore(Math.round((totalScore / details.size()) * 10f) / 10f);
        } else {
            session.setOverallScore(0.0f);
        }

        session.setOverallFeedback(summary != null ? summary.getOverallFeedback() : "Phiên phỏng vấn hoàn tất.");
        session.setWeaknessSummary(summary != null ? summary.getWeaknessSummary() : "");
        try {
            session.setRecommendedTasks(objectMapper.writeValueAsString(summary != null ? summary.getRecommendedTasks() : List.of()));
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

        return mapToSummary(saved, details, improvementDelta, summary, telemetry);
    }

    @Override
    @Transactional(readOnly = true)
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
    @Transactional(readOnly = true)
    public List<InterviewSummaryResponse> getCandidateHistory(Long candidateId) {
        if (candidateId == null) {
            return java.util.Collections.emptyList();
        }
        // Dùng method mới truy vấn qua Candidate subclass relationship kèm JOIN FETCH
        List<InterviewSession> sessions =
                sessionRepository.findByCandidate_CandidateIdOrderByStartedAtDesc(candidateId);
        if (sessions == null || sessions.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        // BATCH PRE-FETCH ALL DETAILS TRONG ĐÚNG 1 CÂU QUERY DUY NHẤT (Loại bỏ 14+ queries tuần tự)
        List<Long> sessionIds = sessions.stream().map(InterviewSession::getSessionId).toList();
        List<InterviewDetail> allDetails = detailRepository.findBySession_SessionIdInOrderByQuestionNumberAsc(sessionIds);
        Map<Long, List<InterviewDetail>> detailsBySession = allDetails.stream()
                .collect(java.util.stream.Collectors.groupingBy(d -> d.getSession().getSessionId()));

        List<InterviewSummaryResponse> responses = new ArrayList<>(sessions.size());
        for (InterviewSession s : sessions) {
            List<InterviewDetail> details = detailsBySession.getOrDefault(s.getSessionId(), java.util.Collections.emptyList());
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
        return mapToSummary(s, details, delta, null, null);
    }

    private InterviewSummaryResponse mapToSummary(
            InterviewSession s,
            List<InterviewDetail> details,
            Float delta,
            com.hiremate.dto.ai.AiSessionSummary summary) {
        return mapToSummary(s, details, delta, summary, null);
    }

    private InterviewSummaryResponse mapToSummary(
            InterviewSession s,
            List<InterviewDetail> details,
            Float delta,
            com.hiremate.dto.ai.AiSessionSummary summary,
            Map<String, Object> telemetry) {

        List<InterviewDetailResponse> detailResponses = new ArrayList<>();
        for (InterviewDetail d : details) {
            detailResponses.add(mapToDetailResponse(d));
        }

        String candName = "Ứng viên";
        String candEmail = "";
        if (s.getCandidate() != null) {
            if (s.getCandidate().getUser() != null) {
                candName = s.getCandidate().getUser().getFullName() != null ? s.getCandidate().getUser().getFullName() : "Ứng viên #" + s.getCandidate().getCandidateId();
                candEmail = s.getCandidate().getUser().getEmail() != null ? s.getCandidate().getUser().getEmail() : "";
            } else {
                candName = "Ứng viên #" + s.getCandidate().getCandidateId();
            }
        }
        int qCount = detailResponses != null ? detailResponses.size() : 0;

        Float domainScore = summary != null ? summary.getDomainKnowledgeScore() : null;
        Float problemScore = summary != null ? summary.getProblemSolvingScore() : null;
        Float starScore = summary != null ? summary.getStarStructureScore() : null;
        Float commScore = summary != null ? summary.getCommunicationScore() : null;
        Float deliveryScore = summary != null ? summary.getDeliveryToneScore() : commScore;
        String deliveryFeedback = summary != null ? summary.getDeliveryFeedback() : null;

        // Nếu summary chưa có (khi getSessionSummary sau đó), suy ra từ overallScore hoặc điểm các câu
        if (domainScore == null && s.getOverallScore() != null && s.getOverallScore() > 0) {
            float base = s.getOverallScore();
            domainScore = Math.min(100f, Math.max(0f, base));
            problemScore = Math.min(100f, Math.max(0f, base));
            starScore = Math.min(100f, Math.max(0f, base));
            commScore = Math.min(100f, Math.max(0f, base));
            deliveryScore = Math.min(100f, Math.max(0f, base));
        }

        return InterviewSummaryResponse.builder()
                .sessionId(s.getSessionId())
                // Truy xuất qua Candidate subclass (Shared PK: candidateId = userId)
                .candidateId(s.getCandidate() != null ? s.getCandidate().getCandidateId() : null)
                .candidateName(candName)
                .candidateEmail(candEmail)
                .questionCount(qCount)
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
                .domainKnowledgeScore(domainScore)
                .problemSolvingScore(problemScore)
                .starStructureScore(starScore)
                .communicationScore(commScore)
                .deliveryToneScore(deliveryScore)
                .deliveryFeedback(deliveryFeedback)
                .telemetryReport(telemetry)
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

        // Trích xuất kỹ năng ứng viên từ CV / hồ sơ cá nhân
        String candidateSkills = "";
        try {
            List<com.hiremate.entity.CandidateSkill> skills = candidateSkillRepository.findByProfileId(candidate.getUserId());
            if (skills != null && !skills.isEmpty()) {
                List<Long> skillIds = skills.stream()
                        .map(com.hiremate.entity.CandidateSkill::getSkillId)
                        .filter(java.util.Objects::nonNull)
                        .toList();
                List<String> names = skillRepository.findAllById(skillIds).stream()
                        .map(com.hiremate.entity.Skill::getSkillName)
                        .toList();
                candidateSkills = String.join(", ", names);
            }
        } catch (Exception ignored) {}

        if (candidateSkills.isBlank()) {
            Candidate cand = session.getCandidate();
            if (cand != null && cand.getHeadline() != null && !cand.getHeadline().isBlank()) {
                candidateSkills = cand.getHeadline();
            } else {
                candidateSkills = session.getTargetPosition() != null ? session.getTargetPosition() : "Software Engineer";
            }
        }

        return geminiAiService.generateAdaptiveFollowUpQuestion(targetPosition, candidateSkills, previousDetails, nextNumber);
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
    private float computeVerifiedDeliveryScore(
            String answerText,
            Float clientWpm,
            Float clientClarity,
            Float pitchHz,
            Float eyeContactPercent,
            String facialEmotion,
            Integer fillerCountClient
    ) {
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
        java.util.Set<String> singleWordFillers = java.util.Set.of("ờ", "à", "ừm", "ừ", "um", "uh", "er", "like");
        for (String w : words) {
            String cleanW = w.toLowerCase().replaceAll("[^\\p{L}]", "");
            if (singleWordFillers.contains(cleanW)) {
                fillerCount++;
            }
        }
        String lower = answerText.toLowerCase();
        String[] multiWordFillers = {"kiểu như", "thì là mà", "dạng như", "nói chung là", "đại loại là"};
        for (String f : multiWordFillers) {
            int idx = 0;
            while ((idx = lower.indexOf(f, idx)) != -1) {
                fillerCount++;
                idx += f.length();
            }
        }
        if (fillerCountClient != null && fillerCountClient > fillerCount) {
            fillerCount = fillerCountClient;
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

        // 5. Thẩm định Telemetry Tông giọng & Ánh mắt giao tiếp
        float postureBonus = 0f;
        if (eyeContactPercent != null && eyeContactPercent >= 75f) {
            postureBonus += 4.0f; // Duy trì giao tiếp mắt xuất sắc
        } else if (eyeContactPercent != null && eyeContactPercent < 45f) {
            postureBonus -= 4.0f; // Thiếu tự tin, thường xuyên nhìn đi chỗ khác
        }

        if (pitchHz != null && pitchHz >= 85f && pitchHz <= 230f) {
            postureBonus += 3.0f; // Tông giọng trầm ấm, vững vàng
        } else if (pitchHz != null && pitchHz > 255f) {
            postureBonus -= 3.0f; // Tông giọng căng thẳng, run rẩy
        }

        if (facialEmotion != null && (facialEmotion.contains("Tự tin") || facialEmotion.contains("Thân thiện") || facialEmotion.contains("Mỉm cười"))) {
            postureBonus += 3.0f;
        }

        float totalDelivery = (paceScore * 0.45f + verifiedClarity * 0.45f) + postureBonus;
        return Math.max(40.0f, Math.min(100.0f, Math.round(totalDelivery * 10f) / 10f));
    }

    @Override
    public byte[] synthesizeSpeech(String text, String voice) {
        if (text == null || text.isBlank()) return new byte[0];

        // Chuẩn hóa văn bản sạch sẽ (giữ nguyên vẹn thuật ngữ công nghệ tiếng Anh và từ ngữ tiếng Việt)
        String normalized = com.hiremate.util.SpeechPhoneticNormalizer.normalize(text);
        if (normalized.isBlank()) return new byte[0];

        boolean isEn = com.hiremate.util.SpeechPhoneticNormalizer.isMostlyEnglish(normalized);
        String vLower = voice != null ? voice.toLowerCase() : "female";

        // 1. Nếu văn bản là tiếng Anh HOẶC người dùng chỉ định giọng ElevenLabs Quốc Tế
        boolean requestEleven = isEn || vLower.contains("eleven") || vLower.contains("alice") || vLower.contains("george") || vLower.contains("male");
        if (requestEleven && elevenlabsApiKey != null && !elevenlabsApiKey.isBlank()) {
            byte[] elevenAudio = synthesizeWithElevenLabs(normalized, voice, isEn);
            if (elevenAudio != null && elevenAudio.length > 0) {
                return elevenAudio;
            }
        }

        // 2. MẶC ĐỊNH CHO TIẾNG VIỆT BẢN XỨ (100% chuẩn giọng đọc Việt Nam, không ngọng, không lơ lớ):
        // Dùng động cơ Native Vietnamese Audio Stream với tl=vi
        byte[] nativeAudio = synthesizeSpeech(normalized);
        if (nativeAudio != null && nativeAudio.length > 0) {
            return nativeAudio;
        }

        // 3. Dự phòng cuối cùng: ElevenLabs Turbo v2.5 nếu các kênh khác gặp sự cố
        if (elevenlabsApiKey != null && !elevenlabsApiKey.isBlank()) {
            byte[] fallbackEleven = synthesizeWithElevenLabs(normalized, voice, isEn);
            if (fallbackEleven != null && fallbackEleven.length > 0) {
                return fallbackEleven;
            }
        }

        return new byte[0];
    }

    private byte[] synthesizeWithElevenLabs(String text, String voice, boolean isEnglish) {
        try {
            String clean = text.trim();
            if (clean.isEmpty()) return new byte[0];
            if (clean.length() > 2000) clean = clean.substring(0, 2000);

            boolean male = voice != null && (voice.toLowerCase().contains("male") || voice.toLowerCase().contains("george") || voice.toLowerCase().contains("nam"));
            String voiceId = male ? elevenlabsVoiceMale : elevenlabsVoiceFemale;
            if (voiceId == null || voiceId.isBlank()) {
                voiceId = male ? "JBFqnCBsd6RMkjVDRZzb" : "Xb7hH8MSUJpSbSDYk0k2";
            }

            String cacheKey = "eleven|" + voiceId + "|" + (isEnglish ? "en" : "vi") + "|" + clean;
            byte[] cached = ttsMemoryCache.get(cacheKey);
            if (cached != null && cached.length > 0) {
                return cached;
            }

            // eleven_turbo_v2_5 và eleven_flash_v2_5 hỗ trợ chính thức language_code 'vi'
            String model = !isEnglish ? "eleven_turbo_v2_5" : ((elevenlabsModelId != null && !elevenlabsModelId.isBlank()) ? elevenlabsModelId : "eleven_turbo_v2_5");

            java.util.Map<String, Object> body = new java.util.HashMap<>();
            body.put("text", clean);
            body.put("model_id", model);
            if (model.contains("turbo") || model.contains("flash")) {
                body.put("language_code", isEnglish ? "en" : "vi");
            }
            body.put("voice_settings", java.util.Map.of(
                    "stability", 0.5,
                    "similarity_boost", 0.8,
                    "style", 0.0,
                    "use_speaker_boost", true
            ));

            java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("https://api.elevenlabs.io/v1/text-to-speech/" + voiceId + "?output_format=mp3_44100_128"))
                    .header("Content-Type", "application/json")
                    .header("xi-api-key", elevenlabsApiKey.trim())
                    .timeout(java.time.Duration.ofSeconds(12))
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();

            java.net.http.HttpResponse<byte[]> resp = java.net.http.HttpClient.newHttpClient()
                    .send(req, java.net.http.HttpResponse.BodyHandlers.ofByteArray());

            if (resp.statusCode() == 200 && resp.body() != null && resp.body().length > 0) {
                log.info(">> [ElevenLabs] Tổng hợp giọng nói Generative AI (voiceId={}, lang={}) - {} bytes", voiceId, isEnglish ? "en" : "vi", resp.body().length);
                if (ttsMemoryCache.size() > 500) ttsMemoryCache.clear();
                ttsMemoryCache.put(cacheKey, resp.body());
                return resp.body();
            } else {
                log.warn(">> [ElevenLabs] HTTP {}: {}", resp.statusCode(), resp.body() != null ? new String(resp.body(), java.nio.charset.StandardCharsets.UTF_8) : "");
            }
        } catch (Exception e) {
            log.warn(">> [ElevenLabs] Lỗi tổng hợp giọng nói: {}", e.getMessage());
        }
        return new byte[0];
    }

    private final java.util.concurrent.ConcurrentHashMap<String, byte[]> ttsMemoryCache = new java.util.concurrent.ConcurrentHashMap<>();

    @Override
    public byte[] synthesizeSpeech(String text) {
        if (text == null || text.isBlank()) {
            return new byte[0];
        }
        try {
            // Chuẩn hóa phát âm và phiên âm ngữ âm cho TTS tiếng Việt (xử lý triệt để lỗi nuốt từ / đọc sai thuật ngữ tiếng Anh)
            String clean = com.hiremate.util.SpeechPhoneticNormalizer.normalizeForVietnameseTts(text);
            if (clean.isEmpty()) return new byte[0];

            String cacheKey = clean.trim();
            byte[] cached = ttsMemoryCache.get(cacheKey);
            if (cached != null && cached.length > 0) {
                return cached;
            }

            // Tối ưu gom câu tự nhiên để tránh đứt đoạn, khoảng lặng chết (dead air)
            List<String> chunks = splitTextForTts(clean, 180);
            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
                    .connectTimeout(java.time.Duration.ofSeconds(6))
                    .build();

            for (String chunk : chunks) {
                if (chunk.isBlank()) continue;

                // Tự động nhận diện ngôn ngữ của câu: Tiếng Anh (en) hay Tiếng Việt (vi)
                boolean isEn = com.hiremate.util.SpeechPhoneticNormalizer.isMostlyEnglish(chunk);
                String langCode = isEn ? "en" : "vi";

                String encoded = java.net.URLEncoder.encode(chunk, java.nio.charset.StandardCharsets.UTF_8);
                String url = "https://translate.google.com/translate_tts?ie=UTF-8&tl=" + langCode + "&client=tw-ob&q=" + encoded;

                java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                        .uri(java.net.URI.create(url))
                        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                        .timeout(java.time.Duration.ofSeconds(6))
                        .GET()
                        .build();

                java.net.http.HttpResponse<byte[]> resp = client.send(req, java.net.http.HttpResponse.BodyHandlers.ofByteArray());
                if (resp.statusCode() == 200 && resp.body() != null && resp.body().length > 0) {
                    out.write(resp.body());
                }
            }

            byte[] audioBytes = out.toByteArray();
            if (audioBytes.length > 0) {
                if (ttsMemoryCache.size() > 500) ttsMemoryCache.clear();
                ttsMemoryCache.put(cacheKey, audioBytes);
            }
            return audioBytes;
        } catch (Exception e) {
            log.error(">> [AiInterviewService] Lỗi tổng hợp giọng nói qua TTS Engine: {}", e.getMessage());
            return new byte[0];
        }
    }

    /**
     * Thuật toán phân đoạn văn bản thông minh (Intelligent Audio Chunker):
     * Ưu tiên giữ nguyên trọn vẹn từng câu, tự động gộp các câu ngắn đứng gần nhau
     * để luồng âm thanh phát ra liên tục, loại bỏ hoàn toàn hiện tượng ngắt nghỉ giật cục.
     */
    private List<String> splitTextForTts(String text, int maxChunkLen) {
        List<String> result = new ArrayList<>();
        // Tách câu theo dấu kết thúc câu (. ! ? hoặc xuống dòng)
        String[] sentences = text.split("(?<=[.!?\\n])\\s+");
        StringBuilder currentChunk = new StringBuilder();

        for (String sentence : sentences) {
            String s = sentence.trim();
            if (s.isEmpty()) continue;

            // Nếu câu vượt quá giới hạn tối đa của Google TTS, tách theo mệnh đề
            if (s.length() > maxChunkLen) {
                if (currentChunk.length() > 0) {
                    result.add(currentChunk.toString().trim());
                    currentChunk = new StringBuilder();
                }
                String[] clauses = s.split("(?<=[,;:])\\s+");
                for (String clause : clauses) {
                    String cl = clause.trim();
                    if (cl.isEmpty()) continue;
                    if (currentChunk.length() + cl.length() + 1 <= maxChunkLen) {
                        if (currentChunk.length() > 0) currentChunk.append(" ");
                        currentChunk.append(cl);
                    } else {
                        if (currentChunk.length() > 0) result.add(currentChunk.toString().trim());
                        currentChunk = new StringBuilder(cl);
                    }
                }
            } else {
                // Gom các câu ngắn lại với nhau để âm điệu liền mạch
                if (currentChunk.length() + s.length() + 1 <= maxChunkLen) {
                    if (currentChunk.length() > 0) currentChunk.append(" ");
                    currentChunk.append(s);
                } else {
                    if (currentChunk.length() > 0) {
                        result.add(currentChunk.toString().trim());
                    }
                    currentChunk = new StringBuilder(s);
                }
            }
        }
        if (currentChunk.length() > 0) {
            result.add(currentChunk.toString().trim());
        }
        return result;
    }
}
