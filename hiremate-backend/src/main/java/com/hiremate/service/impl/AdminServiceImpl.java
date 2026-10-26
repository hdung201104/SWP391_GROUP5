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
    private final com.hiremate.repository.InterviewDetailRepository interviewDetailRepository;
    private final com.hiremate.repository.PracticeProgressLogRepository practiceProgressLogRepository;
    private final com.hiremate.repository.CandidateRepository candidateRepository;
    private final com.hiremate.repository.CvRepository cvRepository;
    private final com.hiremate.repository.AiJobMatchRepository aiJobMatchRepository;
    private final com.hiremate.service.AiJobMatchService aiJobMatchService;
    private final com.hiremate.service.JobService jobService;
    private final com.hiremate.service.NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        long totalUsers = userRepository.count();
        long candidateCount = userRepository.countByRole(UserRole.CANDIDATE);
        long recruiterCount = userRepository.countByRole(UserRole.RECRUITER);
        long adminCount = userRepository.countByRole(UserRole.ADMIN);

        long totalCompanies = companyRepository.count();
        long activeCompanies = companyRepository.findAll().stream()
                .filter(c -> c.getStatus() == CompanyStatus.ACTIVE || c.getStatus() == CompanyStatus.VERIFIED)
                .count();
        long pendingCompanies = companyRepository.findAll().stream()
                .filter(c -> c.getStatus() == CompanyStatus.PENDING)
                .count();

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

        AdminStatsResponse stats = new AdminStatsResponse();
        stats.setTotalUsers(totalUsers);
        stats.setCandidateCount(candidateCount);
        stats.setRecruiterCount(recruiterCount);
        stats.setAdminCount(adminCount);
        stats.setTotalCompanies(totalCompanies);
        stats.setActiveCompanies(activeCompanies);
        stats.setPendingCompanies(pendingCompanies);
        stats.setTotalJobs(totalJobs);
        stats.setPublishedJobs(publishedJobs);
        stats.setPendingApprovalJobs(pendingApprovalJobs);
        stats.setTotalApplications(totalApplications);
        stats.setTotalInterviews(totalInterviews);
        stats.setTotalOrders(totalOrders);
        stats.setPendingOrders(pendingOrders);
        stats.setApprovedOrders(approvedOrders);
        stats.setTotalRevenue(totalRevenue);
        return stats;
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

                    String authProvider = "LOCAL";
                    if (user.getPasswordHash() != null && user.getPasswordHash().contains("GoogleOAuth2_")) {
                        authProvider = "GOOGLE";
                    } else if (user.getAvatarUrl() != null && user.getAvatarUrl().contains("googleusercontent.com")) {
                        authProvider = "GOOGLE";
                    }

                    AdminUserResponse resp = new AdminUserResponse();
                    resp.setId(user.getUserId());
                    resp.setName(user.getFullName());
                    resp.setEmail(user.getEmail());
                    resp.setPhone(user.getPhone());
                    resp.setRole(user.getRole());
                    resp.setCompany(companyName != null ? companyName : "-");
                    resp.setStatus(user.getStatus());
                    resp.setJoined(user.getCreatedAt());
                    resp.setIsEmailVerified(user.getIsEmailVerified());
                    resp.setAuthProvider(authProvider);
                    resp.setAvatarUrl(user.getAvatarUrl());
                    resp.setLastActiveAt(user.getUpdatedAt() != null ? user.getUpdatedAt() : user.getCreatedAt());
                    return resp;
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

        String authProvider = (user.getPasswordHash() != null && user.getPasswordHash().contains("GoogleOAuth2_")) ? "GOOGLE" : "LOCAL";

        AdminUserResponse resp = new AdminUserResponse();
        resp.setId(user.getUserId());
        resp.setName(user.getFullName());
        resp.setEmail(user.getEmail());
        resp.setPhone(user.getPhone());
        resp.setRole(user.getRole());
        resp.setStatus(user.getStatus());
        resp.setJoined(user.getCreatedAt());
        resp.setIsEmailVerified(user.getIsEmailVerified());
        resp.setAuthProvider(authProvider);
        resp.setAvatarUrl(user.getAvatarUrl());
        resp.setLastActiveAt(user.getUpdatedAt() != null ? user.getUpdatedAt() : user.getCreatedAt());
        return resp;
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

                    AdminCompanyResponse resp = new AdminCompanyResponse();
                    resp.setId(comp.getCompanyId());
                    resp.setName(comp.getCompanyName());
                    resp.setShortName(comp.getCompanyName());
                    resp.setTaxCode(comp.getTaxCode() != null ? comp.getTaxCode() : "MST-" + comp.getCompanyId());
                    resp.setRecruiterId(comp.getRecruiterId());
                    resp.setRecruiterName(recruiterName != null ? recruiterName : "Chưa gắn recruiter");
                    resp.setRecruiterEmail(recruiterEmail != null ? recruiterEmail : "-");
                    resp.setRecruiterPhone(recruiterPhone != null ? recruiterPhone : "-");
                    resp.setIndustry(comp.getIndustry() != null ? comp.getIndustry() : "Công nghệ & Dịch vụ");
                    resp.setScale(comp.getCompanySize() != null ? comp.getCompanySize() : "50-100");
                    resp.setHeadquarters(comp.getAddress() != null ? comp.getAddress() : "-");
                    resp.setWebsite(comp.getWebsite() != null ? comp.getWebsite() : "-");
                    resp.setLogoUrl(comp.getLogoUrl());
                    resp.setStatus(comp.getStatus() != null ? comp.getStatus() : CompanyStatus.PENDING);
                    resp.setCreatedAt(comp.getCreatedAt());
                    resp.setDocUrl(comp.getLicenseDocUrl());
                    resp.setDocName(comp.getLicenseDocName() != null ? comp.getLicenseDocName() : "GPKD_Doanh_Nghiep.pdf");
                    resp.setLicenseNumber(comp.getLicenseNumber());
                    resp.setLegalRepresentative(comp.getLegalRepresentative());
                    resp.setVerifiedAt(comp.getVerifiedAt());
                    resp.setNotes(comp.getRejectionReason());
                    return resp;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AdminCompanyResponse updateCompanyStatus(Long companyId, CompanyStatus status) {
        return updateCompanyStatus(companyId, status, null);
    }

    @Override
    @Transactional
    public AdminCompanyResponse updateCompanyStatus(Long companyId, CompanyStatus status, String notes) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy công ty với ID: " + companyId));
        company.setStatus(status);
        if (status == CompanyStatus.VERIFIED || status == CompanyStatus.ACTIVE) {
            company.setVerifiedAt(LocalDateTime.now());
            company.setRejectionReason(null);
            if (company.getRecruiterId() != null && notificationService != null) {
                try {
                    notificationService.createNotification(
                            company.getRecruiterId(),
                            NotificationType.SYSTEM_ALERT,
                            "Hồ sơ Doanh nghiệp đã được xác minh thành công!",
                            "Ban Quản Trị HireMate đã phê duyệt Giấy phép kinh doanh của " + company.getCompanyName() + ". Doanh nghiệp hiện đã được cấp quyền xuất bản tin tuyển dụng.",
                            company.getCompanyId(),
                            "companies"
                    );
                } catch (Exception e) {
                    log.warn("Không thể gửi thông báo duyệt DN: {}", e.getMessage());
                }
            }
        } else if (status == CompanyStatus.REJECTED || status == CompanyStatus.BANNED) {
            company.setVerifiedAt(null);
            if (notes != null && !notes.isBlank()) {
                company.setRejectionReason(notes);
            }
            if (company.getRecruiterId() != null && notificationService != null) {
                try {
                    notificationService.createNotification(
                            company.getRecruiterId(),
                            NotificationType.SYSTEM_ALERT,
                            "Hồ sơ Doanh nghiệp bị từ chối phê duyệt",
                            "Ban Quản Trị đã từ chối hồ sơ pháp lý của " + company.getCompanyName() + ". Lý do: " + (notes != null ? notes : "Thông tin chưa khớp với Cổng DKKD quốc gia") + ". Vui lòng cập nhật lại hồ sơ.",
                            company.getCompanyId(),
                            "companies"
                    );
                } catch (Exception e) {
                    log.warn("Không thể gửi thông báo từ chối DN: {}", e.getMessage());
                }
            }
        }
        companyRepository.save(company);

        String recruiterName = null;
        String recruiterEmail = null;
        String recruiterPhone = null;
        if (company.getRecruiterId() != null) {
            User r = userRepository.findById(company.getRecruiterId()).orElse(null);
            if (r != null) {
                recruiterName = r.getFullName();
                recruiterEmail = r.getEmail();
                recruiterPhone = r.getPhone();
            }
        }

        AdminCompanyResponse resp = new AdminCompanyResponse();
        resp.setId(company.getCompanyId());
        resp.setName(company.getCompanyName());
        resp.setShortName(company.getCompanyName());
        resp.setTaxCode(company.getTaxCode());
        resp.setRecruiterId(company.getRecruiterId());
        resp.setRecruiterName(recruiterName != null ? recruiterName : "Chưa gắn recruiter");
        resp.setRecruiterEmail(recruiterEmail != null ? recruiterEmail : "-");
        resp.setRecruiterPhone(recruiterPhone != null ? recruiterPhone : "-");
        resp.setIndustry(company.getIndustry() != null ? company.getIndustry() : "Công nghệ & Dịch vụ");
        resp.setScale(company.getCompanySize() != null ? company.getCompanySize() : "50-100");
        resp.setHeadquarters(company.getAddress() != null ? company.getAddress() : "-");
        resp.setWebsite(company.getWebsite() != null ? company.getWebsite() : "-");
        resp.setLogoUrl(company.getLogoUrl());
        resp.setStatus(company.getStatus());
        resp.setCreatedAt(company.getCreatedAt());
        resp.setDocUrl(company.getLicenseDocUrl());
        resp.setDocName(company.getLicenseDocName() != null ? company.getLicenseDocName() : "GPKD_Doanh_Nghiep.pdf");
        resp.setLicenseNumber(company.getLicenseNumber());
        resp.setLegalRepresentative(company.getLegalRepresentative());
        resp.setVerifiedAt(company.getVerifiedAt());
        resp.setNotes(company.getRejectionReason());
        return resp;
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

        // Gửi thông báo đến người dùng
        if (order.getUser() != null && notificationService != null) {
            try {
                String planTitle = plan != null ? plan.getPlanName() : "Gói dịch vụ";
                notificationService.createNotification(
                        order.getUser().getUserId(),
                        NotificationType.SYSTEM_ALERT,
                        "Đơn thanh toán đã được phê duyệt!",
                        "Ban Quản Trị HireMate đã xác nhận thanh toán đơn #" + order.getOrderCode() + ". Gói \"" + planTitle + "\" đã được kích hoạt thành công!",
                        order.getOrderId(),
                        "payment_orders"
                );
            } catch (Exception notifEx) {
                log.warn("Không thể gửi thông báo duyệt đơn hàng: {}", notifEx.getMessage());
            }
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

        // Gửi thông báo từ chối đến người dùng
        if (order.getUser() != null && notificationService != null) {
            try {
                String planTitle = order.getPlan() != null ? order.getPlan().getPlanName() : "Gói dịch vụ";
                String reason = (adminNote != null && !adminNote.isBlank()) ? adminNote : "Nội dung giao dịch chưa khớp hoặc không hợp lệ";
                notificationService.createNotification(
                        order.getUser().getUserId(),
                        NotificationType.SYSTEM_ALERT,
                        "Đơn thanh toán bị từ chối",
                        "Đơn thanh toán #" + order.getOrderCode() + " cho gói \"" + planTitle + "\" đã bị từ chối. Lý do: " + reason + ". Vui lòng kiểm tra lại thông tin.",
                        order.getOrderId(),
                        "payment_orders"
                );
            } catch (Exception notifEx) {
                log.warn("Không thể gửi thông báo từ chối đơn hàng: {}", notifEx.getMessage());
            }
        }

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
    public List<JobResponse> getAllJobs() {
        return jobService.getAllJobsForAdmin();
    }

    @Override
    @Transactional
    public JobResponse updateJobApproval(Long jobId, JobApprovalStatus status) {
        return jobService.updateJobApproval(jobId, status);
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
        PaymentOrderResponse resp = new PaymentOrderResponse();
        resp.setOrderId(order.getOrderId());
        resp.setOrderCode(order.getOrderCode());
        resp.setUserId(order.getUser() != null ? order.getUser().getUserId() : null);
        resp.setUserName(order.getUser() != null ? order.getUser().getFullName() : "N/A");
        resp.setUserEmail(order.getUser() != null ? order.getUser().getEmail() : "N/A");
        resp.setUserRole(order.getUser() != null && order.getUser().getRole() != null ? order.getUser().getRole().name() : "USER");
        resp.setPlanId(order.getPlan() != null ? order.getPlan().getPlanId() : null);
        resp.setPlanName(order.getPlan() != null ? order.getPlan().getPlanName() : "Gói dịch vụ");
        resp.setAmount(order.getAmount());
        resp.setDiscountAmount(order.getDiscountAmount());
        resp.setVoucherCode(order.getVoucher() != null ? order.getVoucher().getCode() : null);
        resp.setStatus(order.getStatus());
        resp.setAdminNote(order.getAdminNote());
        resp.setCreatedAt(order.getCreatedAt());
        resp.setApprovedAt(order.getApprovedAt());
        return resp;
    }

    @Override
    @Transactional(readOnly = true)
    public List<InterviewSummaryResponse> getAllInterviewSessions() {
        return interviewSessionRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "startedAt"))
                .stream()
                .map(this::mapToInterviewSummary)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public InterviewSummaryResponse getInterviewSessionDetail(Long sessionId) {
        InterviewSession s = interviewSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiên phỏng vấn #" + sessionId));
        return mapToInterviewSummaryWithDetails(s);
    }

    private InterviewSummaryResponse mapToInterviewSummary(InterviewSession s) {
        String candName = "Ứng viên";
        String candEmail = "";
        if (s.getCandidate() != null) {
            if (s.getCandidate().getUser() != null) {
                candName = s.getCandidate().getUser().getFullName() != null ? s.getCandidate().getUser().getFullName() : "Ứng viên #" + s.getCandidate().getCandidateId();
                candEmail = s.getCandidate().getUser().getEmail() != null ? s.getCandidate().getUser().getEmail() : "";
            } else {
                candName = "Ứng viên #" + s.getCandidate().getCandidateId();
            }
        }
        long qCount = interviewDetailRepository.countBySession_SessionId(s.getSessionId());

        Float delta = null;
        if (s.getSessionType() == com.hiremate.enums.InterviewSessionType.PRACTICE_RETRY && s.getParentSessionId() != null) {
            try {
                var past = interviewSessionRepository.findById(s.getParentSessionId());
                if (past.isPresent() && past.get().getOverallScore() != null && s.getOverallScore() != null) {
                    delta = Math.round((s.getOverallScore() - past.get().getOverallScore()) * 10f) / 10f;
                }
            } catch (Exception ignored) {}
        }

        return InterviewSummaryResponse.builder()
                .sessionId(s.getSessionId())
                .candidateId(s.getCandidate() != null ? s.getCandidate().getCandidateId() : null)
                .candidateName(candName)
                .candidateEmail(candEmail)
                .questionCount((int) qCount)
                .jobId(s.getJob() != null ? s.getJob().getJobId() : null)
                .targetPosition(s.getTargetPosition())
                .sessionType(s.getSessionType())
                .overallScore(s.getOverallScore())
                .overallFeedback(s.getOverallFeedback())
                .weaknessSummary(s.getWeaknessSummary())
                .recommendedTasks(s.getRecommendedTasks())
                .improvementDelta(delta)
                .startedAt(s.getStartedAt())
                .completedAt(s.getCompletedAt())
                .build();
    }

    private InterviewSummaryResponse mapToInterviewSummaryWithDetails(InterviewSession s) {
        InterviewSummaryResponse resp = mapToInterviewSummary(s);
        List<com.hiremate.entity.InterviewDetail> details = interviewDetailRepository.findBySession_SessionIdOrderByQuestionNumberAsc(s.getSessionId());
        List<InterviewDetailResponse> detailResponses = details.stream()
                .map(d -> InterviewDetailResponse.builder()
                        .detailId(d.getDetailId())
                        .questionNumber(d.getQuestionNumber())
                        .questionText(d.getQuestionText())
                        .candidateAnswerText(d.getCandidateAnswerText())
                        .audioUrl(d.getAudioUrl())
                        .aiEvaluationScore(d.getAiEvaluationScore())
                        .aiFeedback(d.getAiFeedback())
                        .aiSuggestedAnswer(d.getAiSuggestedAnswer())
                        .confidenceLevel("HIGH")
                        .requiresHumanReview(false)
                        .build())
                .collect(Collectors.toList());
        resp.setDetails(detailResponses);
        resp.setQuestionCount(detailResponses.size());
        return resp;
    }

    @Override
    @Transactional
    public AiJobMatchResponse simulateAiMatch(Long jobId, Long candidateId) {
        Job job = null;
        if (jobId != null) {
            job = jobRepository.findById(jobId).orElse(null);
        }
        if (job == null) {
            job = jobRepository.findAll().stream()
                    .filter(j -> j.getStatus() == com.hiremate.enums.JobStatus.PUBLISHED)
                    .findFirst()
                    .orElseGet(() -> jobRepository.findAll().stream().findFirst().orElse(null));
        }
        if (job == null) {
            throw new IllegalArgumentException("Chưa có tin tuyển dụng nào trong hệ thống để so khớp.");
        }

        Candidate candidate = null;
        if (candidateId != null) {
            candidate = candidateRepository.findById(candidateId).orElse(null);
        }
        if (candidate == null) {
            candidate = candidateRepository.findAll().stream().findFirst().orElse(null);
        }
        if (candidate == null) {
            throw new IllegalArgumentException("Chưa có hồ sơ ứng viên nào trong hệ thống để so khớp.");
        }

        final Long cid = candidate.getCandidateId();
        Cv cv = null;
        try {
            cv = cvRepository.findByCandidateIdAndIsDefaultTrue(cid)
                    .orElseGet(() -> cvRepository.findByCandidateId(cid).stream().findFirst().orElse(null));
        } catch (Exception ignored) {}

        if (cv == null) {
            // Nếu ứng viên chưa upload CV (hoặc tài khoản test mới tạo), khởi tạo dữ liệu mô phỏng kỹ năng chuẩn cho Demo Admin
            String candName = candidate.getUser() != null ? candidate.getUser().getFullName() : "Ứng viên";
            String title = job.getTitle() != null ? job.getTitle() : "Software Engineer";
            cv = Cv.builder()
                    .cvId(999000L + cid)
                    .candidateId(cid)
                    .fileName("CV_" + candName.replaceAll("\\s+", "_") + ".pdf")
                    .summary("Kỹ sư phần mềm tài năng với định hướng chuyên sâu " + title + ", thành thạo các kiến trúc dịch vụ hiện đại và quy trình phát triển Agile/Scrum.")
                    .parsedText("Họ tên: " + candName + ". Vị trí mục tiêu: " + title + ". Kỹ năng chuyên môn chính: Java, Spring Boot, SQL, PostgreSQL, RESTful API, Docker, Git, Cấu trúc dữ liệu & Thuật toán, React.js, JavaScript, TypeScript, Manual Testing, Postman API, Microservices.")
                    .build();
        }

        return aiJobMatchService.calculateAndSaveMatch(candidate, job, cv);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AiJobMatchResponse> getAllAiMatches() {
        return aiJobMatchRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "matchingScore"))
                .stream()
                .limit(50)
                .map(aiJobMatchService::mapToResponse)
                .collect(Collectors.toList());
    }
}
