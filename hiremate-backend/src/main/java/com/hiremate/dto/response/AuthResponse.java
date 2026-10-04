package com.hiremate.dto.response;

import com.hiremate.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private String refreshToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long userId;
    private String email;
    private String fullName;
    private String phone;
    private UserRole role;
    private String avatarUrl;
    private Long companyId;
    private String companyName;
    @Builder.Default
    private Boolean isEmailVerified = true;
    private String dateOfBirth;
    private String address;
    private String bio;
    private String githubUrl;
}
