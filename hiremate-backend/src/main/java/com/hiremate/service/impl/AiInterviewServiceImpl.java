package com.hiremate.service.impl;

import com.hiremate.dto.request.InterviewAnswerRequest;
import com.hiremate.dto.response.InterviewDetailResponse;
import com.hiremate.dto.response.InterviewSummaryResponse;
import com.hiremate.entity.InterviewDetail;
import com.hiremate.entity.InterviewSession;
import com.hiremate.entity.PracticeProgressLog;
import com.hiremate.entity.User;
import com.hiremate.enums.InterviewSessionType;
import com.hiremate.repository.InterviewDetailRepository;
import com.hiremate.repository.InterviewSessionRepository;
import com.hiremate.repository.PracticeProgressLogRepository;
import com.hiremate.service.AiInterviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Override
    @Transactional
    public InterviewSummaryResponse startSession(
            String targetPosition,
            Long jobId,
            InterviewSessionType sessionType,
            Long parentSessionId,
            User candidate
    ) {
        InterviewSession session = InterviewSession.builder()
                .candidateId(candidate.getUserId())
                .jobId(jobId)
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
    public InterviewDetailResponse submitAnswer(Long sessionId, InterviewAnswerRequest request, User candidate) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        if (!session.getCandidateId().equals(candidate.getUserId())) {
            throw new SecurityException("Unauthorized access to this interview session.");
        }

        // Evaluation simulation based on speech delivery metrics
        float wpm = request.getWordsPerMinute() != null ? request.getWordsPerMinute() : 130f;
        float clarity = request.getClarityScore() != null ? request.getClarityScore() : 85f;
        float deliveryScore = Math.min(100f, Math.max(50f, (wpm / 150f) * 50f + (clarity / 100f) * 50f));
        float contentScore = Math.min(100f, Math.max(60f, (float) (75 + Math.random() * 20)));

        InterviewDetail detail = InterviewDetail.builder()
                .sessionId(sessionId)
                .questionNumber(request.getQuestionNumber() != null ? request.getQuestionNumber() : 1)
                .questionText(request.getQuestionText())
                .candidateAnswerText(request.getCandidateAnswerText())
                .audioUrl(request.getAudioUrl())
                .wordsPerMinute(wpm)
                .clarityScore(clarity)
                .deliveryScore(deliveryScore)
                .contentScore(contentScore)
                .aiFeedback(String.format("Good technical terminology. Speaking rate was %.0f WPM with %.1f%% clarity.", wpm, clarity))
                .aiSuggestedAnswer("Focus on STAR method: Situation, Task, Action, and quantifiable Results.")
                .build();

        InterviewDetail savedDetail = detailRepository.save(detail);

        return mapToDetailResponse(savedDetail);
    }

    @Override
    @Transactional
    public InterviewSummaryResponse completeSession(Long sessionId, User candidate) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        if (!session.getCandidateId().equals(candidate.getUserId())) {
            throw new SecurityException("Unauthorized access to this interview session.");
        }

        List<InterviewDetail> details = detailRepository.findBySessionIdOrderByQuestionNumberAsc(sessionId);

        float totalScore = 0f;
        if (!details.isEmpty()) {
            for (InterviewDetail d : details) {
                float qScore = ((d.getContentScore() != null ? d.getContentScore() : 70f) * 0.6f) +
                               ((d.getDeliveryScore() != null ? d.getDeliveryScore() : 70f) * 0.4f);
                totalScore += qScore;
            }
            session.setOverallScore(Math.round((totalScore / details.size()) * 10f) / 10f);
        } else {
            session.setOverallScore(78.5f);
        }

        session.setOverallFeedback("Session completed with strong structural understanding. Keep refining concise delivery under pressure.");
        session.setWeaknessSummary("Elaboration on architectural trade-offs and edge cases.");
        session.setRecommendedTasks("[\"Review System Design Distributed Caching\", \"Practice behavioral STAR answers for 2 minutes\"]");

        InterviewSession saved = sessionRepository.save(session);

        Float improvementDelta = null;
        // Practice improvement calculation: improvement_delta = score_after - score_before
        if (saved.getSessionType() == InterviewSessionType.PRACTICE_RETRY && saved.getParentSessionId() != null) {
            Optional<InterviewSession> parentOpt = sessionRepository.findById(saved.getParentSessionId());
            if (parentOpt.isPresent()) {
                float scoreBefore = parentOpt.get().getOverallScore() != null ? parentOpt.get().getOverallScore() : 0f;
                float scoreAfter = saved.getOverallScore();
                improvementDelta = scoreAfter - scoreBefore;

                PracticeProgressLog logEntry = PracticeProgressLog.builder()
                        .candidateId(candidate.getUserId())
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
    public InterviewSummaryResponse getSessionSummary(Long sessionId, User candidate) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        if (!session.getCandidateId().equals(candidate.getUserId())) {
            throw new SecurityException("Unauthorized access to this session.");
        }

        List<InterviewDetail> details = detailRepository.findBySessionIdOrderByQuestionNumberAsc(sessionId);
        Float delta = null;
        if (session.getParentSessionId() != null) {
            Optional<InterviewSession> parent = sessionRepository.findById(session.getParentSessionId());
            if (parent.isPresent() && parent.get().getOverallScore() != null && session.getOverallScore() != null) {
                delta = session.getOverallScore() - parent.get().getOverallScore();
            }
        }

        return mapToSummary(session, details, delta);
    }

    @Override
    public List<InterviewSummaryResponse> getCandidateHistory(Long candidateId) {
        List<InterviewSession> sessions = sessionRepository.findByCandidateIdOrderByCreatedAtDesc(candidateId);
        List<InterviewSummaryResponse> responses = new ArrayList<>();
        for (InterviewSession s : sessions) {
            List<InterviewDetail> details = detailRepository.findBySessionIdOrderByQuestionNumberAsc(s.getSessionId());
            responses.add(mapToSummary(s, details, null));
        }
        return responses;
    }

    private InterviewSummaryResponse mapToSummary(InterviewSession s, List<InterviewDetail> details, Float delta) {
        List<InterviewDetailResponse> detailResponses = new ArrayList<>();
        for (InterviewDetail d : details) {
            detailResponses.add(mapToDetailResponse(d));
        }

        return InterviewSummaryResponse.builder()
                .sessionId(s.getSessionId())
                .candidateId(s.getCandidateId())
                .jobId(s.getJobId())
                .targetPosition(s.getTargetPosition())
                .sessionType(s.getSessionType())
                .overallScore(s.getOverallScore())
                .overallFeedback(s.getOverallFeedback())
                .weaknessSummary(s.getWeaknessSummary())
                .recommendedTasks(s.getRecommendedTasks())
                .improvementDelta(delta)
                .details(detailResponses)
                .createdAt(s.getCreatedAt())
                .build();
    }

    private InterviewDetailResponse mapToDetailResponse(InterviewDetail d) {
        return InterviewDetailResponse.builder()
                .detailId(d.getDetailId())
                .sessionId(d.getSessionId())
                .questionNumber(d.getQuestionNumber())
                .questionText(d.getQuestionText())
                .candidateAnswerText(d.getCandidateAnswerText())
                .audioUrl(d.getAudioUrl())
                .contentScore(d.getContentScore())
                .deliveryScore(d.getDeliveryScore())
                .wordsPerMinute(d.getWordsPerMinute())
                .clarityScore(d.getClarityScore())
                .aiFeedback(d.getAiFeedback())
                .aiSuggestedAnswer(d.getAiSuggestedAnswer())
                .build();
    }
}
