package com.hiremate.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewDetailResponse {
    private Long detailId;
    private Long sessionId;
    private Integer questionNumber;
    private String questionText;
    private String candidateAnswerText;
    private String audioUrl;
    private Float contentScore;
    private Float deliveryScore;
    private Float wordsPerMinute;
    private Float clarityScore;
    private String aiFeedback;
    private String aiSuggestedAnswer;
}
