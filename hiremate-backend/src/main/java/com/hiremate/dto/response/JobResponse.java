package com.hiremate.dto.response;

import com.hiremate.enums.EmploymentType;
import com.hiremate.enums.JobStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobResponse {
    private Long jobId;
    private Long recruiterId;
    private Long companyId;
    private String companyName;
    private String companyLogo;
    private String title;
    private String description;
    private List<String> requirements;
    private List<String> benefits;
    private BigDecimal salaryMin;
    private BigDecimal salaryMax;
    private String location;
    private EmploymentType employmentType;
    private JobStatus status;
    private com.hiremate.enums.JobApprovalStatus approvalStatus;
    private Integer vacanciesCount;
    private Integer totalViews;
    private Long applicantCount;
    private LocalDate deadlineDate;
    private List<String> skills;
    private Float matchingScore;
    private String aiReasoning;
    private List<String> matchedSkills;
    private List<String> missingSkills;
    private String recruiterName;
    private String recruiterEmail;
    private String recruiterPhone;
    private String recruiterAvatar;
    private String recruiterPosition;
    private String recruiterDepartment;
    private String recruiterBio;
    private String companySize;
    private String companyAddress;
    private String companyDescription;
    private String companyWebsite;
    private String companyIndustry;
    private LocalDateTime createdAt;
}
