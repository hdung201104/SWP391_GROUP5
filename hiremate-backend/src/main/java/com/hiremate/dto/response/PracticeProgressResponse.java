package com.hiremate.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PracticeProgressResponse {
    private Long logId;
    private Long candidateId;
    private Long originalSessionId;
    private Long retrySessionId;
    private Long skillTargeted;
    private String skillName;
    private Float scoreBefore;
    private Float scoreAfter;
    private Float improvementDelta;
    private LocalDateTime createdAt;
}
