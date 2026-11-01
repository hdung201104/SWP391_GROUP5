package com.hiremate.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
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
    private String branchName;
    private EmploymentType employmentType;

    @Min(value = 1, message = "Số lượng tuyển dụng phải từ 1 người trở lên")
    @JsonAlias({"vacancyCount", "vacancies_count", "headcount", "positionsAvailable", "vacancies"})
    private Integer vacanciesCount;

    public Integer getHeadcount() {
        return vacanciesCount;
    }

    public void setHeadcount(Integer headcount) {
        if (headcount != null) {
            this.vacanciesCount = headcount;
        }
    }

    @FutureOrPresent(message = "Hạn chót nộp hồ sơ không được là ngày trong quá khứ")
    @JsonAlias({"deadline", "deadline_date"})
    private LocalDate deadlineDate;

    // Metadata fields
    @JsonAlias({"currency", "salary_currency"})
    private String salaryCurrency;

    private String experience;
    private String level;

    @JsonAlias({"jobCategory", "job_category", "domain", "categoryName"})
    private String category;

    @JsonAlias({"jobStatus", "status"})
    private com.hiremate.enums.JobStatus status;

    public void setStatus(Object val) {
        if (val == null) {
            this.status = null;
        } else if (val instanceof com.hiremate.enums.JobStatus) {
            this.status = (com.hiremate.enums.JobStatus) val;
        } else {
            String str = val.toString().trim().toUpperCase();
            if ("ACTIVE".equals(str)) str = "PUBLISHED";
            try {
                this.status = com.hiremate.enums.JobStatus.valueOf(str);
            } catch (Exception ignored) {}
        }
    }

    // Skills
    @JsonAlias({"mandatory_skill_ids", "requiredSkillIds"})
    private List<Long> mandatorySkillIds;

    @JsonAlias({"preferred_skill_ids"})
    private List<Long> preferredSkillIds;

    @JsonAlias({"requiredSkills", "mandatory_skills"})
    private List<String> mandatorySkills;

    @JsonAlias({"preferred_skills"})
    private List<String> preferredSkills;
}

