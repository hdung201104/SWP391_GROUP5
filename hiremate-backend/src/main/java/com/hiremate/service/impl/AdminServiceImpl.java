package com.hiremate.service.impl;

import com.hiremate.dto.VoucherRuleMeta;
import com.hiremate.dto.response.*;
import com.hiremate.entity.*;
import com.hiremate.enums.*;
import com.hiremate.exception.BadRequestException;
import com.hiremate.exception.ResourceNotFoundException;
import com.hiremate.repository.*;
import com.hiremate.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
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
    private final com.hiremate.service.SystemSettingsService systemSettingsService;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hiremate.repository.RecruiterRepository recruiterRepository;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hiremate.service.UserCacheService userCacheService;

    @Override
    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        long totalUsers = userRepository.count();
        long candidateCount = userRepository.countByRole(UserRole.CANDIDATE);
        long recruiterCount = userRepository.countByRole(UserRole.RECRUITER);
        long adminCount = userRepository.countByRole(UserRole.ADMIN);

        long totalCompanies = companyRepository.count();
        long activeCompanies = companyRepository.countByStatusIn(List.of(CompanyStatus.ACTIVE, CompanyStatus.VERIFIED));
        long pendingCompanies = companyRepository.countByStatus(CompanyStatus.PENDING);

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
        List<User> users = userRepository.findAllByOrderByCreatedAtDesc();
        if (users.isEmpty()) {
            return Collections.emptyList();
        }

        // 1. Batch load companies for all recruiters in 1 single query (loại bỏ N+1)
        Map<Long, String> recruiterCompanyMap = new HashMap<>();
        Map<Long, String> companyIdToNameMap = new HashMap<>();
        try {
            companyRepository.findAll().forEach(comp -> {
                if (comp.getCompanyId() != null && comp.getCompanyName() != null) {
                    companyIdToNameMap.put(comp.getCompanyId(), comp.getCompanyName());
                }
                if (comp.getRecruiterId() != null && comp.getCompanyName() != null) {
                    recruiterCompanyMap.put(comp.getRecruiterId(), comp.getCompanyName());
                }
            });
            if (recruiterRepository != null) {
                recruiterRepository.findAll().forEach(rec -> {
                    if (rec.getCompany() != null && rec.getCompany().getCompanyId() != null) {
                        String compName = companyIdToNameMap.get(rec.getCompany().getCompanyId());
                        if (compName == null && rec.getCompany().getCompanyName() != null) {
                            compName = rec.getCompany().getCompanyName();
                        }
                        if (compName != null && rec.getRecruiterId() != null) {
                            recruiterCompanyMap.put(rec.getRecruiterId(), compName);
                        }
                    }
                });
            }
        } catch (Exception e) {
            log.warn("Batch load companies error: {}", e.getMessage());
        }

        // 2. Batch load active subscriptions for all users in 1 single query (loại bỏ N+1)
        Map<Long, Subscription> activeSubsMap = new HashMap<>();
        if (subscriptionRepository != null) {
            try {
                List<Subscription> activeSubs = subscriptionRepository.findByStatusWithDetails(SubscriptionStatus.ACTIVE);
                for (Subscription sub : activeSubs) {
                    if (sub.getUser() != null && sub.getUser().getUserId() != null) {
                        activeSubsMap.putIfAbsent(sub.getUser().getUserId(), sub);
                    }
                }
            } catch (Exception e) {
                log.warn("Batch load subscriptions error: {}", e.getMessage());
            }
        }

        return users.stream()
                .map(user -> {
                    String companyName = user.getRole() == UserRole.RECRUITER
                            ? recruiterCompanyMap.get(user.getUserId())
                            : null;

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

                    Subscription activeSub = activeSubsMap.get(user.getUserId());
                    if (activeSub != null) {
                        resp.setCurrentTier(activeSub.getPlan() != null ? activeSub.getPlan().getPlanName() : "Gói Trả Phí");
                        resp.setCurrentPlanId(activeSub.getPlan() != null ? activeSub.getPlan().getPlanId() : null);
                        resp.setSubscriptionStatus("ACTIVE");
                        resp.setSubscriptionEndDate(activeSub.getEndDate());
                        resp.setQuotaLimit((activeSub.getCustomQuota() != null && activeSub.getCustomQuota() > 0)
                                ? activeSub.getCustomQuota()
                                : (activeSub.getPlan() != null ? activeSub.getPlan().getQuotaLimit() : null));
                    } else {
                        resp.setCurrentTier("Starter (Free)");
                        resp.setSubscriptionStatus("NONE");
                        resp.setQuotaLimit(user.getRole() == UserRole.RECRUITER ? 3 : 2);
                    }
                    return resp;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AdminUserResponse updateUserStatus(Long userId, UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));

        if (user.getRole() == UserRole.ADMIN && status != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("Không thể khóa tài khoản Quản trị viên (ADMIN).");
        }

        user.setStatus(status);
        userRepository.save(user);

        if (userCacheService != null) {
            userCacheService.evict(user.getEmail(), user.getUserId());
        }

        // Nếu khóa tài khoản Recruiter, tự động đóng toàn bộ tin tuyển dụng đang PUBLISHED của Recruiter đó
        if (user.getRole() == UserRole.RECRUITER && status != UserStatus.ACTIVE) {
            List<Job> recruiterJobs = jobRepository.findByRecruiter_RecruiterId(user.getUserId());
            for (Job j : recruiterJobs) {
                if (j.getStatus() == JobStatus.PUBLISHED) {
                    j.setStatus(JobStatus.CLOSED);
                    jobRepository.save(j);
                    log.info(">> [AdminService] Tự động đóng Job #{} ({}) do tài khoản Recruiter {} bị khóa ({})",
                            j.getJobId(), j.getTitle(), user.getEmail(), status);
                }
            }
        }

        String authProvider = (user.getPasswordHash() != null && user.getPasswordHash().contains("GoogleOAuth2_")) ? "GOOGLE" : "LOCAL";

        String companyName = null;
        if (user.getRole() == UserRole.RECRUITER) {
            companyName = companyRepository.findByRecruiterId(user.getUserId())
                    .map(Company::getCompanyName)
                    .orElse(null);
            if (companyName == null && recruiterRepository != null) {
                companyName = recruiterRepository.findById(user.getUserId())
                        .map(r -> r.getCompany() != null ? r.getCompany().getCompanyName() : null)
                        .orElse(null);
            }
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

        Subscription activeSub = subscriptionRepository.findFirstByUser_UserIdAndStatusOrderByCreatedAtDesc(
                user.getUserId(), SubscriptionStatus.ACTIVE).orElse(null);
        if (activeSub != null) {
            resp.setCurrentTier(activeSub.getPlan() != null ? activeSub.getPlan().getPlanName() : "Gói Trả Phí");
            resp.setCurrentPlanId(activeSub.getPlan() != null ? activeSub.getPlan().getPlanId() : null);
            resp.setSubscriptionStatus("ACTIVE");
            resp.setSubscriptionEndDate(activeSub.getEndDate());
            resp.setQuotaLimit((activeSub.getCustomQuota() != null && activeSub.getCustomQuota() > 0)
                    ? activeSub.getCustomQuota()
                    : (activeSub.getPlan() != null ? activeSub.getPlan().getQuotaLimit() : null));
        } else {
            resp.setCurrentTier("Starter (Free)");
            resp.setSubscriptionStatus("NONE");
            resp.setQuotaLimit(user.getRole() == UserRole.RECRUITER ? 3 : 2);
        }
        return resp;
    }

    private String resolveDocName(String originalDocName, String docUrl) {
        if (originalDocName != null && !originalDocName.isBlank()
                && !originalDocName.equalsIgnoreCase("Giay_Phep_Kinh_Doanh.pdf")
                && !originalDocName.equalsIgnoreCase("GPKD_Doanh_Nghiep.pdf")) {
            return originalDocName;
        }
        if (docUrl == null || docUrl.isBlank()) {
            return "GPKD_Doanh_Nghiep.pdf";
        }
        String cleanUrl = docUrl.split("\\?")[0];
        String lower = cleanUrl.toLowerCase();
        String ext = ".pdf";
        if (lower.endsWith(".png")) ext = ".png";
        else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) ext = ".jpg";
        else if (lower.endsWith(".webp")) ext = ".webp";

        int lastSlash = cleanUrl.lastIndexOf('/');
        if (lastSlash >= 0 && lastSlash < cleanUrl.length() - 1) {
            String extracted = cleanUrl.substring(lastSlash + 1);
            if (extracted.contains(".")) {
                return extracted;
            }
        }
        return "GPKD_Doanh_Nghiep" + ext;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminCompanyResponse> getAllCompanies() {
        List<Company> companies = companyRepository.findAllByOrderByCreatedAtDesc();
        if (companies.isEmpty()) {
            return Collections.emptyList();
        }

        // Batch load all recruiter users in 1 single query (loại bỏ N+1)
        List<Long> recruiterIds = companies.stream()
                .map(Company::getRecruiterId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<Long, User> recruiterUserMap = new HashMap<>();
        if (!recruiterIds.isEmpty()) {
            try {
                userRepository.findAllById(recruiterIds).forEach(u -> recruiterUserMap.put(u.getUserId(), u));
            } catch (Exception e) {
                log.warn("Batch load recruiter users error: {}", e.getMessage());
            }
        }

        return companies.stream()
                .map(comp -> {
                    String recruiterName = null;
                    String recruiterEmail = null;
                    String recruiterPhone = null;
                    if (comp.getRecruiterId() != null) {
                        User r = recruiterUserMap.get(comp.getRecruiterId());
                        if (r != null) {
                            recruiterName = r.getFullName();
                            recruiterEmail = r.getEmail();
                            recruiterPhone = r.getPhone();
                        }
                    } else if (recruiterRepository != null) {
                        List<Recruiter> recs = recruiterRepository.findAllByCompany_CompanyId(comp.getCompanyId());
                        if (!recs.isEmpty()) {
                            Recruiter firstRec = recs.get(0);
                            User u = firstRec.getUser();
                            if (u != null) {
                                recruiterName = u.getFullName();
                                recruiterEmail = u.getEmail();
                                recruiterPhone = u.getPhone();
                            }
                        }
                    }

                    AdminCompanyResponse resp = new AdminCompanyResponse();
                    resp.setId(comp.getCompanyId());
                    resp.setName(comp.getCompanyName());
                    resp.setShortName(comp.getCompanyName());
                    resp.setTaxCode(comp.getTaxCode()); // null nếu chưa khai báo
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

                    // Chỉ trả về docUrl và docName khi Recruiter thực sự đã tải lên file GPKD hợp lệ
                    boolean hasDoc = CompanyServiceImpl.isValidLicenseDocUrl(comp.getLicenseDocUrl());
                    resp.setHasLicenseDoc(hasDoc);
                    if (hasDoc) {
                        resp.setDocUrl(comp.getLicenseDocUrl());
                        resp.setDocName(resolveDocName(comp.getLicenseDocName(), comp.getLicenseDocUrl()));
                    } else {
                        resp.setDocUrl(null);
                        resp.setDocName(null);
                    }

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

        if (status == CompanyStatus.VERIFIED || status == CompanyStatus.ACTIVE) {
            // Chặn phê duyệt nếu công ty chưa nộp file GPKD hợp lệ
            if (!CompanyServiceImpl.isValidLicenseDocUrl(company.getLicenseDocUrl())) {
                throw new BadRequestException("Doanh nghiệp này chưa tải lên tệp Giấy phép kinh doanh hợp lệ, không thể xác nhận!");
            }
            company.setStatus(status);
            company.setVerifiedAt(LocalDateTime.now());
            company.setRejectionReason(null);
            // Gửi thông báo tới toàn bộ HR của công ty
            if (notificationService != null) {
                Set<Long> targetRecruiterIds = new HashSet<>();
                if (company.getRecruiterId() != null) targetRecruiterIds.add(company.getRecruiterId());
                if (recruiterRepository != null) {
                    List<Recruiter> companyRecs = recruiterRepository.findAllByCompany_CompanyId(company.getCompanyId());
                    for (Recruiter r : companyRecs) {
                        if (r.getRecruiterId() != null) targetRecruiterIds.add(r.getRecruiterId());
                    }
                }
                for (Long rId : targetRecruiterIds) {
                    try {
                        notificationService.createNotification(
                                rId,
                                NotificationType.SYSTEM_ALERT,
                                "Hồ sơ Doanh nghiệp đã được xác minh thành công!",
                                "Ban Quản Trị HireMate đã phê duyệt Giấy phép kinh doanh của " + company.getCompanyName() + ". Doanh nghiệp hiện đã được cấp quyền xuất bản tin tuyển dụng.",
                                company.getCompanyId(),
                                "companies"
                        );
                    } catch (Exception e) {
                        log.warn("Không thể gửi thông báo duyệt DN tới recruiter {}: {}", rId, e.getMessage());
                    }
                }
            }
        } else if (status == CompanyStatus.REJECTED || status == CompanyStatus.BANNED || status == CompanyStatus.SUSPENDED) {
            company.setStatus(status);
            if (status == CompanyStatus.REJECTED && (notes == null || notes.isBlank())) {
                throw new BadRequestException("Vui lòng cung cấp lý do từ chối hồ sơ Giấy phép kinh doanh của Doanh nghiệp!");
            }
            company.setVerifiedAt(null);
            if (notes != null && !notes.isBlank()) {
                company.setRejectionReason(notes);
            }
            // Tự động đóng các tin tuyển dụng đang PUBLISHED của công ty này
            List<Job> companyJobs = jobRepository.findByCompany_CompanyId(companyId);
            for (Job j : companyJobs) {
                if (j.getStatus() == JobStatus.PUBLISHED) {
                    j.setStatus(JobStatus.CLOSED);
                    jobRepository.save(j);
                    log.info(">> [AdminService] Tự động đóng Job #{} ({}) do công ty chuyển sang {}", j.getJobId(), j.getTitle(), status);
                }
            }
            if (notificationService != null) {
                Set<Long> targetRecruiterIds = new HashSet<>();
                if (company.getRecruiterId() != null) targetRecruiterIds.add(company.getRecruiterId());
                if (recruiterRepository != null) {
                    List<Recruiter> companyRecs = recruiterRepository.findAllByCompany_CompanyId(company.getCompanyId());
                    for (Recruiter r : companyRecs) {
                        if (r.getRecruiterId() != null) targetRecruiterIds.add(r.getRecruiterId());
                    }
                }
                for (Long rId : targetRecruiterIds) {
                    try {
                        notificationService.createNotification(
                                rId,
                                NotificationType.SYSTEM_ALERT,
                                "Hồ sơ Doanh nghiệp bị tạm ngưng / từ chối phê duyệt",
                                "Ban Quản Trị đã chuyển trạng thái công ty " + company.getCompanyName() + " sang " + status + ". Lý do: " + (notes != null ? notes : "Thông tin chưa đạt yêu cầu pháp lý") + ". Toàn bộ tin tuyển dụng đang đăng đã được tự động tạm đóng.",
                                company.getCompanyId(),
                                "companies"
                        );
                    } catch (Exception e) {
                        log.warn("Không thể gửi thông báo từ chối DN tới recruiter {}: {}", rId, e.getMessage());
                    }
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
        } else if (recruiterRepository != null) {
            List<Recruiter> recs = recruiterRepository.findAllByCompany_CompanyId(company.getCompanyId());
            if (!recs.isEmpty()) {
                Recruiter firstRec = recs.get(0);
                User u = firstRec.getUser();
                if (u != null) {
                    recruiterName = u.getFullName();
                    recruiterEmail = u.getEmail();
                    recruiterPhone = u.getPhone();
                }
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
        boolean hasDoc = CompanyServiceImpl.isValidLicenseDocUrl(company.getLicenseDocUrl());
        resp.setHasLicenseDoc(hasDoc);
        if (hasDoc) {
            resp.setDocUrl(company.getLicenseDocUrl());
            resp.setDocName(resolveDocName(company.getLicenseDocName(), company.getLicenseDocUrl()));
        } else {
            resp.setDocUrl(null);
            resp.setDocName(null);
        }
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

        // Tránh kích hoạt lặp lại nếu đơn đã được duyệt trước đó
        if (order.getStatus() == PaymentOrderStatus.APPROVED) {
            log.info(">> [AdminService] Đơn hàng ID {} đã được duyệt trước đó, bỏ qua kích hoạt lặp lại.", orderId);
            return mapToPaymentOrderResponse(order);
        }

        if (order.getStatus() == PaymentOrderStatus.REFUNDED) {
            throw new BadRequestException("Đơn hàng này đã được hoàn tiền trước đó, không thể phê duyệt lại!");
        }
        if (order.getStatus() == PaymentOrderStatus.REJECTED) {
            throw new BadRequestException("Đơn hàng này đã bị từ chối trước đó, không thể phê duyệt!");
        }

        order.setStatus(PaymentOrderStatus.APPROVED);
        order.setApprovedAt(LocalDateTime.now());
        if (adminNote != null && !adminNote.isBlank()) {
            if (order.getAdminNote() != null && order.getAdminNote().contains("YEARLY") && !adminNote.contains("YEARLY")) {
                order.setAdminNote(order.getAdminNote() + " | " + adminNote);
            } else {
                order.setAdminNote(adminNote);
            }
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

        // Kích hoạt hoặc gia hạn Subscription / Add-on
        boolean isAddonOrder = (order.getPlan() == null && order.getAdminNote() != null && order.getAdminNote().contains("ADDON"))
                || (order.getAdminNote() != null && order.getAdminNote().contains("AI_CREDITS"))
                || (plan != null && plan.getPlanName() != null && plan.getPlanName().toUpperCase().contains("ADDON"));

        if (isAddonOrder && order.getUser() != null) {
            // Đơn hàng Add-on: TUYỆT ĐỐI KHÔNG làm hết hạn gói subscription chính hiện tại của khách hàng!
            Subscription activeSub = subscriptionRepository
                    .findFirstByUser_UserIdAndStatusOrderByCreatedAtDesc(order.getUser().getUserId(), SubscriptionStatus.ACTIVE)
                    .orElse(null);

            int addedCredits = 100;
            if (order.getAdminNote() != null && order.getAdminNote().contains("500")) {
                addedCredits = 500;
            } else if (order.getAdminNote() != null && order.getAdminNote().contains("100")) {
                addedCredits = 100;
            } else if (plan != null && plan.getQuotaLimit() != null && plan.getQuotaLimit() > 0) {
                addedCredits = plan.getQuotaLimit();
            }

            // Lưu số dư Credits AI trực tiếp vào CSDL Recruiter
            if (recruiterRepository != null) {
                var recOpt = recruiterRepository.findById(order.getUser().getUserId());
                if (recOpt.isPresent()) {
                    var rec = recOpt.get();
                    int cur = rec.getAiCredits() != null ? rec.getAiCredits() : 0;
                    rec.setAiCredits(cur + addedCredits);
                    recruiterRepository.save(rec);
                    log.info(">> [AdminService] Đã cộng {} AI credits vào tài khoản Recruiter ID #{} (tổng: {})",
                            addedCredits, rec.getRecruiterId(), rec.getAiCredits());
                }
            }

            if (activeSub != null) {
                int curCredits = activeSub.getRemainingAiTests() != null ? activeSub.getRemainingAiTests() : 0;
                activeSub.setRemainingAiTests(curCredits + addedCredits);
                subscriptionRepository.save(activeSub);
                log.info(">> [AdminService] Duyệt đơn Add-on {} ({} credits) an toàn cho User {} mà không làm gián đoạn gói chính.",
                        order.getOrderCode(), addedCredits, order.getUser().getEmail());
            } else {
                String targetRole = (order.getUser().getRole() != null) ? order.getUser().getRole().name() : "RECRUITER";
                SubscriptionPlan basicPlan = subscriptionPlanRepository.findByTargetRoleAndIsActiveTrueOrderByPriceAsc(targetRole).stream()
                        .findFirst().orElse(null);
                if (basicPlan != null) {
                    Subscription newSub = Subscription.builder()
                            .user(order.getUser())
                            .plan(basicPlan)
                            .order(order)
                            .startDate(LocalDateTime.now())
                            .endDate(LocalDateTime.now().plusDays(365))
                            .status(SubscriptionStatus.ACTIVE)
                            .customQuota(basicPlan.getQuotaLimit() != null ? basicPlan.getQuotaLimit() : 3)
                            .remainingJobPosts(basicPlan.getQuotaLimit() != null ? basicPlan.getQuotaLimit() : 3)
                            .remainingAiTests(basicPlan.getQuotaLimit() != null ? basicPlan.getQuotaLimit() : 3)
                            .build();
                    subscriptionRepository.save(newSub);
                }
            }
        } else if (order.getUser() != null && plan != null) {
            int durationDays = (plan.getDurationDays() != null && plan.getDurationDays() > 0) ? plan.getDurationDays() : 30;
            if (order.getAdminNote() != null && order.getAdminNote().contains("YEARLY")) {
                durationDays = 365;
            }

            // Hết hạn các gói cũ đang active của người dùng
            List<Subscription> oldSubs = subscriptionRepository.findByUser_UserIdAndStatus(order.getUser().getUserId(), SubscriptionStatus.ACTIVE);
            for (Subscription oldSub : oldSubs) {
                oldSub.setStatus(SubscriptionStatus.EXPIRED);
                subscriptionRepository.save(oldSub);
            }

            int defaultQuota = (plan.getQuotaLimit() != null && plan.getQuotaLimit() > 0) ? plan.getQuotaLimit() : 3;
            Subscription subscription = Subscription.builder()
                    .user(order.getUser())
                    .plan(plan)
                    .order(order)
                    .startDate(LocalDateTime.now())
                    .endDate(LocalDateTime.now().plusDays(durationDays))
                    .status(SubscriptionStatus.ACTIVE)
                    .customQuota(defaultQuota)
                    .remainingJobPosts(defaultQuota)
                    .remainingAiTests(defaultQuota)
                    .build();

            subscriptionRepository.save(subscription);
            log.info(">> [AdminService] Kích hoạt subscription cho user: {}, gói: {} (Hạn dùng: {} ngày, Quota: {})",
                    order.getUser().getEmail(), plan.getPlanName(), durationDays, defaultQuota);
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

        if (order.getStatus() != PaymentOrderStatus.PENDING) {
            throw new BadRequestException("Chỉ có thể từ chối đơn hàng đang ở trạng thái Chờ xử lý (PENDING). Đơn hàng hiện tại đang là " + order.getStatus() + ". Nếu muốn hủy đơn đã duyệt, vui lòng sử dụng tính năng Hoàn tiền (Refund)!");
        }

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
    @Transactional
    public Map<String, Object> refundOrder(Long orderId) {
        PaymentOrder order = paymentOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng ID: " + orderId));

        if (order.getStatus() != PaymentOrderStatus.APPROVED) {
            throw new IllegalArgumentException("Chỉ có thể hoàn tiền đơn hàng đã được phê duyệt (APPROVED). Trạng thái hiện tại: " + order.getStatus());
        }

        order.setStatus(PaymentOrderStatus.REFUNDED);
        boolean isAddonOrder = (order.getPlan() == null && order.getAdminNote() != null && order.getAdminNote().contains("ADDON"))
                || (order.getAdminNote() != null && order.getAdminNote().contains("AI_CREDITS"))
                || (order.getPlan() != null && order.getPlan().getPlanName() != null && order.getPlan().getPlanName().toUpperCase().contains("ADDON"));
        if (isAddonOrder && order.getUser() != null) {
            int addedCredits = 100;
            if (order.getAdminNote() != null && order.getAdminNote().contains("500")) addedCredits = 500;
            else if (order.getAdminNote() != null && order.getAdminNote().contains("100")) addedCredits = 100;
            else if (order.getPlan() != null && order.getPlan().getQuotaLimit() != null && order.getPlan().getQuotaLimit() > 0) addedCredits = order.getPlan().getQuotaLimit();
            if (recruiterRepository != null) {
                var recOpt = recruiterRepository.findById(order.getUser().getUserId());
                if (recOpt.isPresent()) {
                    var rec = recOpt.get();
                    int cur = rec.getAiCredits() != null ? rec.getAiCredits() : 0;
                    rec.setAiCredits(Math.max(0, cur - addedCredits));
                    recruiterRepository.save(rec);
                    log.info(">> [AdminService] Hoan tien don Add-on: Da thu hoi {} AI credits tu Recruiter #{}", addedCredits, rec.getRecruiterId());
                }
            }
        }
        paymentOrderRepository.save(order);

        // Thu hồi quyền lợi gói cước: Hủy subscription ACTIVE tương ứng của user
        if (order.getUser() != null) {
            List<Subscription> activeSubs = subscriptionRepository.findByUser_UserIdAndStatus(order.getUser().getUserId(), SubscriptionStatus.ACTIVE);
            for (Subscription sub : activeSubs) {
                if (order.getPlan() != null && sub.getPlan() != null && sub.getPlan().getPlanId().equals(order.getPlan().getPlanId())) {
                    sub.setStatus(SubscriptionStatus.EXPIRED);
                    sub.setEndDate(LocalDateTime.now());
                    subscriptionRepository.save(sub);
                    log.info(">> [AdminService] Đã thu hồi subscription ID {} của user {} do hoàn tiền đơn hàng {}",
                            sub.getSubscriptionId(), order.getUser().getEmail(), order.getOrderId());
                }
            }

            // Gửi thông báo đến user
            if (notificationService != null) {
                try {
                    String orderDisplay = order.getOrderCode() != null ? order.getOrderCode() : ("#ORD-" + order.getOrderId());
                    notificationService.createNotification(
                            order.getUser().getUserId(),
                            NotificationType.SYSTEM_ALERT,
                            "Đơn hàng đã được hoàn tiền & thu hồi gói cước",
                            "Đơn hàng " + orderDisplay + " đã được Ban Quản Trị hoàn tiền thành công. Quyền lợi gói dịch vụ liên quan đã được thu hồi.",
                            order.getOrderId(),
                            "payment_orders"
                    );
                } catch (Exception ex) {
                    log.warn("Không thể gửi thông báo hoàn tiền đơn hàng: {}", ex.getMessage());
                }
            }
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("orderId", order.getOrderId());
        resp.put("orderCode", order.getOrderCode());
        resp.put("status", "REFUNDED");
        resp.put("message", "Đã hoàn tiền đơn hàng và thu hồi gói cước thành công.");
        return resp;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubscriptionPlan> getAllPlans() {
        return subscriptionPlanRepository.findAll();
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "subscriptionPlans", allEntries = true)
    public SubscriptionPlan savePlan(SubscriptionPlan plan) {
        return subscriptionPlanRepository.save(plan);
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "subscriptionPlans", allEntries = true)
    public SubscriptionPlan createPlan(SubscriptionPlan plan) {
        if (plan.getPlanName() == null || plan.getPlanName().isBlank()) {
            throw new IllegalArgumentException("Tên gói dịch vụ không được để trống.");
        }
        if (plan.getTargetRole() == null || plan.getTargetRole().isBlank()) {
            plan.setTargetRole("RECRUITER");
        } else {
            String roleUpper = plan.getTargetRole().trim().toUpperCase();
            if (!"RECRUITER".equals(roleUpper) && !"CANDIDATE".equals(roleUpper)) {
                throw new BadRequestException("Đối tượng áp dụng gói dịch vụ chỉ có thể là 'RECRUITER' hoặc 'CANDIDATE'!");
            }
            plan.setTargetRole(roleUpper);
        }
        if (plan.getPlanType() == null || plan.getPlanType().isBlank()) {
            plan.setPlanType("COMBO");
        }
        if (plan.getPrice() == null || plan.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            plan.setPrice(BigDecimal.ZERO);
        }
        if (plan.getDurationDays() == null || plan.getDurationDays() <= 0) {
            plan.setDurationDays(30);
        }
        if (plan.getQuotaLimit() == null || plan.getQuotaLimit() < 0) {
            plan.setQuotaLimit(plan.getTargetRole().equals("CANDIDATE") ? 5 : 10);
        }
        if (plan.getIsActive() == null) {
            plan.setIsActive(true);
        }
        SubscriptionPlan saved = subscriptionPlanRepository.save(plan);
        log.info(">> [AdminService] Admin đã tạo mới gói dịch vụ ID #{}: {} (Role: {}, Giá: {} VNĐ, Quota: {})",
                saved.getPlanId(), saved.getPlanName(), saved.getTargetRole(), saved.getPrice(), saved.getQuotaLimit());
        return saved;
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "subscriptionPlans", allEntries = true)
    public SubscriptionPlan updatePlan(Long planId, SubscriptionPlan updated) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gói dịch vụ với ID: " + planId));

        if (updated.getPlanName() != null && !updated.getPlanName().isBlank()) {
            plan.setPlanName(updated.getPlanName().trim());
        }
        if (updated.getTargetRole() != null && !updated.getTargetRole().isBlank()) {
            String roleUpper = updated.getTargetRole().trim().toUpperCase();
            if (!"RECRUITER".equals(roleUpper) && !"CANDIDATE".equals(roleUpper)) {
                throw new BadRequestException("Đối tượng áp dụng gói dịch vụ chỉ có thể là 'RECRUITER' hoặc 'CANDIDATE'!");
            }
            plan.setTargetRole(roleUpper);
        }
        if (updated.getPlanType() != null && !updated.getPlanType().isBlank()) {
            plan.setPlanType(updated.getPlanType().trim().toUpperCase());
        }
        if (updated.getPrice() != null && updated.getPrice().compareTo(BigDecimal.ZERO) >= 0) {
            plan.setPrice(updated.getPrice());
        }
        if (updated.getDurationDays() != null && updated.getDurationDays() > 0) {
            plan.setDurationDays(updated.getDurationDays());
        }
        if (updated.getQuotaLimit() != null && updated.getQuotaLimit() >= 0) {
            plan.setQuotaLimit(updated.getQuotaLimit());
        }
        if (updated.getDescription() != null) {
            plan.setDescription(updated.getDescription());
        }
        if (updated.getIsActive() != null) {
            plan.setIsActive(updated.getIsActive());
        }

        SubscriptionPlan saved = subscriptionPlanRepository.save(plan);
        log.info(">> [AdminService] Admin đã cập nhật gói dịch vụ ID #{}: {}", saved.getPlanId(), saved.getPlanName());
        return saved;
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "subscriptionPlans", allEntries = true)
    public void deletePlan(Long planId) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gói dịch vụ với ID: " + planId));
        
        boolean hasOrders = paymentOrderRepository.existsByPlan_PlanId(planId);
        boolean hasSubs = subscriptionRepository.existsByPlan_PlanId(planId);

        if (!hasOrders && !hasSubs) {
            subscriptionPlanRepository.delete(plan);
            log.info(">> [AdminService] Gói dịch vụ ID #{} chưa có phát sinh giao dịch, đã xóa vĩnh viễn khỏi hệ thống.", planId);
        } else {
            // Đã có dữ liệu lịch sử phát sinh -> chuyển sang lưu trữ ẩn (Soft Archive)
            plan.setIsActive(false);
            subscriptionPlanRepository.save(plan);
            log.info(">> [AdminService] Gói dịch vụ ID #{} đã có lịch sử đơn hàng/đăng ký. Hệ thống đã tự động chuyển sang trạng thái Tạm ẩn (Lưu trữ).", planId);
        }
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "subscriptionPlans", allEntries = true)
    public SubscriptionPlan togglePlanStatus(Long planId) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gói dịch vụ với ID: " + planId));
        plan.setIsActive(!Boolean.TRUE.equals(plan.getIsActive()));
        SubscriptionPlan saved = subscriptionPlanRepository.save(plan);
        log.info(">> [AdminService] Admin đã chuyển trạng thái gói dịch vụ ID #{} sang: {}", planId, saved.getIsActive());
        return saved;
    }

    @Override
    @Transactional
    public AdminUserResponse assignUserTier(Long userId, Long planId, Integer customDurationDays) {
        return assignUserTier(userId, planId, customDurationDays, null);
    }

    @Override
    @Transactional
    public AdminUserResponse assignUserTier(Long userId, Long planId, Integer customDurationDays, Integer customQuota) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng ID: " + userId));

        SubscriptionPlan plan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gói dịch vụ ID: " + planId));

        // Kiểm tra tính tương thích giữa vai trò người dùng và gói dịch vụ
        String userRole = user.getRole() != null ? user.getRole().name() : "";
        String planTarget = plan.getTargetRole() != null ? plan.getTargetRole().trim().toUpperCase() : "";
        if (!planTarget.isBlank() && !userRole.isBlank() && !planTarget.equalsIgnoreCase(userRole)) {
            throw new IllegalArgumentException(String.format(
                    "Không thể gán gói cước '%s' (dành cho %s) cho tài khoản mang vai trò %s!",
                    plan.getPlanName(), planTarget, userRole));
        }

        int duration = (customDurationDays != null && customDurationDays > 0)
                ? customDurationDays
                : (plan.getDurationDays() != null && plan.getDurationDays() > 0 ? plan.getDurationDays() : 30);

        // Hủy các subscription ACTIVE cũ của user
        List<Subscription> currentSubs = subscriptionRepository.findByUser_UserIdAndStatus(userId, SubscriptionStatus.ACTIVE);
        for (Subscription s : currentSubs) {
            s.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(s);
        }

        int effectiveQuota = (customQuota != null && customQuota > 0)
                ? customQuota
                : (plan.getQuotaLimit() != null ? plan.getQuotaLimit() : 0);

        Subscription newSub = Subscription.builder()
                .user(user)
                .plan(plan)
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(duration))
                .status(SubscriptionStatus.ACTIVE)
                .remainingAiTests(effectiveQuota)
                .remainingJobPosts(effectiveQuota)
                .customQuota(effectiveQuota)
                .build();

        subscriptionRepository.save(newSub);

        log.info(">> [AdminService] Admin đã gán trực tiếp hạng mức '{}' cho user {} ({}) trong {} ngày, customQuota={}.",
                plan.getPlanName(), user.getEmail(), user.getUserId(), duration, customQuota);

        if (user.getRole() == UserRole.RECRUITER && recruiterRepository != null) {
            var recOpt = recruiterRepository.findById(user.getUserId());
            if (recOpt.isPresent()) {
                var rec = recOpt.get();
                int curCredits = rec.getAiCredits() != null ? rec.getAiCredits() : 0;
                rec.setAiCredits(curCredits + effectiveQuota);
                recruiterRepository.save(rec);
                log.info(">> [AdminService] Da cong {} AI credits vao bang Recruiter ID #{} khi Admin gan Tier", effectiveQuota, rec.getRecruiterId());
            }
        }

        if (userCacheService != null) {
            userCacheService.evict(user.getEmail(), user.getUserId());
        }

        // Gửi thông báo đến user
        if (notificationService != null) {
            try {
                notificationService.createNotification(
                        user.getUserId(),
                        NotificationType.SYSTEM_ALERT,
                        "Hạng mức tài khoản đã được nâng cấp!",
                        "Ban Quản Trị đã kích hoạt đặc quyền gói \"" + plan.getPlanName() + "\" (Thời hạn " + duration + " ngày) cho tài khoản của bạn.",
                        plan.getPlanId(),
                        "subscription_plans"
                );
            } catch (Exception ex) {
                log.warn("Không thể gửi thông báo gán tier: {}", ex.getMessage());
            }
        }

        String companyName = null;
        if (user.getRole() == UserRole.RECRUITER) {
            companyName = companyRepository.findByRecruiterId(user.getUserId())
                    .map(Company::getCompanyName)
                    .orElse(null);
            if (companyName == null && recruiterRepository != null) {
                companyName = recruiterRepository.findById(user.getUserId())
                        .map(r -> r.getCompany() != null ? r.getCompany().getCompanyName() : null)
                        .orElse(null);
            }
        }
        String authProvider = (user.getPasswordHash() != null && user.getPasswordHash().contains("GoogleOAuth2_")) ? "GOOGLE" : "LOCAL";

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
        resp.setLastActiveAt(LocalDateTime.now());
        resp.setCurrentTier(plan.getPlanName());
        resp.setCurrentPlanId(plan.getPlanId());
        resp.setSubscriptionStatus("ACTIVE");
        resp.setSubscriptionEndDate(newSub.getEndDate());
        resp.setQuotaLimit((customQuota != null && customQuota > 0) ? customQuota : plan.getQuotaLimit());
        return resp;
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobResponse> getAllJobs() {
        return jobService.getAllJobsForAdmin();
    }

    @Override
    @Transactional
    public JobResponse updateJobApproval(Long jobId, JobApprovalStatus status) {
        return updateJobApproval(jobId, status, null);
    }

    @Override
    @Transactional
    public JobResponse updateJobApproval(Long jobId, JobApprovalStatus status, String reason) {
        return jobService.updateJobApproval(jobId, status, reason);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Voucher> getAllVouchers() {
        List<Voucher> list = voucherRepository.findAllByOrderByCreatedAtDesc();
        if (systemSettingsService != null && systemSettingsService.getSettings() != null) {
            Map<String, VoucherRuleMeta> rules = systemSettingsService.getSettings().getVoucherRules();
            if (rules != null) {
                for (Voucher v : list) {
                    if (v.getCode() != null) {
                        VoucherRuleMeta m = rules.get(v.getCode().trim().toUpperCase());
                        if (m != null) {
                            v.setTargetRole(m.getTargetRole());
                            v.setMinOrderAmount(m.getMinOrderAmount());
                            v.setApplicableScope(m.getApplicableScope());
                            v.setApplicablePlanIds(m.getApplicablePlanIds());
                            v.setDescription(m.getDescription());
                        }
                    }
                }
            }
        }
        return list;
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
        if (voucher.getDiscountPercent() == null || voucher.getDiscountPercent() <= 0 || voucher.getDiscountPercent() > 100) {
            throw new BadRequestException("Tỷ lệ giảm giá của voucher phải từ 1% đến 100%!");
        }
        if (voucher.getUsageLimit() != null && voucher.getUsageLimit() <= 0) {
            throw new BadRequestException("Giới hạn lượt dùng của voucher phải lớn hơn 0!");
        }
        if (voucher.getValidFrom() == null) {
            voucher.setValidFrom(LocalDateTime.now());
        }
        if (voucher.getValidTo() == null) {
            voucher.setValidTo(LocalDateTime.now().plusDays(30));
        }
        if (voucher.getValidTo().isBefore(voucher.getValidFrom())) {
            throw new BadRequestException("Ngày hết hạn của voucher không được trước ngày bắt đầu có hiệu lực!");
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
        String cleanCode = voucher.getCode() != null ? voucher.getCode().trim().toUpperCase() : "VOUCHER";
        voucher.setCode(cleanCode);

        // Lưu quy tắc mở rộng VoucherRuleMeta vào SystemSettingsService bền vững
        if (systemSettingsService != null) {
            AdminSettingsDTO settings = systemSettingsService.getSettings();
            if (settings == null) settings = AdminSettingsDTO.builder().build();
            if (settings.getVoucherRules() == null) settings.setVoucherRules(new HashMap<>());

            VoucherRuleMeta meta = settings.getVoucherRules().getOrDefault(cleanCode, new VoucherRuleMeta());
            if (voucher.getTargetRole() != null) meta.setTargetRole(voucher.getTargetRole());
            if (voucher.getMinOrderAmount() != null) meta.setMinOrderAmount(voucher.getMinOrderAmount());
            if (voucher.getApplicableScope() != null) meta.setApplicableScope(voucher.getApplicableScope());
            if (voucher.getApplicablePlanIds() != null) meta.setApplicablePlanIds(voucher.getApplicablePlanIds());
            if (voucher.getDescription() != null) meta.setDescription(voucher.getDescription());

            settings.getVoucherRules().put(cleanCode, meta);
            systemSettingsService.updateSettings(settings);
            log.info(">> [AdminService] Đã lưu VoucherRuleMeta bền vững cho voucher: {}", cleanCode);
        }

        Voucher saved = voucherRepository.save(voucher);

        // Gắn lại các trường @Transient để trả về trọn vẹn cho Frontend
        if (systemSettingsService != null && systemSettingsService.getSettings() != null) {
            Map<String, VoucherRuleMeta> rules = systemSettingsService.getSettings().getVoucherRules();
            if (rules != null) {
                VoucherRuleMeta m = rules.get(cleanCode);
                if (m != null) {
                    saved.setTargetRole(m.getTargetRole());
                    saved.setMinOrderAmount(m.getMinOrderAmount());
                    saved.setApplicableScope(m.getApplicableScope());
                    saved.setApplicablePlanIds(m.getApplicablePlanIds());
                    saved.setDescription(m.getDescription());
                }
            }
        }
        return saved;
    }

    @Override
    @Transactional
    public void deleteVoucher(Long voucherId) {
        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy voucher ID: " + voucherId));
        if (systemSettingsService != null && voucher.getCode() != null) {
            AdminSettingsDTO settings = systemSettingsService.getSettings();
            if (settings != null && settings.getVoucherRules() != null) {
                settings.getVoucherRules().remove(voucher.getCode().toUpperCase().trim());
                systemSettingsService.updateSettings(settings);
            }
        }

        boolean hasOrders = paymentOrderRepository.existsByVoucher_VoucherId(voucherId) || (voucher.getUsedCount() != null && voucher.getUsedCount() > 0);
        if (!hasOrders) {
            voucherRepository.delete(voucher);
            log.info(">> [AdminService] Voucher ID #{} ({}) chưa từng được áp dụng, đã xóa vĩnh viễn khỏi CSDL.", voucherId, voucher.getCode());
        } else {
            voucher.setIsActive(false);
            voucherRepository.save(voucher);
            log.info(">> [AdminService] Voucher ID #{} ({}) đã có dữ liệu đơn hàng liên kết. Hệ thống chuyển sang trạng thái Vô hiệu hóa (Soft Delete) an toàn.", voucherId, voucher.getCode());
        }
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
        List<InterviewSession> sessions = interviewSessionRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "startedAt"));
        if (sessions.isEmpty()) {
            return Collections.emptyList();
        }

        // Batch count question details in 1 single query (loại bỏ N+1 queries)
        List<Long> sessionIds = sessions.stream().map(InterviewSession::getSessionId).filter(java.util.Objects::nonNull).toList();
        Map<Long, Long> countsMap = new HashMap<>();
        if (!sessionIds.isEmpty()) {
            try {
                List<Object[]> rows = interviewDetailRepository.countDetailsBySessionIds(sessionIds);
                for (Object[] row : rows) {
                    if (row != null && row.length >= 2 && row[0] instanceof Long sId && row[1] instanceof Number cnt) {
                        countsMap.put(sId, cnt.longValue());
                    }
                }
            } catch (Exception e) {
                log.warn("Batch count interview details error: {}", e.getMessage());
            }
        }

        List<InterviewSummaryResponse> result = new ArrayList<>(sessions.size());
        for (InterviewSession s : sessions) {
            result.add(mapToInterviewSummary(s, countsMap.getOrDefault(s.getSessionId(), 0L)));
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public InterviewSummaryResponse getInterviewSessionDetail(Long sessionId) {
        InterviewSession s = interviewSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiên phỏng vấn #" + sessionId));
        return mapToInterviewSummaryWithDetails(s);
    }

    private InterviewSummaryResponse mapToInterviewSummary(InterviewSession s) {
        long qCount = interviewDetailRepository.countBySession_SessionId(s.getSessionId());
        return mapToInterviewSummary(s, qCount);
    }

    private InterviewSummaryResponse mapToInterviewSummary(InterviewSession s, long qCount) {
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
            // Tìm xem ứng viên đã có CV nào trong CSDL chưa
            cv = cvRepository.findByCandidateId(cid).stream().findFirst().orElse(null);
            if (cv == null) {
                // Khởi tạo và lưu một bản CV mô phỏng hợp lệ vào CSDL để thỏa mãn ràng buộc khóa ngoại fk_ai_job_matches_cv
                String candName = candidate.getUser() != null ? candidate.getUser().getFullName() : "Ứng viên";
                String title = job.getTitle() != null ? job.getTitle() : "Software Engineer";
                cv = Cv.builder()
                        .candidateId(cid)
                        .fileName("CV_Demo_" + candName.replaceAll("\\s+", "_") + ".pdf")
                        .fileUrl("https://hiremate.vn/assets/demo-cv.pdf")
                        .isDefault(true)
                        .summary("Kỹ sư phần mềm tài năng với định hướng chuyên sâu " + title + ", thành thạo các kiến trúc dịch vụ hiện đại và quy trình phát triển Agile/Scrum.")
                        .parsedText("Họ tên: " + candName + ". Vị trí mục tiêu: " + title + ". Kỹ năng chuyên môn chính: Java, Spring Boot, SQL, PostgreSQL, RESTful API, Docker, Git, Cấu trúc dữ liệu & Thuật toán, React.js, JavaScript, TypeScript, Manual Testing, Postman API, Microservices.")
                        .build();
                cv = cvRepository.save(cv);
                log.info(">> [AdminService] Đã lưu CV mô phỏng ID #{} cho candidate ID #{} để so khớp AI an toàn.", cv.getCvId(), cid);
            }
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
