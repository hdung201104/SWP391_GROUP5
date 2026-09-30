package com.hiremate.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewAnswerRequest {
    private Integer questionNumber;
    private String questionText;
    private String candidateAnswerText;
    private String audioUrl;
    private Float wordsPerMinute;
    private Float clarityScore;
}
