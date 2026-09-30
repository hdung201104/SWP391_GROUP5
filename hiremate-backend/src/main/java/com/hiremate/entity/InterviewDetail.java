package com.hiremate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

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

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "question_id")
    private Long questionId;

    @Column(name = "question_number")
    private Integer questionNumber;

    @Column(name = "question_text", columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "candidate_answer_text", columnDefinition = "TEXT")
    private String candidateAnswerText;

    @Column(name = "audio_url", length = 500)
    private String audioUrl;

    @Column(name = "content_score")
    private Float contentScore;

    @Column(name = "delivery_score")
    private Float deliveryScore;

    @Column(name = "words_per_minute")
    private Float wordsPerMinute;

    @Column(name = "clarity_score")
    private Float clarityScore;

    @Column(name = "ai_feedback", columnDefinition = "TEXT")
    private String aiFeedback;

    @Column(name = "ai_suggested_answer", columnDefinition = "TEXT")
    private String aiSuggestedAnswer;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
