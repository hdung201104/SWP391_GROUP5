package com.hiremate.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStatsResponse {
    private long totalUsers;
    private long candidateCount;
    private long recruiterCount;
    private long adminCount;

    private long totalCompanies;
    private long activeCompanies;
    private long pendingCompanies;

    private long totalJobs;
    private long publishedJobs;
    private long pendingApprovalJobs;

    private long totalApplications;
    private long totalInterviews;

    private long totalOrders;
    private long pendingOrders;
    private long approvedOrders;
    private BigDecimal totalRevenue;
}
