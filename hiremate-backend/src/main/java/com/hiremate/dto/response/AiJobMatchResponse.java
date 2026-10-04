package com.hiremate.dto.response;

import com.hiremate.enums.MatchStatus;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiJobMatchResponse {
    private Long matchId;
    private Long candidateId;
    private String candidateName;
    private Long jobId;
    private String jobTitle;
    private Long cvId;
    private Float matchingScore;
    private List<String> matchedMandatorySkills;
    private List<String> missingMandatorySkills;
    private List<String> matchedPreferredSkills;
    private List<String> missingPreferredSkills;
    private String aiReasoning;
    private MatchStatus status;
}
