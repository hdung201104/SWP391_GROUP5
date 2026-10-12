package com.hiremate.controller;

import com.hiremate.dto.request.InterviewAnswerRequest;
import com.hiremate.dto.response.ApiResponse;
import com.hiremate.dto.response.InterviewDetailResponse;
import com.hiremate.dto.response.InterviewSummaryResponse;
import com.hiremate.dto.response.PracticeProgressResponse;
import com.hiremate.entity.User;
import com.hiremate.enums.InterviewSessionType;
import com.hiremate.service.AiInterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ai-interviews")
@RequiredArgsConstructor
public class AiInterviewController {

    private final AiInterviewService aiInterviewService;
    private final com.hiremate.service.GeminiAiService geminiAiService;

    @GetMapping("/generate-questions")
    public ResponseEntity<ApiResponse<List<String>>> generateQuestions(
            @RequestParam(required = false, defaultValue = "Software Engineer") String targetPosition,
            @RequestParam(required = false, defaultValue = "Middle") String level,
            @RequestParam(required = false, defaultValue = "5") int count
    ) {
        List<String> questions = geminiAiService.generateInterviewQuestions(targetPosition, level, count);
        return ResponseEntity.ok(ApiResponse.ok("Generated interview questions", questions));
    }

    @PostMapping("/start")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<InterviewSummaryResponse>> startSession(
            @RequestParam(required = false, defaultValue = "Fullstack Engineer") String targetPosition,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String interviewType,
            @RequestParam(required = false) Long jobId,
            @RequestParam(required = false, defaultValue = "MOCK") InterviewSessionType sessionType,
            @RequestParam(required = false) Long parentSessionId,
            @AuthenticationPrincipal User user
    ) {
        String configuredPosition = targetPosition;
        if (level != null && !level.isBlank() && !targetPosition.toLowerCase().contains(level.toLowerCase())) {
            configuredPosition = level.trim() + " " + targetPosition.trim();
        }
        if (interviewType != null && !interviewType.isBlank() && !"MIXED".equalsIgnoreCase(interviewType)) {
            configuredPosition += " [" + interviewType.trim() + "]";
        }

        InterviewSummaryResponse response = aiInterviewService.startSession(configuredPosition, jobId, sessionType, parentSessionId, user);
        return ResponseEntity.ok(ApiResponse.ok("Interview session started", response));
    }

    @GetMapping("/{sessionId}/next-question")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<String>> getNextAdaptiveQuestion(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal User user
    ) {
        String question = aiInterviewService.getNextAdaptiveQuestion(sessionId, user);
        return ResponseEntity.ok(ApiResponse.ok("Next adaptive question generated", question));
    }

    @PostMapping("/{sessionId}/submit-answer")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<InterviewDetailResponse>> submitAnswer(
            @PathVariable Long sessionId,
            @RequestBody InterviewAnswerRequest request,
            @AuthenticationPrincipal User user
    ) {
        InterviewDetailResponse response = aiInterviewService.submitAnswer(sessionId, request, user);
        return ResponseEntity.ok(ApiResponse.ok("Answer recorded and evaluated", response));
    }

    @PostMapping("/{sessionId}/complete")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<InterviewSummaryResponse>> completeSession(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal User user
    ) {
        InterviewSummaryResponse response = aiInterviewService.completeSession(sessionId, user);
        return ResponseEntity.ok(ApiResponse.ok("Session completed successfully", response));
    }

    @GetMapping("/{sessionId}/result")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<InterviewSummaryResponse>> getSessionResult(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal User user
    ) {
        InterviewSummaryResponse response = aiInterviewService.getSessionSummary(sessionId, user);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/history")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<List<InterviewSummaryResponse>>> getHistory(@AuthenticationPrincipal User user) {
        List<InterviewSummaryResponse> list = aiInterviewService.getCandidateHistory(user.getUserId());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/progress-logs")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<List<PracticeProgressResponse>>> getProgressLogs(@AuthenticationPrincipal User user) {
        List<PracticeProgressResponse> logs = aiInterviewService.getProgressLogs(user.getUserId());
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }
}
