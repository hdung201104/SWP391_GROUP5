package com.hiremate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * SUBCLASS của Users – lưu thông tin hồ sơ riêng của Ứng viên.
 * Shared Primary Key: candidate_id = user_id (Table-per-Subclass / Joined Inheritance).
 * FK Mapping: jobs, applications, ai_job_matches, interview_sessions ĐỀU trỏ về candidates.candidate_id
 */
@Entity
@Table(name = "candidates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Candidate {

    /**
     * PK đồng thời là FK -> users.user_id (Shared PK / Joined pattern).
     * Không dùng @GeneratedValue vì giá trị lấy từ users.user_id.
     */
    @Id
    @Column(name = "candidate_id")
    private Long candidateId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "candidate_id")
    private User user;

    @Column(name = "headline", length = 300)
    private String headline;

    @Column(name = "location", length = 200)
    private String location;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "experience_years")
    @Builder.Default
    private Integer experienceYears = 0;

    @Column(name = "desired_salary_min", precision = 15, scale = 2)
    private BigDecimal desiredSalaryMin;

    @Column(name = "desired_salary_max", precision = 15, scale = 2)
    private BigDecimal desiredSalaryMax;

    @Column(name = "educations_json", columnDefinition = "TEXT")
    private String educationsJson;

    @Column(name = "experiences_json", columnDefinition = "TEXT")
    private String experiencesJson;

    @Column(name = "projects_json", columnDefinition = "TEXT")
    private String projectsJson;

    @Column(name = "career_goals", columnDefinition = "TEXT")
    private String careerGoals;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
