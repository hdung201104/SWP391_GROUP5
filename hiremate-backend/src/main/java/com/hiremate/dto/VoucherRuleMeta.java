package com.hiremate.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoucherRuleMeta {
    @Builder.Default
    private String targetRole = "ALL"; // ALL, RECRUITER, CANDIDATE

    @Builder.Default
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    @Builder.Default
    private String applicableScope = "ALL"; // ALL, SPECIFIC

    private List<Long> applicablePlanIds;

    private String description;
}
