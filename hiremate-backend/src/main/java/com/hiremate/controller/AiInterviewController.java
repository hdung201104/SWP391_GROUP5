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
    private final com.hiremate.service.FileStorageService fileStorageService;
    private final com.hiremate.repository.ApplicationRepository applicationRepository;
    private final com.hiremate.repository.InterviewDetailRepository interviewDetailRepository;
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
            @RequestParam(required = false) Integer count,
            @AuthenticationPrincipal User user
    ) {
        int finalCount = (count != null && count > 0) ? count : 5;
        if (user != null && user.getRole() != com.hiremate.enums.UserRole.ADMIN) {
            try {
                var quota = aiInterviewService.getCandidateQuotaStatus(user);
                if (quota != null && quota.getMaxQuestions() > 0) {
                    int allowedMax = quota.getMaxQuestions();
                    if (finalCount > allowedMax) {
                        finalCount = allowedMax;
                    }
                }
            } catch (Exception ignored) {}
        } else if (count == null && systemSettingsService != null && systemSettingsService.getSettings() != null) {
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

        if (user != null) {
            try {
                var quota = aiInterviewService.getCandidateQuotaStatus(user);
                int allowedMaxQuestions = quota.getMaxQuestions();
                if (user.getRole() != com.hiremate.enums.UserRole.ADMIN) {
                    if (maxQuestions == null || maxQuestions > allowedMaxQuestions) {
                        maxQuestions = allowedMaxQuestions;
                    }
                } else if (maxQuestions == null) {
                    maxQuestions = allowedMaxQuestions;
                }
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

        if (user != null) {
            try {
                var quota = aiInterviewService.getCandidateQuotaStatus(user);
                int allowedMaxQuestions = quota.getMaxQuestions();
                if (user.getRole() != com.hiremate.enums.UserRole.ADMIN) {
                    if (maxQuestions == null || maxQuestions > allowedMaxQuestions) {
                        maxQuestions = allowedMaxQuestions;
                    }
                } else if (maxQuestions == null) {
                    maxQuestions = allowedMaxQuestions;
                }
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

    @GetMapping("/candidate/{candidateId}/latest")
    @PreAuthorize("hasAnyRole('CANDIDATE', 'ADMIN')")
    public ResponseEntity<ApiResponse<InterviewSummaryResponse>> getLatestCandidateInterview(
            @PathVariable Long candidateId,
            @RequestParam(required = false) Long jobId,
            @AuthenticationPrincipal User user
    ) {
        // Bảo vệ quyền riêng tư: Chỉ chính ứng viên đó hoặc Admin mới có quyền truy cập dữ liệu luyện tập
        if (user.getRole() != com.hiremate.enums.UserRole.ADMIN && !candidateId.equals(user.getUserId())) {
            throw new SecurityException("Không có quyền truy cập dữ liệu luyện tập phỏng vấn của ứng viên khác");
        }
        InterviewSummaryResponse response = aiInterviewService.getLatestCompletedCandidateInterview(candidateId, jobId);
        if (response == null) {
            return ResponseEntity.ok(ApiResponse.ok("Ứng viên chưa thực hiện bài phỏng vấn giả lập AI Voice nào.", null));
        }
        return ResponseEntity.ok(ApiResponse.ok("Báo cáo phỏng vấn AI mới nhất của ứng viên", response));
    }

    @GetMapping("/application/{applicationId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InterviewSummaryResponse>> getInterviewByApplication(
            @PathVariable Long applicationId
    ) {
        if (applicationRepository == null) {
            return ResponseEntity.ok(ApiResponse.ok("Không tìm thấy thông tin đơn ứng tuyển", null));
        }
        var appOpt = applicationRepository.findById(applicationId);
        if (appOpt.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.ok("Không tìm thấy đơn ứng tuyển ID: " + applicationId, null));
        }
        var app = appOpt.get();
        Long candidateId = app.getCandidate() != null ? app.getCandidate().getCandidateId() : null;
        Long jobId = app.getJob() != null ? app.getJob().getJobId() : null;
        if (candidateId == null) {
            return ResponseEntity.ok(ApiResponse.ok("Đơn ứng tuyển chưa có ứng viên hợp lệ", null));
        }
        InterviewSummaryResponse response = aiInterviewService.getLatestCompletedCandidateInterview(candidateId, jobId);
        if (response == null) {
            return ResponseEntity.ok(ApiResponse.ok("Ứng viên chưa thực hiện bài phỏng vấn giả lập AI Voice cho vị trí này.", null));
        }
        return ResponseEntity.ok(ApiResponse.ok("Báo cáo phỏng vấn AI theo đơn ứng tuyển", response));
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

    @PostMapping(value = "/upload-audio", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> uploadCandidateAudio(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file
    ) {
        String cloudAudioUrl = fileStorageService.storeFile(file, "interview_audio");
        return ResponseEntity.ok(ApiResponse.ok("Đã tải file ghi âm giọng nói lên đám mây", java.util.Map.of("audioUrl", cloudAudioUrl)));
    }

    @GetMapping("/audio-playback")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> streamCandidateAudio(
            @RequestParam("url") String audioUrl,
            @org.springframework.security.core.annotation.AuthenticationPrincipal User user
    ) {
        if (audioUrl == null || audioUrl.isBlank() || audioUrl.contains("..") || audioUrl.contains("\\")) {
            return ResponseEntity.badRequest().build();
        }
        if (user == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        // Kiểm tra bảo mật: Chỉ ADMIN hoặc chính ứng viên sở hữu buổi phỏng vấn mới được nghe lại
        if (user.getRole() != com.hiremate.enums.UserRole.ADMIN) {
            boolean isOwner = interviewDetailRepository.existsByAudioUrlAndCandidateId(audioUrl.trim(), user.getUserId());
            if (!isOwner) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
            }
        }
        byte[] audioBytes = fileStorageService.loadFileAsBytes(audioUrl);
        if (audioBytes == null || audioBytes.length == 0) {
            return ResponseEntity.notFound().build();
        }
        String lower = audioUrl.toLowerCase();
        String contentType = lower.endsWith(".mp3") ? "audio/mpeg"
                : lower.endsWith(".wav") ? "audio/wav"
                : lower.endsWith(".ogg") ? "audio/ogg"
                : lower.endsWith(".m4a") || lower.endsWith(".mp4") ? "audio/mp4"
                : "audio/webm";
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, contentType)
                .header(org.springframework.http.HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .body(audioBytes);
    }
}
