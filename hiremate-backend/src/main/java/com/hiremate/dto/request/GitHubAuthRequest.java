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
public class GitHubAuthRequest {

    /**
     * OAuth code returned by GitHub authorization redirect
     */
    @JsonAlias({"oauthCode", "authorizationCode"})
    private String code;

    private String email;

    private String fullName;

    private String avatarUrl;

    @Builder.Default
    private UserRole role = UserRole.CANDIDATE;
}
