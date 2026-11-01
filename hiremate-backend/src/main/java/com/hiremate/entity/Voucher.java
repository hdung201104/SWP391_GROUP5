package com.hiremate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vouchers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "voucher_id")
    private Long voucherId;

    @Column(name = "code", unique = true, nullable = false, length = 50)
    private String code;

    @Column(name = "discount_percent", nullable = false)
    private Integer discountPercent;

    @Column(name = "max_discount_amount", precision = 15, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Column(name = "usage_limit")
    @Builder.Default
    private Integer usageLimit = 100;

    @Column(name = "used_count")
    @Builder.Default
    private Integer usedCount = 0;

    @Column(name = "valid_from")
    @Builder.Default
    private LocalDateTime validFrom = LocalDateTime.now();

    @Column(name = "valid_to", nullable = false)
    private LocalDateTime validTo;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Các trường mở rộng @Transient: Serialize/Deserialize Jackson giữa FE và BE, KHÔNG ảnh hưởng Hibernate SQL
    @Transient
    private String targetRole;

    @Transient
    private BigDecimal minOrderAmount;

    @Transient
    private String applicableScope;

    @Transient
    private java.util.List<Long> applicablePlanIds;

    @Transient
    private String description;
}
