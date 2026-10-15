package com.hiremate.dto.ai;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiBatchJobMatchResult {

    @JsonAlias({"job_id", "jobId"})
    private Long jobId;

    @JsonAlias({"matching_score", "matchingScore", "score"})
    private Float matchingScore;

    @JsonAlias({"matched_skills", "matchedSkills"})
    private List<String> matchedSkills;

    @JsonAlias({"missing_skills", "missingSkills"})
    private List<String> missingSkills;

    @JsonAlias({"ai_reasoning", "aiReasoning", "reasoning"})
    private String aiReasoning;
}
