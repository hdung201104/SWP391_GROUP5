package com.hiremate.service.impl;

import com.hiremate.dto.request.InterviewAnswerRequest;
import com.hiremate.dto.response.InterviewDetailResponse;
import com.hiremate.dto.response.InterviewSummaryResponse;
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

        // Tính toán điểm đánh giá tổng hợp (AI evaluation score) từ speech metrics
        float wpm = request.getWordsPerMinute() != null ? request.getWordsPerMinute() : 130f;
        float clarity = request.getClarityScore() != null ? request.getClarityScore() : 85f;

        // delivery component: tốc độ nói (wpm 100-160 là lý tưởng) + độ rõ ràng
        float deliveryScore = Math.min(100f, Math.max(50f, (wpm / 150f) * 50f + (clarity / 100f) * 50f));
        // content component: giả lập AI scoring (sẽ được thay bằng Gemini API thực tế)
        float contentScore = Math.min(100f, Math.max(60f, (float) (75 + Math.random() * 20)));

        // Điểm tổng hợp: 60% nội dung + 40% trình bày
        float aiEvaluationScore = Math.round((contentScore * 0.6f + deliveryScore * 0.4f) * 10f) / 10f;

        InterviewDetail detail = InterviewDetail.builder()
                .session(session)
                .questionNumber(request.getQuestionNumber() != null ? request.getQuestionNumber() : 1)
                .questionText(request.getQuestionText())
                .candidateAnswerText(request.getCandidateAnswerText())
                .audioUrl(request.getAudioUrl())
                .aiEvaluationScore(aiEvaluationScore)
                .aiFeedback(String.format(
                        "Good technical terminology. Speaking rate: %.0f WPM, Clarity: %.1f%%. "
                                + "Content depth and STAR method application is recommended.",
                        wpm, clarity))
                .aiSuggestedAnswer("Focus on STAR method: Situation, Task, Action, and quantifiable Results.")
                .build();

        InterviewDetail savedDetail = detailRepository.save(detail);
        return mapToDetailResponse(savedDetail);
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
            session.setOverallScore(78.5f);
        }

        session.setOverallFeedback(
                "Session completed with strong structural understanding. "
                        + "Keep refining concise delivery under pressure.");
        session.setWeaknessSummary("Elaboration on architectural trade-offs and edge cases.");
        session.setRecommendedTasks(
                "[\"Review System Design Distributed Caching\", \"Practice behavioral STAR answers for 2 minutes\"]");
        session.setCompletedAt(LocalDateTime.now());

        InterviewSession saved = sessionRepository.save(session);

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
                .build();
    }
}
