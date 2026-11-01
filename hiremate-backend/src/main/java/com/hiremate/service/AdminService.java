package com.hiremate.service;

import com.hiremate.dto.response.*;
import com.hiremate.entity.Job;
import com.hiremate.entity.SubscriptionPlan;
import com.hiremate.enums.CompanyStatus;
import com.hiremate.enums.JobApprovalStatus;
import com.hiremate.enums.UserStatus;

import java.util.List;

public interface AdminService {
    AdminStatsResponse getStats();
    
    List<AdminUserResponse> getAllUsers();
    AdminUserResponse updateUserStatus(Long userId, UserStatus status);
    
    List<AdminCompanyResponse> getAllCompanies();
    AdminCompanyResponse updateCompanyStatus(Long companyId, CompanyStatus status);
    AdminCompanyResponse updateCompanyStatus(Long companyId, CompanyStatus status, String notes);
    
    List<PaymentOrderResponse> getAllOrders();
    PaymentOrderResponse approveOrder(Long orderId, String adminNote);
    PaymentOrderResponse rejectOrder(Long orderId, String adminNote);
    java.util.Map<String, Object> refundOrder(Long orderId);
    
    List<SubscriptionPlan> getAllPlans();
    SubscriptionPlan savePlan(SubscriptionPlan plan);
    SubscriptionPlan createPlan(SubscriptionPlan plan);
    SubscriptionPlan updatePlan(Long planId, SubscriptionPlan plan);
    void deletePlan(Long planId);
    SubscriptionPlan togglePlanStatus(Long planId);
    AdminUserResponse assignUserTier(Long userId, Long planId, Integer durationDays);
    AdminUserResponse assignUserTier(Long userId, Long planId, Integer durationDays, Integer customQuota);
    
    List<JobResponse> getAllJobs();
    JobResponse updateJobApproval(Long jobId, JobApprovalStatus status);
    JobResponse updateJobApproval(Long jobId, JobApprovalStatus status, String reason);

    List<com.hiremate.entity.Voucher> getAllVouchers();
    com.hiremate.entity.Voucher toggleVoucher(Long voucherId);
    com.hiremate.entity.Voucher saveVoucher(com.hiremate.entity.Voucher voucher);
    void deleteVoucher(Long voucherId);

    List<InterviewSummaryResponse> getAllInterviewSessions();
    InterviewSummaryResponse getInterviewSessionDetail(Long sessionId);

    AiJobMatchResponse simulateAiMatch(Long jobId, Long candidateId);
    List<AiJobMatchResponse> getAllAiMatches();
}
