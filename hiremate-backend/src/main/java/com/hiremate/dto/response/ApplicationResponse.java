package com.hiremate.dto.response;

import com.hiremate.enums.ApplicationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationResponse {
    private Long applicationId;
    private Long jobId;
    private String jobTitle;
    private String companyName;
    private Long candidateId;
    private String candidateName;
    private String candidateEmail;
    private Long cvId;
    private String cvUrl;
    private ApplicationStatus status;
    private String coverLetter;
    private Float matchingScore;
    private LocalDateTime createdAt;
}
