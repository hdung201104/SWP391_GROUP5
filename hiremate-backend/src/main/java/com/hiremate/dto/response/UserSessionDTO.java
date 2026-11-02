package com.hiremate.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSessionDTO {
    private String sessionId;
    private Long userId;
    private String token;
    private String refreshToken;
    private String device;
    private String browser;
    private String os;
    private String ipAddress;
    private String location;
    private String icon;
    private Long createdAt;
    private Long lastActiveAt;
    private String timeDisplay;

    @com.fasterxml.jackson.annotation.JsonProperty("isCurrent")
    private boolean isCurrent;

    @com.fasterxml.jackson.annotation.JsonProperty("isCurrent")
    public boolean isCurrent() {
        return this.isCurrent;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("isCurrent")
    public void setCurrent(boolean isCurrent) {
        this.isCurrent = isCurrent;
    }
}
