package com.hiremate.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionResponse {
    private Long subscriptionId;
    private Long planId;
    private String planName;
    private String planType;
    private String targetRole;
    private Integer quotaLimit;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String status;
    private Long daysRemaining;
    private boolean active;

    public static SubscriptionResponse inactive() {
        SubscriptionResponse res = new SubscriptionResponse();
        res.active = false;
        res.planName = "Miễn phí (Free Tier)";
        res.status = "INACTIVE";
        res.quotaLimit = 0;
        res.daysRemaining = 0L;
        return res;
    }

    public static SubscriptionResponse expired(Long subscriptionId, String planName) {
        SubscriptionResponse res = new SubscriptionResponse();
        res.active = false;
        res.subscriptionId = subscriptionId;
        res.planName = planName != null ? planName : "Đã hết hạn";
        res.status = "EXPIRED";
        res.quotaLimit = 0;
        res.daysRemaining = 0L;
        return res;
    }

    public static SubscriptionResponse of(
            Long subscriptionId,
            Long planId,
            String planName,
            String planType,
            String targetRole,
            Integer quotaLimit,
            LocalDateTime startDate,
            LocalDateTime endDate,
            String status,
            Long daysRemaining,
            boolean active
    ) {
        SubscriptionResponse res = new SubscriptionResponse();
        res.subscriptionId = subscriptionId;
        res.planId = planId;
        res.planName = planName;
        res.planType = planType;
        res.targetRole = targetRole;
        res.quotaLimit = quotaLimit;
        res.startDate = startDate;
        res.endDate = endDate;
        res.status = status;
        res.daysRemaining = daysRemaining;
        res.active = active;
        return res;
    }
}
