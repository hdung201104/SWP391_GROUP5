package com.hiremate.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO trả về thông tin chi tiết một câu hỏi/đáp án trong phiên phỏng vấn.
 * THAY ĐỔI KIẾN TRÚC V2:
 * - BỎ: contentScore, deliveryScore, wordsPerMinute, clarityScore (riêng lẻ)
 * - BỎ: sessionId dạng Long thô (không cần expose ra API)
 * - THÊM: aiEvaluationScore (điểm tổng hợp AI, thay thế các field trên)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewDetailResponse {
    private Long detailId;
    private Integer questionNumber;
    private String questionText;
    private String candidateAnswerText;
    private String audioUrl;
    /** Điểm đánh giá tổng hợp của AI Agent (0-100) */
    private Float aiEvaluationScore;
    private String aiFeedback;
    private String aiSuggestedAnswer;
}
