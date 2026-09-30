package com.hiremate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "candidate_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidateProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "profile_id")
    private Long profileId;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

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
