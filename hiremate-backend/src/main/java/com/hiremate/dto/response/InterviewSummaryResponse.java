package com.hiremate.dto.response;

import com.hiremate.enums.InterviewSessionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewSummaryResponse {
    private Long sessionId;
    private Long candidateId;
    private Long jobId;
    private String targetPosition;
    private InterviewSessionType sessionType;
    private Float overallScore;
    private String overallFeedback;
    private String weaknessSummary;
    private String recommendedTasks;
    private Float improvementDelta;
    private List<InterviewDetailResponse> details;
    private LocalDateTime createdAt;
}
