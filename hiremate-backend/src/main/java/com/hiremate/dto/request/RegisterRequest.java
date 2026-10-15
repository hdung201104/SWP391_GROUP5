package com.hiremate.dto.request;

import com.hiremate.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String phone;

    private UserRole role; // CANDIDATE or RECRUITER

    // Candidate specific fields
    private String headline;
    private String location;
    private Integer experienceYears;
    private String dateOfBirth;
    private String address;
    private String bio;
    private String githubUrl;

    // Recruiter specific fields (Company)
    private String companyName;
    private String website;
    private String companySize;
    private String companyAddress;
}
