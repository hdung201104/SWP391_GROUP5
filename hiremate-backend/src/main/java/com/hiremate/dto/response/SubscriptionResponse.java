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
}
