package com.hiremate.dto.response;

import com.hiremate.enums.SkillProficiency;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidateSkillResponse {
    private Long candidateSkillId;
    private Long profileId;
    private Long skillId;
    private String skillName;
    private String category;
    private SkillProficiency proficiencyLevel;
    private Float yearsOfExperience;
    private Boolean aiDetected;
}
