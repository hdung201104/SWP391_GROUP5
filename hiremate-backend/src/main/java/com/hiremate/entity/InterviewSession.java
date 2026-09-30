package com.hiremate.entity;

import com.hiremate.enums.InterviewSessionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

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

    @Column(name = "candidate_id", nullable = false)
    private Long candidateId;

    @Column(name = "job_id")
    private Long jobId;

    @Column(name = "target_position", length = 200)
    private String targetPosition;

    @Enumerated(EnumType.STRING)
    @Column(name = "session_type", nullable = false, length = 20)
    @Builder.Default
    private InterviewSessionType sessionType = InterviewSessionType.MOCK;

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
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
