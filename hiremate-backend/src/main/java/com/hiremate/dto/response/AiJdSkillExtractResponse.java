package com.hiremate.dto.response;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiJdSkillExtractResponse {
    private String detectedIndustry;
    private String summary;
    private List<SkillItemDTO> mandatorySkills;
    private List<SkillItemDTO> preferredSkills;
}
