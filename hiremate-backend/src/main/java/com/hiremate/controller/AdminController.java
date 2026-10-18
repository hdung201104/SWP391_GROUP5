package com.hiremate.controller;

import com.hiremate.dto.request.SkillCreateRequest;
import com.hiremate.dto.response.*;
import com.hiremate.entity.Job;
import com.hiremate.entity.SubscriptionPlan;
import com.hiremate.enums.CompanyStatus;
import com.hiremate.enums.JobApprovalStatus;
import com.hiremate.enums.UserStatus;
import com.hiremate.service.AdminService;
import com.hiremate.service.SkillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final SkillService skillService;

    private static final AtomicReference<AdminSettingsDTO> systemSettingsRef = 
            new AtomicReference<>(AdminSettingsDTO.builder().build());

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getStats()));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<AdminUserResponse>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllUsers()));
    }

    @PutMapping("/users/{userId}/status")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateUserStatus(
            @PathVariable Long userId,
            @RequestBody Map<String, String> body
    ) {
        String statusStr = body.get("status");
        UserStatus status = UserStatus.valueOf(statusStr.toUpperCase());
        AdminUserResponse updated = adminService.updateUserStatus(userId, status);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái người dùng thành công", updated));
    }

    @GetMapping("/companies")
    public ResponseEntity<ApiResponse<List<AdminCompanyResponse>>> getAllCompanies() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllCompanies()));
    }

    @PutMapping("/companies/{companyId}/status")
    public ResponseEntity<ApiResponse<AdminCompanyResponse>> updateCompanyStatus(
            @PathVariable Long companyId,
            @RequestBody Map<String, String> body
    ) {
        String statusStr = body.get("status");
        CompanyStatus status = CompanyStatus.valueOf(statusStr.toUpperCase());
        AdminCompanyResponse updated = adminService.updateCompanyStatus(companyId, status);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái doanh nghiệp thành công", updated));
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<PaymentOrderResponse>>> getAllOrders() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllOrders()));
    }

    @PutMapping("/orders/{orderId}/approve")
    public ResponseEntity<ApiResponse<PaymentOrderResponse>> approveOrder(
            @PathVariable Long orderId,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String note = body != null ? body.get("adminNote") : null;
        PaymentOrderResponse response = adminService.approveOrder(orderId, note);
        return ResponseEntity.ok(ApiResponse.ok("Duyệt đơn hàng VietQR thành công", response));
    }

    @PutMapping("/orders/{orderId}/reject")
    public ResponseEntity<ApiResponse<PaymentOrderResponse>> rejectOrder(
            @PathVariable Long orderId,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String note = body != null ? body.get("adminNote") : null;
        PaymentOrderResponse response = adminService.rejectOrder(orderId, note);
        return ResponseEntity.ok(ApiResponse.ok("Từ chối đơn hàng thành công", response));
    }

    @GetMapping("/plans")
    public ResponseEntity<ApiResponse<List<SubscriptionPlan>>> getAllPlans() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllPlans()));
    }

    @PostMapping("/plans")
    public ResponseEntity<ApiResponse<SubscriptionPlan>> createPlan(@RequestBody SubscriptionPlan plan) {
        SubscriptionPlan saved = adminService.savePlan(plan);
        return ResponseEntity.ok(ApiResponse.ok("Tạo gói dịch vụ thành công", saved));
    }

    @PutMapping("/plans/{planId}")
    public ResponseEntity<ApiResponse<SubscriptionPlan>> updatePlan(
            @PathVariable Long planId,
            @RequestBody SubscriptionPlan plan
    ) {
        plan.setPlanId(planId);
        SubscriptionPlan saved = adminService.savePlan(plan);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật gói dịch vụ thành công", saved));
    }

    @GetMapping("/jobs")
    public ResponseEntity<ApiResponse<List<JobResponse>>> getAllJobs() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllJobs()));
    }

    @PutMapping("/jobs/{jobId}/approval")
    public ResponseEntity<ApiResponse<JobResponse>> updateJobApproval(
            @PathVariable Long jobId,
            @RequestBody Map<String, String> body
    ) {
        String statusStr = body.get("status");
        JobApprovalStatus status = JobApprovalStatus.valueOf(statusStr.toUpperCase());
        JobResponse updated = adminService.updateJobApproval(jobId, status);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật duyệt tin tuyển dụng thành công", updated));
    }

    @GetMapping("/vouchers")
    public ResponseEntity<ApiResponse<List<com.hiremate.entity.Voucher>>> getAllVouchers() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllVouchers()));
    }

    @PostMapping("/vouchers")
    public ResponseEntity<ApiResponse<com.hiremate.entity.Voucher>> createVoucher(@RequestBody com.hiremate.entity.Voucher voucher) {
        com.hiremate.entity.Voucher saved = adminService.saveVoucher(voucher);
        return ResponseEntity.ok(ApiResponse.ok("Tạo voucher thành công", saved));
    }

    @PutMapping("/vouchers/{voucherId}/toggle")
    public ResponseEntity<ApiResponse<com.hiremate.entity.Voucher>> toggleVoucher(@PathVariable Long voucherId) {
        com.hiremate.entity.Voucher toggled = adminService.toggleVoucher(voucherId);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái voucher thành công", toggled));
    }

    // =========================================================================
    // MASTER SKILLS MANAGEMENT (QUẢN TRỊ TỪ ĐIỂN KỸ NĂNG)
    // =========================================================================

    @GetMapping("/skills")
    public ResponseEntity<ApiResponse<List<SkillResponse>>> getAdminSkills(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(ApiResponse.ok(skillService.getAllSkills(category, keyword)));
    }

    @PostMapping("/skills")
    public ResponseEntity<ApiResponse<SkillResponse>> createAdminSkill(@RequestBody @Valid SkillCreateRequest request) {
        SkillResponse created = skillService.createSkill(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Thêm kỹ năng mới vào hệ thống thành công", created));
    }

    @DeleteMapping("/skills/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAdminSkill(@PathVariable Long id) {
        skillService.deleteSkill(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa kỹ năng khỏi danh mục thành công", null));
    }

    // =========================================================================
    // SYSTEM SETTINGS & PARAMETERS (CẤU HÌNH HỆ THỐNG & AI MATCHING)
    // =========================================================================

    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<AdminSettingsDTO>> getSystemSettings() {
        return ResponseEntity.ok(ApiResponse.ok(systemSettingsRef.get()));
    }

    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<AdminSettingsDTO>> updateSystemSettings(@RequestBody AdminSettingsDTO newSettings) {
        if (newSettings != null) {
            systemSettingsRef.set(newSettings);
        }
        return ResponseEntity.ok(ApiResponse.ok("Lưu cấu hình hệ thống thành công", systemSettingsRef.get()));
    }
}
