package com.hiremate.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    @NotBlank(message = "Full name is required")
    private String fullName;

    private String phone;
    private String dateOfBirth;
    private String gender;
    private String address;
    private String bio;
    private String githubUrl;
    private String headline;
    private String location;
    private String experiencesJson;
    private String educationsJson;
    private String projectsJson;

    // Optional Recruiter fields
    private String position;
    private String department;
    private String branchName;
}
