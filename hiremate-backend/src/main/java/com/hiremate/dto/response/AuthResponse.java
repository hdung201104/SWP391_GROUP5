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
    @Builder.Default
    private Boolean isNewUser = false;

    public static AuthResponse of(
            String token,
            String refreshToken,
            Long userId,
            String email,
            String fullName,
            String phone,
            UserRole role,
            String avatarUrl,
            Long companyId,
            String companyName,
            Boolean isEmailVerified,
            String dateOfBirth,
            String address,
            String bio,
            String githubUrl,
            Boolean isNewUser
    ) {
        AuthResponse res = new AuthResponse();
        res.token = token;
        res.refreshToken = refreshToken;
        res.tokenType = "Bearer";
        res.userId = userId;
        res.email = email;
        res.fullName = fullName;
        res.phone = phone;
        res.role = role;
        res.avatarUrl = avatarUrl;
        res.companyId = companyId;
        res.companyName = companyName;
        res.isEmailVerified = isEmailVerified != null ? isEmailVerified : true;
        res.dateOfBirth = dateOfBirth;
        res.address = address;
        res.bio = bio;
        res.githubUrl = githubUrl;
        res.isNewUser = isNewUser != null ? isNewUser : false;
        return res;
    }
}
