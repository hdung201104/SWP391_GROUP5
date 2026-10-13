package com.hiremate.service.impl;

import com.hiremate.dto.response.*;
import com.hiremate.entity.*;
import com.hiremate.enums.*;
import com.hiremate.exception.ResourceNotFoundException;
import com.hiremate.repository.*;
import com.hiremate.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final InterviewSessionRepository interviewSessionRepository;
    private final PaymentOrderRepository paymentOrderRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final VoucherRepository voucherRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        long totalUsers = userRepository.count();
        long candidateCount = userRepository.countByRole(UserRole.CANDIDATE);
        long recruiterCount = userRepository.countByRole(UserRole.RECRUITER);
        long adminCount = userRepository.countByRole(UserRole.ADMIN);

        long totalCompanies = companyRepository.count();
        long activeCompanies = companyRepository.findAll().stream()
                .filter(c -> c.getStatus() == CompanyStatus.ACTIVE)
                .count();
        long pendingCompanies = 0; // Companies do not have pending status currently, default to 0

        long totalJobs = jobRepository.count();
        long publishedJobs = jobRepository.countByApprovalStatus(JobApprovalStatus.APPROVED);
        long pendingApprovalJobs = jobRepository.countByApprovalStatus(JobApprovalStatus.PENDING);

        long totalApplications = applicationRepository.count();
        long totalInterviews = interviewSessionRepository.count();

        long totalOrders = paymentOrderRepository.count();
        long pendingOrders = paymentOrderRepository.countByStatus(PaymentOrderStatus.PENDING);
        long approvedOrders = paymentOrderRepository.countByStatus(PaymentOrderStatus.APPROVED);
        BigDecimal totalRevenue = paymentOrderRepository.sumTotalRevenue();
        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }

        return AdminStatsResponse.builder()
                .totalUsers(totalUsers)
                .candidateCount(candidateCount)
                .recruiterCount(recruiterCount)
                .adminCount(adminCount)
                .totalCompanies(totalCompanies)
                .activeCompanies(activeCompanies)
                .pendingCompanies(pendingCompanies)
                .totalJobs(totalJobs)
                .publishedJobs(publishedJobs)
                .pendingApprovalJobs(pendingApprovalJobs)
                .totalApplications(totalApplications)
                .totalInterviews(totalInterviews)
                .totalOrders(totalOrders)
                .pendingOrders(pendingOrders)
                .approvedOrders(approvedOrders)
                .totalRevenue(totalRevenue)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserResponse> getAllUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(user -> {
                    String companyName = null;
                    if (user.getRole() == UserRole.RECRUITER) {
                        companyName = companyRepository.findByRecruiterId(user.getUserId())
                                .map(Company::getCompanyName)
                                .orElse(null);
                    }

                    return AdminUserResponse.builder()
                            .id(user.getUserId())
                            .name(user.getFullName())
                            .email(user.getEmail())
                            .phone(user.getPhone())
                            .role(user.getRole())
                            .company(companyName != null ? companyName : "-")
                            .status(user.getStatus())
                            .joined(user.getCreatedAt())
                            .isEmailVerified(user.getIsEmailVerified())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AdminUserResponse updateUserStatus(Long userId, UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));
        user.setStatus(status);
        userRepository.save(user);

        return AdminUserResponse.builder()
                .id(user.getUserId())
                .name(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .joined(user.getCreatedAt())
                .isEmailVerified(user.getIsEmailVerified())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminCompanyResponse> getAllCompanies() {
        return companyRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(comp -> {
                    String recruiterName = null;
                    String recruiterEmail = null;
                    String recruiterPhone = null;
                    if (comp.getRecruiterId() != null) {
                        User r = userRepository.findById(comp.getRecruiterId()).orElse(null);
                        if (r != null) {
                            recruiterName = r.getFullName();
                            recruiterEmail = r.getEmail();
                            recruiterPhone = r.getPhone();
                        }
                    }

                    return AdminCompanyResponse.builder()
                            .id(comp.getCompanyId())
                            .name(comp.getCompanyName())
                            .shortName(comp.getCompanyName())
                            .taxCode("MST-" + comp.getCompanyId())
                            .recruiterId(comp.getRecruiterId())
                            .recruiterName(recruiterName != null ? recruiterName : "Chưa gắn recruiter")
                            .recruiterEmail(recruiterEmail != null ? recruiterEmail : "-")
                            .recruiterPhone(recruiterPhone != null ? recruiterPhone : "-")
                            .industry("Công nghệ & Dịch vụ")
                            .scale(comp.getCompanySize() != null ? comp.getCompanySize() : "50-100")
                            .headquarters(comp.getAddress() != null ? comp.getAddress() : "-")
                            .website(comp.getWebsite() != null ? comp.getWebsite() : "-")
                            .logoUrl(comp.getLogoUrl())
                            .status(comp.getStatus())
                            .createdAt(comp.getCreatedAt())
                            .docUrl(null)
                            .docName(null)
                            .notes(null)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AdminCompanyResponse updateCompanyStatus(Long companyId, CompanyStatus status) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy công ty với ID: " + companyId));
        company.setStatus(status);
        companyRepository.save(company);

        return AdminCompanyResponse.builder()
                .id(company.getCompanyId())
                .name(company.getCompanyName())
                .shortName(company.getCompanyName())
                .status(company.getStatus())
                .createdAt(company.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentOrderResponse> getAllOrders() {
        return paymentOrderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToPaymentOrderResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PaymentOrderResponse approveOrder(Long orderId, String adminNote) {
        PaymentOrder order = paymentOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng ID: " + orderId));

        order.setStatus(PaymentOrderStatus.APPROVED);
        order.setApprovedAt(LocalDateTime.now());
        if (adminNote != null && !adminNote.isBlank()) {
            order.setAdminNote(adminNote);
        }
        // Đảm bảo đơn hàng được gán gói trả phí chính xác nếu trước đó bị gán Free Plan
        SubscriptionPlan plan = order.getPlan();
        if ((plan == null || (plan.getPrice() != null && plan.getPrice().compareTo(java.math.BigDecimal.ZERO) == 0))
                && order.getAmount() != null && order.getAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
            String role = (order.getUser() != null && order.getUser().getRole() != null)
                    ? order.getUser().getRole().name() : "CANDIDATE";
            List<SubscriptionPlan> paidPlans = subscriptionPlanRepository.findByTargetRoleAndIsActiveTrueOrderByPriceAsc(role).stream()
                    .filter(p -> p.getPrice() != null && p.getPrice().compareTo(java.math.BigDecimal.ZERO) > 0)
                    .collect(Collectors.toList());
            if (!paidPlans.isEmpty()) {
                SubscriptionPlan matched = paidPlans.get(0);
                for (SubscriptionPlan p : paidPlans) {
                    if (p.getPrice().compareTo(order.getAmount()) == 0) {
                        matched = p;
                        break;
                    }
                }
                plan = matched;
                order.setPlan(plan);
            }
        }

        paymentOrderRepository.save(order);

        // Kích hoạt hoặc gia hạn Subscription
        if (order.getUser() != null && plan != null) {
            int durationDays = (plan.getDurationDays() != null && plan.getDurationDays() > 0) ? plan.getDurationDays() : 30;

            Subscription subscription = Subscription.builder()
                    .user(order.getUser())
                    .plan(plan)
                    .order(order)
                    .startDate(LocalDateTime.now())
                    .endDate(LocalDateTime.now().plusDays(durationDays))
                    .status(SubscriptionStatus.ACTIVE)
                    .build();

            subscriptionRepository.save(subscription);
            log.info("Kích hoạt subscription cho user: {}, gói: {}", order.getUser().getEmail(), plan.getPlanName());
        }

        // Cập nhật lượt dùng voucher
        if (order.getVoucher() != null) {
            Voucher v = order.getVoucher();
            v.setUsedCount((v.getUsedCount() != null ? v.getUsedCount() : 0) + 1);
            voucherRepository.save(v);
            log.info("Tăng lượt dùng cho voucher: {}, tổng: {}", v.getCode(), v.getUsedCount());
        }

        return mapToPaymentOrderResponse(order);
    }

    @Override
    @Transactional
    public PaymentOrderResponse rejectOrder(Long orderId, String adminNote) {
        PaymentOrder order = paymentOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng ID: " + orderId));

        order.setStatus(PaymentOrderStatus.REJECTED);
        if (adminNote != null && !adminNote.isBlank()) {
            order.setAdminNote(adminNote);
        }
        paymentOrderRepository.save(order);

        return mapToPaymentOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubscriptionPlan> getAllPlans() {
        return subscriptionPlanRepository.findAll();
    }

    @Override
    @Transactional
    public SubscriptionPlan savePlan(SubscriptionPlan plan) {
        return subscriptionPlanRepository.save(plan);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Job> getAllJobs() {
        return jobRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    @Transactional
    public Job updateJobApproval(Long jobId, JobApprovalStatus status) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy công việc ID: " + jobId));
        job.setApprovalStatus(status);
        if (status == JobApprovalStatus.APPROVED && job.getStatus() == JobStatus.DRAFT) {
            job.setStatus(JobStatus.PUBLISHED);
        }
        return jobRepository.save(job);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Voucher> getAllVouchers() {
        return voucherRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    @Transactional
    public Voucher toggleVoucher(Long voucherId) {
        Voucher v = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy voucher ID: " + voucherId));
        v.setIsActive(!Boolean.TRUE.equals(v.getIsActive()));
        return voucherRepository.save(v);
    }

    @Override
    @Transactional
    public Voucher saveVoucher(Voucher voucher) {
        if (voucher.getValidFrom() == null) {
            voucher.setValidFrom(LocalDateTime.now());
        }
        if (voucher.getValidTo() == null) {
            voucher.setValidTo(LocalDateTime.now().plusDays(30));
        }
        if (voucher.getIsActive() == null) {
            voucher.setIsActive(true);
        }
        if (voucher.getUsedCount() == null) {
            voucher.setUsedCount(0);
        }
        if (voucher.getUsageLimit() == null) {
            voucher.setUsageLimit(100);
        }
        return voucherRepository.save(voucher);
    }

    private PaymentOrderResponse mapToPaymentOrderResponse(PaymentOrder order) {
        return PaymentOrderResponse.builder()
                .orderId(order.getOrderId())
                .orderCode(order.getOrderCode())
                .userId(order.getUser() != null ? order.getUser().getUserId() : null)
                .userName(order.getUser() != null ? order.getUser().getFullName() : "N/A")
                .userEmail(order.getUser() != null ? order.getUser().getEmail() : "N/A")
                .userRole(order.getUser() != null && order.getUser().getRole() != null ? order.getUser().getRole().name() : "USER")
                .planId(order.getPlan() != null ? order.getPlan().getPlanId() : null)
                .planName(order.getPlan() != null ? order.getPlan().getPlanName() : "Gói dịch vụ")
                .amount(order.getAmount())
                .discountAmount(order.getDiscountAmount())
                .voucherCode(order.getVoucher() != null ? order.getVoucher().getCode() : null)
                .status(order.getStatus())
                .adminNote(order.getAdminNote())
                .createdAt(order.getCreatedAt())
                .approvedAt(order.getApprovedAt())
                .build();
    }
}
