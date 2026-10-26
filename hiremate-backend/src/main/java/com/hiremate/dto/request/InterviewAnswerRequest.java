package com.hiremate.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InterviewAnswerRequest {
    private Integer questionNumber;
    private String questionText;
    private String candidateAnswerText;
    private String audioUrl;
    private Float wordsPerMinute;
    private Float clarityScore;
    private Float pitchHz;
    private Float eyeContactPercent;
    private String facialEmotion;
    private Integer fillerCount;

    public InterviewAnswerRequest(Integer questionNumber, String questionText, String candidateAnswerText, String audioUrl, Float wordsPerMinute, Float clarityScore) {
        this.questionNumber = questionNumber;
        this.questionText = questionText;
        this.candidateAnswerText = candidateAnswerText;
        this.audioUrl = audioUrl;
        this.wordsPerMinute = wordsPerMinute;
        this.clarityScore = clarityScore;
    }
}
