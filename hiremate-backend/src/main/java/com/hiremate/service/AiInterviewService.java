package com.hiremate.service;

import com.hiremate.dto.request.InterviewAnswerRequest;
import com.hiremate.dto.response.InterviewDetailResponse;
import com.hiremate.dto.response.InterviewSummaryResponse;
import com.hiremate.dto.response.PracticeProgressResponse;
import com.hiremate.entity.User;
import com.hiremate.enums.InterviewSessionType;

import java.util.List;

public interface AiInterviewService {
    InterviewSummaryResponse startSession(String targetPosition, Long jobId, InterviewSessionType sessionType, Long parentSessionId, User candidate);
    InterviewDetailResponse submitAnswer(Long sessionId, InterviewAnswerRequest request, User candidate);
    InterviewSummaryResponse completeSession(Long sessionId, User candidate);
    InterviewSummaryResponse getSessionSummary(Long sessionId, User candidate);
    List<InterviewSummaryResponse> getCandidateHistory(Long candidateId);
    List<PracticeProgressResponse> getProgressLogs(Long candidateId);
    String getNextAdaptiveQuestion(Long sessionId, User candidate);
}

