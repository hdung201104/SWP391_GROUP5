package com.hiremate.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoiceSessionResponse {
    private String clientSecret;
    private Long expiresAt;
    private String sessionId;
    private String model;
    private String voice;
    private String instructions;
    private String candidateName;
}
