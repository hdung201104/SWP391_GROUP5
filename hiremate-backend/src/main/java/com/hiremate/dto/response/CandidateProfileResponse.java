package com.hiremate.dto.response;

import com.hiremate.enums.SkillProficiency;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidateProfileResponse {
    private Long candidateId;
    private Long userId;
    private String fullName;
    private String email;
    private String phone;
    private String avatarUrl;
    private String dateOfBirth;
    private String address;
    private String githubUrl;
    private String headline;
    private String location;
    private String bio;
    private Integer experienceYears;
    private BigDecimal desiredSalaryMin;
    private BigDecimal desiredSalaryMax;
    private String careerGoals;
    private String educationsJson;
    private String experiencesJson;
    private String projectsJson;
    private List<CandidateSkillResponse> skills;
    private List<CvResponse> cvs;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CandidateSkillResponse {
        private Long candidateSkillId;
        private Long skillId;
        private String skillName;
        private String category;
        private SkillProficiency proficiencyLevel;
        private Float yearsOfExperience;
        private Boolean aiDetected;
    }
}
