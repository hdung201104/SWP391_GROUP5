package com.hiremate.dto.request;

import com.hiremate.enums.EmploymentType;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobCreateRequest {

    @NotBlank(message = "Job title is required")
    private String title;

    private String description;
    private String requirements;
    private String benefits;
    private BigDecimal salaryMin;
    private BigDecimal salaryMax;
    private String location;
    private EmploymentType employmentType;
    private Integer vacanciesCount;
    private LocalDate deadlineDate;

    // Skills
    private List<Long> mandatorySkillIds;
    private List<Long> preferredSkillIds;
}
