package com.hiremate.dto.request;

import com.hiremate.enums.EmploymentType;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobCreateRequest {

    @NotBlank(message = "Tiêu đề vị trí tuyển dụng không được để trống")
    private String title;

    private String description;
    private String requirements;
    private String benefits;

    @PositiveOrZero(message = "Mức lương tối thiểu không được là số âm")
    private BigDecimal salaryMin;

    @PositiveOrZero(message = "Mức lương tối đa không được là số âm")
    private BigDecimal salaryMax;

    private String location;
    private EmploymentType employmentType;

    @Min(value = 1, message = "Số lượng tuyển dụng phải từ 1 người trở lên")
    private Integer vacanciesCount;

    @FutureOrPresent(message = "Hạn chót nộp hồ sơ không được là ngày trong quá khứ")
    private LocalDate deadlineDate;

    // Skills
    private List<Long> mandatorySkillIds;
    private List<Long> preferredSkillIds;
    private List<String> mandatorySkills;
    private List<String> preferredSkills;
}

