package com.hiremate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscription_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "plan_id")
    private Long planId;

    @Column(name = "plan_name", nullable = false, length = 100)
    private String planName;

    @Column(name = "target_role", nullable = false, length = 20)
    private String targetRole; // RECRUITER hoặc CANDIDATE

    @Column(name = "plan_type", nullable = false, length = 30)
    private String planType; // JOB_POSTING, INTERVIEW_PRACTICE, COMBO

    @Column(name = "price", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "duration_days", nullable = false)
    @Builder.Default
    private Integer durationDays = 30;

    @Column(name = "quota_limit", nullable = false)
    @Builder.Default
    private Integer quotaLimit = 0;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
