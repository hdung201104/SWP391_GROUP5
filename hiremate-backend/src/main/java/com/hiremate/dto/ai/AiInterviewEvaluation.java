package com.hiremate.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiInterviewEvaluation {
    private Float score;
    private Float contentScore;
    private Float deliveryScore;
    private String tone;
    private String intonationFeedback;
    private String transcribedText;
    private String feedback;
    private String suggestedAnswer;
    @Builder.Default
    private String confidenceLevel = "HIGH";
    @Builder.Default
    private Boolean requiresHumanReview = false;
    private String confidenceReason;
}
