package com.hiremate.service;

import com.hiremate.dto.request.VoiceSessionRequest;
import com.hiremate.dto.response.VoiceSessionResponse;
import com.hiremate.entity.User;

public interface VoiceAgentService {

    /**
     * Khởi tạo phiên Realtime Voice với OpenAI và tạo ephemeral client_secret cho WebRTC phía Client
     */
    VoiceSessionResponse createRealtimeSession(VoiceSessionRequest request, User user);
}
