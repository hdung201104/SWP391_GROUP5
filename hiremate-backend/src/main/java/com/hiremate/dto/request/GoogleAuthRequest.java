package com.hiremate.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.hiremate.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoogleAuthRequest {

    /**
     * Google ID Token / Credential trả về từ Google Sign-In SDK (GIS - Google Identity Services) ở Frontend.
     * Khi truyền trường này, Backend sẽ giải mã và xác thực trực tiếp chữ ký số với Google API.
     */
    @JsonAlias({"credential", "token", "googleToken"})
    private String idToken;

    /**
     * Trường fallback khi không dùng idToken hoặc trong môi trường test nội bộ.
     */
    private String email;

    private String fullName;

    private String avatarUrl;

    private String googleId;

    @Builder.Default
    private UserRole role = UserRole.CANDIDATE;
}

