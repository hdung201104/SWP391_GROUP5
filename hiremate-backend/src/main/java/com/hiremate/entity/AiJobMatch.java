package com.hiremate.entity;

import com.hiremate.enums.MatchStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Kết quả phân tích CV & Job bằng AI (cached, tính ONCE).
 * THAY ĐỔI KIẾN TRÚC: candidate_id nay FK -> candidates.candidate_id (Subclass),
 * KHÔNG còn trỏ về users.user_id (Superclass).
 *
 * Quy tắc bất biến: matching_score được tính ONCE khi candidate apply hoặc khi
 * recruiter trigger. Read operations KHÔNG bao giờ re-invoke Gemini AI API.
 */
@Entity
@Table(name = "ai_job_matches")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiJobMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "match_id")
    private Long matchId;

    /**
     * FK -> candidates.candidate_id (Subclass của users)
     * Thay thế quan hệ cũ nối thẳng về users.user_id
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cv_id")
    private Cv cv;

    /**
     * Điểm phù hợp tổng hợp (0-100).
     * Công thức: (mandatory_matched * 0.7) + (preferred_matched * 0.3)
     */
    @Column(name = "matching_score")
    private Float matchingScore;

    /** JSON chứa danh sách kỹ năng matched/missing theo mandatory/preferred */
    @Column(name = "skill_gap_json", columnDefinition = "TEXT")
    private String skillGapJson;

    /** Lý giải chi tiết của AI về kết quả matching */
    @Column(name = "ai_reasoning", columnDefinition = "TEXT")
    private String aiReasoning;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private MatchStatus status = MatchStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
