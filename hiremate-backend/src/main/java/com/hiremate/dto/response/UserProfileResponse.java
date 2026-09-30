package com.hiremate.dto.response;

import com.hiremate.enums.UserRole;
import com.hiremate.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponse {
    private Long userId;
    private String email;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private UserRole role;
    private UserStatus status;
    private Boolean isEmailVerified;
    private String dateOfBirth;
    private String address;
    private String bio;
    private String githubUrl;
    private LocalDateTime createdAt;

    // Optional Candidate fields
    private Long profileId;
    private String headline;
    private String location;
    private Integer experienceYears;

    // Optional Recruiter fields
    private Long companyId;
    private String companyName;
    private String companyWebsite;
}
