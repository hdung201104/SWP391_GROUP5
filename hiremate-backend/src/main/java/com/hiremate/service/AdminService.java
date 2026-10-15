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
    
    List<PaymentOrderResponse> getAllOrders();
    PaymentOrderResponse approveOrder(Long orderId, String adminNote);
    PaymentOrderResponse rejectOrder(Long orderId, String adminNote);
    
    List<SubscriptionPlan> getAllPlans();
    SubscriptionPlan savePlan(SubscriptionPlan plan);
    
    List<JobResponse> getAllJobs();
    JobResponse updateJobApproval(Long jobId, JobApprovalStatus status);

    List<com.hiremate.entity.Voucher> getAllVouchers();
    com.hiremate.entity.Voucher toggleVoucher(Long voucherId);
    com.hiremate.entity.Voucher saveVoucher(com.hiremate.entity.Voucher voucher);
}
