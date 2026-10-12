package com.hiremate.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiCvAnalysis {
    private String candidateName;
    private String headline;
    private Integer yearsOfExperience;
    private List<String> skills;
    private List<String> topSkills;
    private String educationsJson;
    private String experiencesJson;
    private String summary;
    private List<String> suggestedRoles;
    private String improvementAdvice;
}
