package com.hiremate.dto.response;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiIndustrySkillGenerateResponse {
    private String industryName;
    private String category;
    private List<SkillItemDTO> generatedSkills;
    private int totalNewSkillsAdded;
}
