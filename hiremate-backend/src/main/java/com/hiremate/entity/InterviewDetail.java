package com.hiremate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Lịch sử câu hỏi & câu trả lời của mỗi lượt hỏi trong phiên phỏng vấn AI.
 * THAY ĐỔI KIẾN TRÚC:
 * - BỎ HOÀN TOÀN question_id (FK -> question_bank) - table question_bank đã bị xóa.
 * - THÊM question_text (TEXT): AI Agent tự sinh câu hỏi và ghi trực tiếp vào đây.
 * - THÊM ai_evaluation_score: điểm tổng hợp thay thế content_score/delivery_score riêng lẻ.
 */
@Entity
@Table(name = "interview_details")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "detail_id")
    private Long detailId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession session;

    /** Thứ tự câu hỏi trong phiên phỏng vấn (1, 2, 3, ...) */
    @Column(name = "question_number")
    private Integer questionNumber;

    /**
     * Nội dung câu hỏi do AI Agent (Gemini) tự sinh ra theo ngữ cảnh
     * CV ứng viên + JD của vị trí tuyển dụng. KHÔNG lấy từ question_bank.
     */
    @Column(name = "question_text", columnDefinition = "TEXT")
    private String questionText;

    /** Câu trả lời bằng văn bản của ứng viên (speech-to-text hoặc gõ trực tiếp) */
    @Column(name = "candidate_answer_text", columnDefinition = "TEXT")
    private String candidateAnswerText;

    /** URL file audio ghi âm câu trả lời của ứng viên */
    @Column(name = "audio_url", length = 500)
    private String audioUrl;

    /**
     * Điểm đánh giá tổng hợp của AI Agent cho câu trả lời này (0-100).
     * Thay thế các trường content_score / delivery_score / clarity_score riêng lẻ.
     */
    @Column(name = "ai_evaluation_score")
    private Float aiEvaluationScore;

    /** Nhận xét chi tiết của AI về câu trả lời (điểm mạnh, điểm yếu) */
    @Column(name = "ai_feedback", columnDefinition = "TEXT")
    private String aiFeedback;

    /** Câu trả lời mẫu / gợi ý tối ưu do AI đề xuất */
    @Column(name = "ai_suggested_answer", columnDefinition = "TEXT")
    private String aiSuggestedAnswer;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
