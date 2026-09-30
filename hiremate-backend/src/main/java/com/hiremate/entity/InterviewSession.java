package com.hiremate.entity;

import com.hiremate.enums.InterviewSessionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Phiên phỏng vấn AI Agent.
 * THAY ĐỔI KIẾN TRÚC: candidate_id nay FK -> candidates.candidate_id (Subclass),
 * KHÔNG còn trỏ về users.user_id (Superclass).
 */
@Entity
@Table(name = "interview_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "session_id")
    private Long sessionId;

    /**
     * FK -> candidates.candidate_id (Subclass của users)
     * Thay thế quan hệ cũ nối thẳng về users.user_id
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    /**
     * nullable – cho phép phỏng vấn luyện tập tự do không gắn với job cụ thể
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id")
    private Job job;

    @Column(name = "target_position", length = 200)
    private String targetPosition;

    @Enumerated(EnumType.STRING)
    @Column(name = "session_type", nullable = false, length = 20)
    @Builder.Default
    private InterviewSessionType sessionType = InterviewSessionType.MOCK;

    /** Self-reference: retry session trỏ về session gốc */
    @Column(name = "parent_session_id")
    private Long parentSessionId;

    @Column(name = "overall_score")
    private Float overallScore;

    @Column(name = "overall_feedback", columnDefinition = "TEXT")
    private String overallFeedback;

    @Column(name = "weakness_summary", columnDefinition = "TEXT")
    private String weaknessSummary;

    @Column(name = "recommended_tasks", columnDefinition = "TEXT")
    private String recommendedTasks;

    @CreationTimestamp
    @Column(name = "started_at", updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
