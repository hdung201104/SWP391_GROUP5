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
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hiremate.service.SystemSettingsService systemSettingsService;

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getInterviewConfig() {
        int maxQ = 5;
        int respSec = 120;
        String persona = "TECH_LEAD";
        String difficulty = "STANDARD";
        if (systemSettingsService != null && systemSettingsService.getSettings() != null) {
            var s = systemSettingsService.getSettings();
            if (s.getInterviewMaxQuestions() != null) maxQ = s.getInterviewMaxQuestions();
            if (s.getInterviewResponseSeconds() != null) respSec = s.getInterviewResponseSeconds();
            if (s.getInterviewerPersona() != null) persona = s.getInterviewerPersona();
            if (s.getAiInterviewDifficulty() != null) difficulty = s.getAiInterviewDifficulty();
        }
        return ResponseEntity.ok(ApiResponse.ok("Cấu hình phòng phỏng vấn AI", java.util.Map.of(
                "interviewMaxQuestions", maxQ,
                "interviewResponseSeconds", respSec,
                "interviewerPersona", persona,
                "aiInterviewDifficulty", difficulty
        )));
    }

    @GetMapping("/quota-status")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<com.hiremate.dto.response.InterviewQuotaStatusResponse>> getQuotaStatus(
            @AuthenticationPrincipal User user
    ) {
        com.hiremate.dto.response.InterviewQuotaStatusResponse response = aiInterviewService.getCandidateQuotaStatus(user);
        return ResponseEntity.ok(ApiResponse.ok("Thông tin gói dịch vụ & hạn ngạch phỏng vấn", response));
    }


    @GetMapping("/generate-questions")
    public ResponseEntity<ApiResponse<List<String>>> generateQuestions(
            @RequestParam(required = false, defaultValue = "Software Engineer") String targetPosition,
            @RequestParam(required = false, defaultValue = "Middle") String level,
            @RequestParam(required = false) Integer count
    ) {
        int finalCount = (count != null && count > 0) ? count : 5;
        if (count == null && systemSettingsService != null && systemSettingsService.getSettings() != null) {
            Integer defCount = systemSettingsService.getSettings().getInterviewMaxQuestions();
            if (defCount != null && defCount > 0) finalCount = defCount;
        }
        List<String> questions = geminiAiService.generateInterviewQuestions(targetPosition, level, finalCount);
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

    @PostMapping("/{sessionId}/voice-turn")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> processVoiceTurn(
            @PathVariable Long sessionId,
            @RequestBody java.util.Map<String, Object> body,
            @AuthenticationPrincipal User user
    ) {
        String userSpeech = body.get("userSpeech") != null ? body.get("userSpeech").toString() : "";
        @SuppressWarnings("unchecked")
        List<String> history = body.get("history") instanceof List ? (List<String>) body.get("history") : List.of();
        String targetPosition = body.get("targetPosition") != null ? body.get("targetPosition").toString() : "Chuyên viên phỏng vấn";
        String focusNotes = body.get("focusNotes") != null ? body.get("focusNotes").toString() : null;
        String cvSnippet = body.get("cvSnippet") != null ? body.get("cvSnippet").toString() : null;
        String jobSnippet = body.get("jobSnippet") != null ? body.get("jobSnippet").toString() : null;
        String persona = body.get("persona") != null ? body.get("persona").toString() : null;
        String difficulty = body.get("difficulty") != null ? body.get("difficulty").toString() : null;

        Integer maxQuestions = null;
        String planName = null;
        if (body.get("maxQuestions") != null) {
            try {
                maxQuestions = Integer.parseInt(body.get("maxQuestions").toString());
            } catch (Exception ignored) {}
        }
        if (body.get("planName") != null) {
            planName = body.get("planName").toString();
        }

        if (user != null && (maxQuestions == null || planName == null)) {
            try {
                var quota = aiInterviewService.getCandidateQuotaStatus(user);
                if (maxQuestions == null) maxQuestions = quota.getMaxQuestions();
                if (planName == null) planName = quota.getPlanName();
            } catch (Exception ignored) {}
        }

        String aiReply = geminiAiService.processVoiceInterviewTurn(targetPosition, userSpeech, history, focusNotes, cvSnippet, jobSnippet, persona, difficulty, maxQuestions, planName);
        return ResponseEntity.ok(ApiResponse.ok("Voice turn generated", java.util.Map.of(
                "reply", aiReply,
                "timestamp", System.currentTimeMillis()
        )));
    }

    @PostMapping("/turn-complete")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> checkTurnComplete(
            @RequestBody java.util.Map<String, Object> body
    ) {
        String question = body.get("question") != null ? body.get("question").toString() : "";
        String answer = body.get("answer") != null ? body.get("answer").toString() : "";
        boolean complete = geminiAiService.isCandidateTurnComplete(question, answer);
        return ResponseEntity.ok(ApiResponse.ok("Turn completeness", java.util.Map.of("complete", complete)));
    }

    @PostMapping("/coach")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> coachAnswer(
            @RequestBody java.util.Map<String, Object> body
    ) {
        String question = body.get("question") != null ? body.get("question").toString() : "";
        String targetPosition = body.get("targetPosition") != null ? body.get("targetPosition").toString() : null;
        String cvSnippet = body.get("cvSnippet") != null ? body.get("cvSnippet").toString() : null;
        String level = body.get("level") != null ? body.get("level").toString() : null;
        java.util.Map<String, Object> coaching = geminiAiService.generateAnswerCoaching(targetPosition, question, cvSnippet, level);
        return ResponseEntity.ok(ApiResponse.ok("Answer coaching", coaching));
    }

    @PostMapping("/voice-turn")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> processVoiceTurnStandalone(
            @RequestBody java.util.Map<String, Object> body,
            @AuthenticationPrincipal User user
    ) {
        String userSpeech = body.get("userSpeech") != null ? body.get("userSpeech").toString() : "";
        @SuppressWarnings("unchecked")
        List<String> history = body.get("history") instanceof List ? (List<String>) body.get("history") : List.of();
        String targetPosition = body.get("targetPosition") != null ? body.get("targetPosition").toString() : "Chuyên viên phỏng vấn";
        String focusNotes = body.get("focusNotes") != null ? body.get("focusNotes").toString() : null;
        String cvSnippet = body.get("cvSnippet") != null ? body.get("cvSnippet").toString() : null;
        String jobSnippet = body.get("jobSnippet") != null ? body.get("jobSnippet").toString() : null;
        String persona = body.get("persona") != null ? body.get("persona").toString() : null;
        String difficulty = body.get("difficulty") != null ? body.get("difficulty").toString() : null;

        Integer maxQuestions = null;
        String planName = null;
        if (body.get("maxQuestions") != null) {
            try {
                maxQuestions = Integer.parseInt(body.get("maxQuestions").toString());
            } catch (Exception ignored) {}
        }
        if (body.get("planName") != null) {
            planName = body.get("planName").toString();
        }

        if (user != null && (maxQuestions == null || planName == null)) {
            try {
                var quota = aiInterviewService.getCandidateQuotaStatus(user);
                if (maxQuestions == null) maxQuestions = quota.getMaxQuestions();
                if (planName == null) planName = quota.getPlanName();
            } catch (Exception ignored) {}
        }

        String aiReply = geminiAiService.processVoiceInterviewTurn(targetPosition, userSpeech, history, focusNotes, cvSnippet, jobSnippet, persona, difficulty, maxQuestions, planName);
        return ResponseEntity.ok(ApiResponse.ok("Voice turn generated", java.util.Map.of(
                "reply", aiReply,
                "timestamp", System.currentTimeMillis()
        )));
    }

    @PostMapping("/{sessionId}/complete")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<InterviewSummaryResponse>> completeSession(
            @PathVariable Long sessionId,
            @RequestBody(required = false) java.util.Map<String, Object> telemetry,
            @AuthenticationPrincipal User user
    ) {
        InterviewSummaryResponse response = aiInterviewService.completeSession(sessionId, telemetry, user);
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

    @GetMapping("/tts")
    public ResponseEntity<byte[]> streamTts(@RequestParam String text,
                                            @RequestParam(defaultValue = "female") String voice) {
        byte[] audio = aiInterviewService.synthesizeSpeech(text, voice);
        if (audio == null || audio.length == 0) {
            return ResponseEntity.status(503).build();
        }
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "audio/mpeg")
                .header(org.springframework.http.HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .body(audio);
    }
}
