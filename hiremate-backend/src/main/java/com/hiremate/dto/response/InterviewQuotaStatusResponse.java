package com.hiremate.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO trả về thông tin gói dịch vụ & hạn ngạch phỏng vấn AI thực tế của ứng viên.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewQuotaStatusResponse {
    private Long planId;
    private String planName;
    private BigDecimal price;
    private Integer quotaLimit;
    private Long usedToday;
    private Long remainingToday;
    private Integer maxQuestions;
    private Integer maxDurationSeconds;
    private Boolean isQuotaExceeded;
    private Boolean isPaidPlan;
    private String subscriptionEndDate;
    private String allowedPersonas;
    private String allowedVoices;
    private Integer coachHintsPerSession;
    private Boolean unlockFullStar;
    private Boolean unlockRoadmapStages;
}
