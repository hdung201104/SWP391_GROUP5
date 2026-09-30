package com.hiremate.dto.response;

import com.hiremate.enums.MatchStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiMatchResponse {
    private Long matchId;
    private Long candidateId;
    private Long jobId;
    private String jobTitle;
    private Long cvId;
    private Float matchingScore;
    private String skillGapJson;
    private String aiReasoning;
    private MatchStatus status;
    private LocalDateTime createdAt;
}
