package com.hiremate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "practice_progress_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PracticeProgressLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long logId;

    @Column(name = "candidate_id", nullable = false)
    private Long candidateId;

    @Column(name = "original_session_id", nullable = false)
    private Long originalSessionId;

    @Column(name = "retry_session_id", nullable = false)
    private Long retrySessionId;

    @Column(name = "skill_targeted")
    private Long skillTargeted;

    @Column(name = "score_before")
    private Float scoreBefore;

    @Column(name = "score_after")
    private Float scoreAfter;

    @Column(name = "improvement_delta")
    private Float improvementDelta;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
