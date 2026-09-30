package com.hiremate.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
}
