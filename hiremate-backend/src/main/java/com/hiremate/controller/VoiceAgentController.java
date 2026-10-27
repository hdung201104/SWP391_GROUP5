package com.hiremate.controller;

import com.hiremate.config.OpenAiConfig;
import com.hiremate.dto.request.VoiceSessionRequest;
import com.hiremate.dto.response.ApiResponse;
import com.hiremate.dto.response.VoiceSessionResponse;
import com.hiremate.entity.User;
import com.hiremate.service.VoiceAgentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/voice-agent")
@RequiredArgsConstructor
public class VoiceAgentController {

    private final VoiceAgentService voiceAgentService;
    private final OpenAiConfig openAiConfig;

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus() {
        boolean ready = openAiConfig.isConfigured();
        return ResponseEntity.ok(ApiResponse.ok("Trạng thái Voice AI Realtime Agent", Map.of(
                "enabled", ready,
                "model", openAiConfig.getRealtimeModel(),
                "voice", openAiConfig.getVoice(),
                "transport", "WebRTC"
        )));
    }

    @PostMapping("/session")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<VoiceSessionResponse>> createSession(
            @RequestBody(required = false) VoiceSessionRequest request,
            @AuthenticationPrincipal User user
    ) {
        log.info("Creating Realtime Voice AI session for candidate: {}", user.getEmail());
        VoiceSessionResponse response = voiceAgentService.createRealtimeSession(request, user);
        return ResponseEntity.ok(ApiResponse.ok("Khởi tạo phiên Voice Realtime thành công", response));
    }
}
