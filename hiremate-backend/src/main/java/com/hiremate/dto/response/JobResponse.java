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
    private Integer vacanciesCount;
    private Integer totalViews;
    private Long applicantCount;
    private LocalDate deadlineDate;
    private List<String> skills;
    private LocalDateTime createdAt;
}
