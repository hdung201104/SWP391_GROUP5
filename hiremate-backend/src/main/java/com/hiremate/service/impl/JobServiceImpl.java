package com.hiremate.service.impl;

import com.hiremate.exception.BadRequestException;

import com.hiremate.dto.request.JobCreateRequest;
import com.hiremate.dto.response.JobResponse;
import com.hiremate.entity.Company;
import com.hiremate.entity.Job;
import com.hiremate.entity.JobSkill;
import com.hiremate.entity.Recruiter;
import com.hiremate.entity.Skill;
import com.hiremate.entity.User;
import com.hiremate.enums.CompanyStatus;
import com.hiremate.enums.JobApprovalStatus;
import com.hiremate.enums.JobStatus;
import com.hiremate.enums.SkillImportance;
import com.hiremate.repository.JobRepository;
import com.hiremate.repository.JobSkillRepository;
import com.hiremate.repository.RecruiterRepository;
import com.hiremate.repository.SkillRepository;
import com.hiremate.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hiremate.dto.response.PageResponse;
import com.hiremate.repository.ApplicationRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@lombok.extern.slf4j.Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JobServiceImpl implements JobService {

    private final JobRepository jobRepository;
    private final JobSkillRepository jobSkillRepository;
    private final SkillRepository skillRepository;
    private final RecruiterRepository recruiterRepository;
    private final ApplicationRepository applicationRepository;
    private final com.hiremate.service.NotificationService notificationService;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hiremate.repository.UserRepository userRepository;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hiremate.repository.CompanyRepository companyRepository;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hiremate.repository.AiJobMatchRepository aiJobMatchRepository;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hiremate.repository.InterviewSessionRepository interviewSessionRepository;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hiremate.repository.RecruitmentPipelineLogRepository recruitmentPipelineLogRepository;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hiremate.repository.SubscriptionRepository subscriptionRepository;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hiremate.service.GeminiAiService geminiAiService;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hiremate.service.SystemSettingsService systemSettingsService;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.context.annotation.Lazy
    private com.hiremate.service.SkillService skillService;

    private final java.util.Map<Long, String> skillNameCache = new java.util.concurrent.ConcurrentHashMap<>();

    @jakarta.annotation.PostConstruct
    public void preloadSkillCache() {
        try {
            skillRepository.findAll().forEach(s -> {
                if (s.getSkillId() != null && s.getSkillName() != null) {
                    skillNameCache.put(s.getSkillId(), s.getSkillName());
                }
            });
            log.info(">> [JobService] Preloaded {} skills into in-memory cache for ultra-fast response.", skillNameCache.size());
        } catch (Exception e) {
            log.warn(">> [JobService] Could not preload skill cache: {}", e.getMessage());
        }
    }

    private boolean isAuthorizedRecruiterForJob(Job job, User user) {
        if (user == null || job == null) return false;
        if (user.getRole() == com.hiremate.enums.UserRole.ADMIN) {
            return true;
        }
        // 1. Chính người tạo bài đăng
        if (job.getRecruiter() != null && job.getRecruiter().getRecruiterId().equals(user.getUserId())) {
            return true;
        }
        // 2. HR cùng công ty (Cho phép các thành viên HR trong cùng doanh nghiệp cùng xem và phối hợp tuyển dụng)
        if (user.getRole() == com.hiremate.enums.UserRole.RECRUITER && job.getCompany() != null && job.getCompany().getCompanyId() != null) {
            Recruiter currentRecruiter = recruiterRepository.findById(user.getUserId()).orElse(null);
            if (currentRecruiter != null && currentRecruiter.getCompany() != null
                    && currentRecruiter.getCompany().getCompanyId().equals(job.getCompany().getCompanyId())) {
                return true;
            }
        }
        return false;
    }

    private void validateJobRequest(JobCreateRequest request) {
        if (request == null) return;
        if (request.getVacanciesCount() != null && request.getVacanciesCount() < 1) {
            throw new IllegalArgumentException("Số lượng tuyển dụng phải từ 1 người trở lên (không được âm hoặc bằng 0).");
        }
        if (request.getSalaryMin() != null && request.getSalaryMin().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Mức lương tối thiểu không được là số âm.");
        }
        if (request.getSalaryMax() != null && request.getSalaryMax().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Mức lương tối đa không được là số âm.");
        }
        if (request.getSalaryMin() != null && request.getSalaryMax() != null
                && request.getSalaryMax().compareTo(request.getSalaryMin()) < 0) {
            throw new IllegalArgumentException("Mức lương tối đa không được nhỏ hơn mức lương tối thiểu.");
        }
        if (request.getDeadlineDate() != null && request.getDeadlineDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Hạn chót nộp hồ sơ không được là ngày trong quá khứ (phải từ ngày hiện tại trở đi).");
        }
    }

    private String inferIndustryFromJobText(String title, String desc, String req) {
        String full = ((title != null ? title : "") + " " + (desc != null ? desc : "") + " " + (req != null ? req : "")).toLowerCase();
        if (full.contains("marketing") || full.contains("seo") || full.contains("ads") || full.contains("content") || full.contains("truyền thông")) {
            return "MARKETING_SALES";
        }
        if (full.contains("sales") || full.contains("kinh doanh") || full.contains("bán hàng") || full.contains("chốt deal") || full.contains("telesales")) {
            return "MARKETING_SALES";
        }
        if (full.contains("kế toán") || full.contains("kiểm toán") || full.contains("thuế") || full.contains("tài chính") || full.contains("bctc") || full.contains("misa")) {
            return "FINANCE_ACCOUNTING";
        }
        if (full.contains("nhân sự") || full.contains("tuyển dụng") || full.contains("c&b") || full.contains("tiền lương") || full.contains("bhxh") || full.contains("hành chính")) {
            return "HR_ADMIN";
        }
        if (full.contains("thiết kế") || full.contains("design") || full.contains("photoshop") || full.contains("figma") || full.contains("đồ họa") || full.contains("video")) {
            return "DESIGN_CREATIVE";
        }
        if (full.contains("xây dựng") || full.contains("kiến trúc") || full.contains("cơ khí") || full.contains("chế tạo") || full.contains("autocad") || full.contains("cnc") || full.contains("plc") || full.contains("sản xuất") || full.contains("điện")) {
            return "ENGINEERING_MANUFACTURING";
        }
        if (full.contains("logistics") || full.contains("xuất nhập khẩu") || full.contains("xnk") || full.contains("hải quan") || full.contains("kho vận") || full.contains("kho bãi") || full.contains("vận tải")) {
            return "ENGINEERING_MANUFACTURING";
        }
        if (full.contains("cskh") || full.contains("chăm sóc khách hàng") || full.contains("tổng đài") || full.contains("call center") || full.contains("khiếu nại")) {
            return "CUSTOMER_SERVICE";
        }
        if (full.contains("giảng dạy") || full.contains("sư phạm") || full.contains("đào tạo") || full.contains("giáo viên") || full.contains("giáo án")) {
            return "EDUCATION_TRAINING";
        }
        if (full.contains("dược") || full.contains("y tế") || full.contains("bác sĩ") || full.contains("điều dưỡng") || full.contains("y khoa") || full.contains("nhà thuốc")) {
            return "HEALTHCARE_PHARMA";
        }
        if (full.contains("developer") || full.contains("lập trình") || full.contains("phần mềm") || full.contains("software") || full.contains("backend") || full.contains("frontend") || full.contains("java") || full.contains("python") || full.contains("react")) {
            return "IT_SOFTWARE";
        }
        return "BUSINESS_MANAGEMENT";
    }

    private Long resolveOrCreateSkillId(String rawName) {
        return resolveOrCreateSkillId(rawName, null);
    }

    private Long resolveOrCreateSkillId(String rawName, String suggestedCategory) {
        if (rawName == null || rawName.trim().isEmpty()) return null;
        String name = rawName.trim();
        if (skillService != null) {
            try {
                Skill skill = skillService.findOrCreateNormalizedSkill(name, suggestedCategory, null);
                if (skill != null && skill.getSkillId() != null) {
                    skillNameCache.put(skill.getSkillId(), skill.getSkillName());
                    return skill.getSkillId();
                }
            } catch (Exception e) {
                log.warn(">> [JobService] findOrCreateNormalizedSkill failed for '{}': {}", name, e.getMessage());
            }
        }
        return skillRepository.findBySkillNameIgnoreCase(name)
                .map(Skill::getSkillId)
                .orElseGet(() -> {
                    String cat = (suggestedCategory != null && !suggestedCategory.isBlank()) ? suggestedCategory : "BUSINESS_MANAGEMENT";
                    Skill saved = skillRepository.save(Skill.builder().skillName(name).category(cat).build());
                    skillNameCache.put(saved.getSkillId(), saved.getSkillName());
                    return saved.getSkillId();
                });
    }

    private void saveJobSkills(Long jobId, JobCreateRequest request) {
        if (jobId == null || request == null) return;

        String inferredDomain = request.getCategory();
        if (inferredDomain == null || inferredDomain.isBlank()) {
            inferredDomain = inferIndustryFromJobText(request.getTitle(), request.getDescription(), request.getRequirements());
        }

        // 1. Mandatory skills
        List<Long> mandIds = new ArrayList<>();
        if (request.getMandatorySkillIds() != null) {
            mandIds.addAll(request.getMandatorySkillIds());
        }
        if (request.getMandatorySkills() != null) {
            for (String skName : request.getMandatorySkills()) {
                Long id = resolveOrCreateSkillId(skName, inferredDomain);
                if (id != null && !mandIds.contains(id)) {
                    mandIds.add(id);
                }
            }
        }

        // 2. Preferred skills
        List<Long> prefIds = new ArrayList<>();
        if (request.getPreferredSkillIds() != null) {
            prefIds.addAll(request.getPreferredSkillIds());
        }
        if (request.getPreferredSkills() != null) {
            for (String skName : request.getPreferredSkills()) {
                Long id = resolveOrCreateSkillId(skName, inferredDomain);
                if (id != null && !mandIds.contains(id) && !prefIds.contains(id)) {
                    prefIds.add(id);
                }
            }
        }

        // Nếu Nhà tuyển dụng không nhập kỹ năng khi đăng bài, tự động trích xuất kỹ năng chuẩn từ nội dung JD
        if (mandIds.isEmpty() && skillService != null) {
            try {
                String fullJdText = String.join("\n",
                        request.getTitle() != null ? request.getTitle() : "",
                        request.getDescription() != null ? request.getDescription() : "",
                        request.getRequirements() != null ? request.getRequirements() : ""
                ).trim();

                if (!fullJdText.isEmpty()) {
                    com.hiremate.dto.request.AiJdSkillExtractRequest extractReq = com.hiremate.dto.request.AiJdSkillExtractRequest.builder()
                            .title(request.getTitle() != null ? request.getTitle() : "Vị trí Tuyển Dụng")
                            .description(fullJdText)
                            .industry(request.getCategory())
                            .build();
                    com.hiremate.dto.response.AiJdSkillExtractResponse extracted = skillService.extractSkillsFromJd(extractReq);
                    if (extracted != null) {
                        if (extracted.getMandatorySkills() != null) {
                            for (com.hiremate.dto.response.SkillItemDTO item : extracted.getMandatorySkills()) {
                                if (item.getSkillId() != null && !mandIds.contains(item.getSkillId())) {
                                    mandIds.add(item.getSkillId());
                                    if (item.getSkillName() != null) {
                                        skillNameCache.put(item.getSkillId(), item.getSkillName());
                                    }
                                }
                            }
                        }
                        if (extracted.getPreferredSkills() != null) {
                            for (com.hiremate.dto.response.SkillItemDTO item : extracted.getPreferredSkills()) {
                                if (item.getSkillId() != null && !mandIds.contains(item.getSkillId()) && !prefIds.contains(item.getSkillId())) {
                                    prefIds.add(item.getSkillId());
                                    if (item.getSkillName() != null) {
                                        skillNameCache.put(item.getSkillId(), item.getSkillName());
                                    }
                                }
                            }
                        }
                        log.info(">> [JobService] Tự động trích xuất & chuẩn hóa {} kỹ năng bắt buộc và {} kỹ năng ưu tiên cho Job ID {}",
                                mandIds.size(), prefIds.size(), jobId);
                    }
                }
            } catch (Exception e) {
                log.warn(">> [JobService] Không thể tự động trích xuất kỹ năng từ JD cho Job ID {}: {}", jobId, e.getMessage());
            }
        }

        for (Long skillId : mandIds) {
            jobSkillRepository.save(JobSkill.builder()
                    .jobId(jobId)
                    .skillId(skillId)
                    .importance(SkillImportance.MANDATORY)
                    .weight(1.0f)
                    .build());
        }

        for (Long skillId : prefIds) {
            jobSkillRepository.save(JobSkill.builder()
                    .jobId(jobId)
                    .skillId(skillId)
                    .importance(SkillImportance.PREFERRED)
                    .weight(0.5f)
                    .build());
        }
    }

    /**
     * Kiểm tra phân quyền và hạn ngạch gói dịch vụ thực tế của Nhà tuyển dụng.
     * - Admin: Không giới hạn hạn ngạch.
     * - Tài khoản đã mua gói (ACTIVE): Theo quotaLimit của gói (999 = không giới hạn).
     * - Tài khoản miễn phí (Chưa mua gói): Tối đa 2 tin tuyển dụng đang hoạt động cùng lúc.
     */
    private void checkRecruiterJobQuota(User user) {
        if (user == null) return;
        if (user.getRole() == com.hiremate.enums.UserRole.ADMIN) {
            return; // Admin có quyền tối cao bypass
        }

        Recruiter currentRecruiter = recruiterRepository.findById(user.getUserId()).orElse(null);
        Long companyId = (currentRecruiter != null && currentRecruiter.getCompany() != null)
                ? currentRecruiter.getCompany().getCompanyId()
                : (companyRepository != null ? companyRepository.findByRecruiterId(user.getUserId()).map(Company::getCompanyId).orElse(null) : null);

        // Chống spam / flooding cơ sở dữ liệu với tin DRAFT/PENDING
        long draftPendingJobs = (companyId != null)
                ? jobRepository.countPendingOrDraftJobsByCompanyId(companyId)
                : jobRepository.countPendingOrDraftJobsByRecruiterId(user.getUserId());
        int maxDraftPendingLimit = 20;
        if (draftPendingJobs >= maxDraftPendingLimit) {
            throw new BadRequestException(String.format(
                    "Tài khoản doanh nghiệp của bạn đang lưu %d tin ở trạng thái Nháp / Chờ duyệt (Giới hạn an toàn tối đa: %d tin). Vui lòng hoàn tất hoặc xóa bớt tin nháp cũ trước khi tạo tin mới.",
                    draftPendingJobs, maxDraftPendingLimit));
        }

        // Đếm tổng số tin đang hoạt động của cả doanh nghiệp để tránh thất thoát hạn ngạch dùng chung giữa các HR
        long activeJobs = (companyId != null)
                ? jobRepository.countActiveJobsByCompanyId(companyId)
                : jobRepository.countActiveJobsByRecruiterId(user.getUserId());

        com.hiremate.entity.Subscription activeSub = null;
        if (subscriptionRepository != null) {
            activeSub = subscriptionRepository.findFirstByUser_UserIdAndStatusOrderByCreatedAtDesc(
                    user.getUserId(), com.hiremate.enums.SubscriptionStatus.ACTIVE).orElse(null);
        }

        // Tự động kiểm tra hết hạn gói nếu có
        if (activeSub != null && activeSub.getEndDate() != null && activeSub.getEndDate().isBefore(java.time.LocalDateTime.now())) {
            activeSub.setStatus(com.hiremate.enums.SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(activeSub);
            activeSub = null;
        }

        // Nếu bản thân recruiter chưa có gói riêng, kiểm tra xem công ty / Head Recruiter có gói Enterprise / VIP đang kích hoạt không
        if (activeSub == null && subscriptionRepository != null) {
            Recruiter r = recruiterRepository.findById(user.getUserId()).orElse(null);
            if (r != null && r.getCompany() != null && r.getCompany().getRecruiterId() != null
                    && !r.getCompany().getRecruiterId().equals(user.getUserId())) {
                activeSub = subscriptionRepository.findFirstByUser_UserIdAndStatusOrderByCreatedAtDesc(
                        r.getCompany().getRecruiterId(), com.hiremate.enums.SubscriptionStatus.ACTIVE).orElse(null);
                if (activeSub != null && activeSub.getEndDate() != null && activeSub.getEndDate().isBefore(java.time.LocalDateTime.now())) {
                    activeSub = null;
                }
            }
        }

        if (activeSub != null) {
            int quota = (activeSub.getCustomQuota() != null && activeSub.getCustomQuota() > 0)
                    ? activeSub.getCustomQuota()
                    : ((activeSub.getPlan() != null && activeSub.getPlan().getQuotaLimit() != null)
                    ? activeSub.getPlan().getQuotaLimit() : 10);
            if (quota < 999 && activeJobs >= quota) {
                String planName = activeSub.getPlan() != null ? activeSub.getPlan().getPlanName() : "gói dịch vụ hiện tại";
                throw new IllegalArgumentException(String.format(
                        "Bạn đã sử dụng hết hạn ngạch (%d/%d tin) của gói \"%s\". Vui lòng nâng cấp gói Enterprise hoặc gia hạn để đăng thêm tin.",
                        activeJobs, quota, planName));
            }
        } else {
            // Tài khoản miễn phí (Free Tier): Đọc hạn ngạch từ Cấu hình Hệ thống (Mặc định 3 tin)
            int freeLimit = 3;
            if (systemSettingsService != null && systemSettingsService.getSettings() != null) {
                Integer limit = systemSettingsService.getSettings().getRecruiterFreeJobPostsPerMonth();
                if (limit != null && limit > 0) freeLimit = limit;
            }
            if (activeJobs >= freeLimit) {
                throw new IllegalArgumentException(String.format(
                        "Tài khoản Nhà tuyển dụng miễn phí chỉ được đăng tối đa %d tin tuyển dụng cùng lúc (Bạn hiện có %d tin đang hoạt động). Vui lòng nâng cấp gói dịch vụ để mở rộng hạn ngạch đăng tin.",
                        freeLimit, activeJobs));
            }
        }
    }

    @Override
    @Transactional
    public JobResponse createJob(JobCreateRequest request, User user) {
        validateJobRequest(request);

        // 1. Kiểm tra hạn ngạch phân quyền gói dịch vụ của Nhà tuyển dụng
        checkRecruiterJobQuota(user);

        // Lấy Recruiter subclass – recruiter_id = user_id (Shared PK)
        Recruiter recruiter = recruiterRepository.findById(user.getUserId())
                .orElseThrow(() -> new IllegalStateException(
                        "Recruiter profile not found for user: " + user.getUserId()));

        // Lấy company của recruiter qua Recruiter.company hoặc fallback qua recruiter_id
        Company company = recruiter.getCompany();
        if (company == null) {
            company = companyRepository.findByRecruiterId(user.getUserId()).orElse(null);
            if (company != null) {
                recruiter.setCompany(company);
                recruiterRepository.save(recruiter);
            }
        }

        // Đọc cấu hình kiểm duyệt & yêu cầu GPKD từ SystemSettingsService
        boolean requireGpkd = true;
        boolean moderateJobs = true;
        boolean autoPublishVerified = true;
        if (systemSettingsService != null && systemSettingsService.getSettings() != null) {
            com.hiremate.dto.response.AdminSettingsDTO settings = systemSettingsService.getSettings();
            if (settings.getRequireGpkdToPost() != null) requireGpkd = settings.getRequireGpkdToPost();
            if (settings.getModerateNewJobs() != null) moderateJobs = settings.getModerateNewJobs();
            if (settings.getAutoPublishVerified() != null) autoPublishVerified = settings.getAutoPublishVerified();
        }

        // 2. Kiểm tra xác thực Doanh nghiệp (Company Verification Guard)
        boolean isCompanyVerified = company != null && (company.getStatus() == com.hiremate.enums.CompanyStatus.VERIFIED || company.getStatus() == com.hiremate.enums.CompanyStatus.ACTIVE);
        if (user.getRole() != com.hiremate.enums.UserRole.ADMIN && requireGpkd) {
            if (company == null) {
                throw new IllegalArgumentException(
                        "Bạn chưa thiết lập thông tin Doanh nghiệp. Vui lòng cập nhật hồ sơ công ty và tải lên Giấy phép kinh doanh trước khi đăng tin tuyển dụng.");
            }
            if (company.getStatus() == com.hiremate.enums.CompanyStatus.PENDING) {
                throw new IllegalArgumentException(
                        "Doanh nghiệp \"" + company.getCompanyName() + "\" đang trong quá trình chờ Ban Quản Trị thẩm định Giấy phép kinh doanh. Vui lòng chờ Doanh nghiệp được xác minh (VERIFIED) để có thể xuất bản tin tuyển dụng.");
            }
            if (company.getStatus() == com.hiremate.enums.CompanyStatus.REJECTED) {
                throw new IllegalArgumentException(
                        "Hồ sơ Giấy phép kinh doanh của Doanh nghiệp \"" + company.getCompanyName() + "\" đã bị từ chối phê duyệt. Vui lòng cập nhật lại giấy tờ hợp lệ tại trang Hồ sơ Doanh nghiệp để tiếp tục.");
            }
            if (company.getStatus() == com.hiremate.enums.CompanyStatus.BANNED || company.getStatus() == com.hiremate.enums.CompanyStatus.SUSPENDED) {
                throw new IllegalArgumentException(
                        "Doanh nghiệp \"" + company.getCompanyName() + "\" hiện đang bị tạm khóa hoặc đình chỉ hoạt động. Bạn không thể đăng tin tuyển dụng lúc này.");
            }
        }

        // Quyết định trạng thái phê duyệt tin:
        // - Nếu tắt kiểm duyệt (moderateJobs = false) -> Luôn APPROVED ngay lập tức.
        // - Nếu bật kiểm duyệt, nhưng bật tự động xuất bản DN đã xác thực (autoPublishVerified = true) và công ty đã xác minh (VERIFIED/ACTIVE) -> APPROVED.
        // - Ngược lại -> PENDING để Ban Quản Trị duyệt thủ công.
        boolean isApproved = !moderateJobs;
        if (moderateJobs && autoPublishVerified && isCompanyVerified) {
            isApproved = true;
        }

        String effectiveBranch = request.getBranchName() != null && !request.getBranchName().isBlank()
                ? request.getBranchName().trim()
                : (recruiter.getBranchName() != null && !recruiter.getBranchName().isBlank() ? recruiter.getBranchName().trim() : "Trụ sở chính");

        String finalCategory = request.getCategory() != null && !request.getCategory().isBlank()
                ? request.getCategory().trim()
                : inferIndustryFromJobText(request.getTitle(), request.getDescription(), request.getRequirements());
        if (finalCategory == null || finalCategory.isBlank()) {
            finalCategory = "Information Technology";
        }

        Job job = Job.builder()
                .recruiter(recruiter)
                .company(company)
                .title(request.getTitle())
                .description(request.getDescription())
                .requirements(request.getRequirements())
                .benefits(request.getBenefits())
                .salaryMin(request.getSalaryMin())
                .salaryMax(request.getSalaryMax())
                .location(request.getLocation())
                .branchName(effectiveBranch)
                .employmentType(request.getEmploymentType())
                .vacanciesCount(request.getVacanciesCount() != null ? request.getVacanciesCount() : 1)
                .deadlineDate(request.getDeadlineDate())
                .salaryCurrency(request.getSalaryCurrency() != null && !request.getSalaryCurrency().isBlank() ? request.getSalaryCurrency().trim().toUpperCase() : "VND")
                .jobCategory(finalCategory)
                .status(isApproved ? JobStatus.PUBLISHED : JobStatus.DRAFT)
                .approvalStatus(isApproved ? JobApprovalStatus.APPROVED : JobApprovalStatus.PENDING)
                .build();

        Job savedJob = jobRepository.save(job);

        // Lưu kỹ năng chuẩn 70/30 (Mandatory & Preferred) theo ID hoặc theo tên
        saveJobSkills(savedJob.getJobId(), request);

        // Gửi thông báo hệ thống cho nhà tuyển dụng & Admin
        try {
            if (savedJob.getApprovalStatus() == JobApprovalStatus.PENDING) {
                notificationService.createNotification(
                        user.getUserId(),
                        com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                        "Tin tuyển dụng đang chờ phê duyệt",
                        "Tin tuyển dụng \"" + savedJob.getTitle() + "\" đã được tạo thành công và đang chờ Ban Quản Trị kiểm duyệt trước khi xuất bản công khai.",
                        savedJob.getJobId(),
                        "jobs"
                );
                notificationService.notifyAdmins(
                        com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                        "Tin tuyển dụng mới chờ kiểm duyệt",
                        "Doanh nghiệp \"" + (company != null ? company.getCompanyName() : user.getFullName()) + "\" vừa tạo tin \"" + savedJob.getTitle() + "\" đang chờ phê duyệt.",
                        savedJob.getJobId(),
                        "jobs"
                );
            } else {
                notificationService.createNotification(
                        user.getUserId(),
                        com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                        "Đăng tin tuyển dụng thành công!",
                        "Tin tuyển dụng \"" + savedJob.getTitle() + "\" đã được xuất bản thành công và sẵn sàng đón nhận hồ sơ ứng viên.",
                        savedJob.getJobId(),
                        "jobs"
                );
            }
        } catch (Exception notifEx) {
            log.warn("Không thể gửi thông báo đăng tin: {}", notifEx.getMessage());
        }

        return mapToResponse(savedJob);
    }

    @Override
    @Transactional
    public JobResponse updateJob(Long jobId, JobCreateRequest request, User user) {
        validateJobRequest(request);

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        JobStatus originalStatus = job.getStatus();

        // Kiểm tra quyền: tác giả, đồng nghiệp cùng chi nhánh, hoặc Admin
        if (!isAuthorizedRecruiterForJob(job, user)) {
            throw new SecurityException("Bạn chỉ có quyền chỉnh sửa tin tuyển dụng thuộc chi nhánh hoặc quyền phụ trách của mình!");
        }

        if (request.getBranchName() != null && !request.getBranchName().isBlank()) {
            job.setBranchName(request.getBranchName().trim());
        }

        job.setTitle(request.getTitle());
        job.setDescription(request.getDescription());
        job.setRequirements(request.getRequirements());
        job.setBenefits(request.getBenefits());
        job.setSalaryMin(request.getSalaryMin());
        job.setSalaryMax(request.getSalaryMax());
        job.setLocation(request.getLocation());
        job.setEmploymentType(request.getEmploymentType());
        if (request.getVacanciesCount() != null) {
            job.setVacanciesCount(request.getVacanciesCount());
        }
        if (request.getDeadlineDate() != null) {
            job.setDeadlineDate(request.getDeadlineDate());
        }

        if (request.getSalaryCurrency() != null && !request.getSalaryCurrency().isBlank()) {
            job.setSalaryCurrency(request.getSalaryCurrency().trim().toUpperCase());
        }
        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            job.setJobCategory(request.getCategory().trim());
        } else if (job.getJobCategory() == null || job.getJobCategory().isBlank()) {
            String inferred = inferIndustryFromJobText(job.getTitle(), job.getDescription(), job.getRequirements());
            job.setJobCategory(inferred != null ? inferred : "Information Technology");
        }

        Company comp = job.getCompany();
        boolean isCompanyVerified = comp != null && (comp.getStatus() == CompanyStatus.VERIFIED || comp.getStatus() == CompanyStatus.ACTIVE);

        boolean isPreviouslyRejected = job.getApprovalStatus() == com.hiremate.enums.JobApprovalStatus.REJECTED;

        // Nếu doanh nghiệp chưa xác minh pháp lý GPKD hoặc tin từng bị REJECTED: Mọi chỉnh sửa bắt buộc đưa về PENDING + DRAFT để Admin duyệt lại
        if (!isCompanyVerified || isPreviouslyRejected) {
            job.setApprovalStatus(com.hiremate.enums.JobApprovalStatus.PENDING);
            job.setStatus(JobStatus.DRAFT);
        } else {
            // Khi HR bấm Gia hạn hoặc mở lại tin đã hết hạn / CLOSED, chỉ chuyển về PUBLISHED nếu đã được APPROVED
            boolean deadlineValid = job.getDeadlineDate() == null || !job.getDeadlineDate().isBefore(LocalDate.now());
            if (request.getStatus() != null) {
                if (request.getStatus() == JobStatus.PUBLISHED) {
                    if (deadlineValid && (job.getApprovalStatus() == com.hiremate.enums.JobApprovalStatus.APPROVED || job.getApprovalStatus() == null)) {
                        job.setStatus(JobStatus.PUBLISHED);
                    } else {
                        job.setStatus(JobStatus.DRAFT);
                    }
                } else {
                    job.setStatus(request.getStatus());
                }
            } else if (job.getStatus() == JobStatus.CLOSED && deadlineValid) {
                if (job.getApprovalStatus() == com.hiremate.enums.JobApprovalStatus.APPROVED || job.getApprovalStatus() == null) {
                    job.setStatus(JobStatus.PUBLISHED);
                }
            }
        }

        // KIỂM TRA HẠN NGẠCH (QUOTA CHECK) NẾU TIN CHUYỂN TỪ TRẠNG THÁI KHÁC SANG PUBLISHED
        if (originalStatus != JobStatus.PUBLISHED && job.getStatus() == JobStatus.PUBLISHED) {
            checkRecruiterJobQuota(user);
        }

        Job updatedJob = jobRepository.save(job);

        // Cập nhật lại kỹ năng và xóa cache AI matching cũ CHỈ KHI danh sách kỹ năng thực sự thay đổi
        List<JobSkill> currentJobSkills = jobSkillRepository.findByJobId(jobId);
        boolean hasExistingSkills = currentJobSkills != null && !currentJobSkills.isEmpty();
        boolean hasSkillInput = (request.getMandatorySkillIds() != null && !request.getMandatorySkillIds().isEmpty())
                || (request.getPreferredSkillIds() != null && !request.getPreferredSkillIds().isEmpty())
                || (request.getMandatorySkills() != null && !request.getMandatorySkills().isEmpty())
                || (request.getPreferredSkills() != null && !request.getPreferredSkills().isEmpty());

        boolean shouldUpdateSkills = false;
        if (!hasExistingSkills) {
            // Chưa có kỹ năng nào, cần lưu hoặc tự động trích xuất
            shouldUpdateSkills = true;
        } else if (hasSkillInput) {
            // So sánh tập kỹ năng hiện tại với input mới
            List<Long> currentSkillIds = currentJobSkills.stream()
                    .map(JobSkill::getSkillId)
                    .filter(java.util.Objects::nonNull)
                    .toList();
            java.util.Set<String> currentSkillSet = skillRepository.findAllById(currentSkillIds).stream()
                    .map(sk -> sk.getSkillName().toLowerCase().trim())
                    .filter(s -> !s.isBlank())
                    .collect(Collectors.toSet());

            java.util.Set<String> newSkillSet = new java.util.HashSet<>();
            if (request.getMandatorySkills() != null) {
                request.getMandatorySkills().forEach(s -> { if (s != null && !s.isBlank()) newSkillSet.add(s.toLowerCase().trim()); });
            }
            if (request.getPreferredSkills() != null) {
                request.getPreferredSkills().forEach(s -> { if (s != null && !s.isBlank()) newSkillSet.add(s.toLowerCase().trim()); });
            }
            if (request.getMandatorySkillIds() != null && !request.getMandatorySkillIds().isEmpty()) {
                skillRepository.findAllById(request.getMandatorySkillIds())
                        .forEach(sk -> newSkillSet.add(sk.getSkillName().toLowerCase().trim()));
            }
            if (request.getPreferredSkillIds() != null && !request.getPreferredSkillIds().isEmpty()) {
                skillRepository.findAllById(request.getPreferredSkillIds())
                        .forEach(sk -> newSkillSet.add(sk.getSkillName().toLowerCase().trim()));
            }

            if (!currentSkillSet.equals(newSkillSet)) {
                shouldUpdateSkills = true;
            }
        }

        if (shouldUpdateSkills) {
            jobSkillRepository.deleteByJobId(jobId);
            saveJobSkills(jobId, request);
            if (aiJobMatchRepository != null) {
                try {
                    aiJobMatchRepository.deleteByJob_JobId(jobId);
                    log.info(">> [JobService] Cleared old AI matches cache for updated job ID: {}", jobId);
                } catch (Exception e) {
                    log.warn(">> [JobService] Could not clear AI match cache for job ID {}: {}", jobId, e.getMessage());
                }
            }
        }

        return mapToResponse(updatedJob);
    }

    @Override
    @Transactional
    public JobResponse getJobById(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        // Không tự động cộng view nếu người đang xem là Recruiter hoặc Admin (chỉ cộng cho ứng viên hoặc khách vãng lai)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isStaff = false;
        if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
            isStaff = auth.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .anyMatch(role -> role.equals("ROLE_RECRUITER") || role.equals("ROLE_ADMIN") || role.equals("RECRUITER") || role.equals("ADMIN"));
            if (!isStaff && auth.getPrincipal() instanceof User u) {
                isStaff = u.getRole() == com.hiremate.enums.UserRole.RECRUITER || u.getRole() == com.hiremate.enums.UserRole.ADMIN;
            }
        }

        if (!isStaff) {
            job.setTotalViews((job.getTotalViews() != null ? job.getTotalViews() : 0) + 1);
            jobRepository.save(job);
        }

        return mapToResponse(job);
    }

    private final java.util.concurrent.atomic.AtomicLong lastExpiredCheck = new java.util.concurrent.atomic.AtomicLong(0);

    @Transactional
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 * * * *")
    public void autoCloseExpiredJobs() {
        try {
            java.time.LocalDate today = java.time.LocalDate.now();
            List<Job> expired = jobRepository.findExpiredActiveJobs(today, JobStatus.PUBLISHED);
            if (!expired.isEmpty()) {
                for (Job j : expired) {
                    j.setStatus(JobStatus.CLOSED);
                }
                jobRepository.saveAll(expired);
                log.info(">> [JobService] Tự động đóng và chuyển về kho lưu trữ {} tin tuyển dụng hết hạn deadline.", expired.size());
            }
        } catch (Exception e) {
            log.warn(">> [JobService] Lỗi khi tự động đóng tin tuyển dụng hết hạn: {}", e.getMessage());
        }
    }

    private void checkExpiredJobsThrottled() {
        long now = System.currentTimeMillis();
        long last = lastExpiredCheck.get();
        // Kiểm tra tối đa 1 lần mỗi 10 phút, không quét CSDL trên từng request đọc
        if (now - last > 600_000 && lastExpiredCheck.compareAndSet(last, now)) {
            try {
                autoCloseExpiredJobs();
            } catch (Exception ex) {
                log.warn("Lỗi autoCloseExpiredJobs throttled: {}", ex.getMessage());
            }
        }
    }

    @Override
    @Transactional
    public List<JobResponse> getPublishedJobs(String keyword, String location) {
        checkExpiredJobsThrottled();
        List<Job> jobs;
        boolean hasKeyword = keyword != null && !keyword.trim().isEmpty();
        boolean hasLocation = location != null && !location.trim().isEmpty();

        if (!hasKeyword && !hasLocation) {
            jobs = jobRepository.findByStatus(JobStatus.PUBLISHED);
        } else {
            jobs = jobRepository.searchJobs(hasKeyword ? keyword.trim() : null, hasLocation ? location.trim() : null);
        }

        return mapToResponses(jobs);
    }

    @Override
    @Transactional
    public List<JobResponse> getPublishedJobsByCompanyId(Long companyId) {
        checkExpiredJobsThrottled();
        List<Job> jobs = jobRepository.findPublishedByCompanyId(companyId);
        return mapToResponses(jobs);
    }

    @Override
    @Transactional
    public PageResponse<JobResponse> getPublishedJobsPaged(
            String keyword,
            String location,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) {
        int pageNumber = Math.max(0, page);
        int pageSize = size > 0 ? Math.min(size, 100) : 10;
        org.springframework.data.domain.Sort.Direction direction =
                "asc".equalsIgnoreCase(sortDir) ? org.springframework.data.domain.Sort.Direction.ASC : org.springframework.data.domain.Sort.Direction.DESC;
        String sortProperty = (sortBy != null && !sortBy.isBlank()) ? sortBy.trim() : "createdAt";

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                pageNumber, pageSize, org.springframework.data.domain.Sort.by(direction, sortProperty));

        boolean hasKeyword = keyword != null && !keyword.trim().isEmpty();
        boolean hasLocation = location != null && !location.trim().isEmpty();

        org.springframework.data.domain.Page<Job> jobPage;
        if (!hasKeyword && !hasLocation) {
            jobPage = jobRepository.findByStatus(JobStatus.PUBLISHED, pageable);
        } else {
            jobPage = jobRepository.searchJobsPaged(hasKeyword ? keyword.trim() : null, hasLocation ? location.trim() : null, pageable);
        }

        return PageResponse.of(jobPage, mapToResponses(jobPage.getContent()));
    }

    @Override
    @Transactional
    public List<JobResponse> getRecruiterJobs(Long recruiterId) {
        checkExpiredJobsThrottled();
        Recruiter recruiter = recruiterRepository.findById(recruiterId).orElse(null);
        Long companyId = (recruiter != null && recruiter.getCompany() != null)
                ? recruiter.getCompany().getCompanyId()
                : (companyRepository != null ? companyRepository.findByRecruiterId(recruiterId).map(Company::getCompanyId).orElse(null) : null);

        List<Job> jobs;
        if (companyId != null) {
            jobs = jobRepository.findByCompany_CompanyIdOrderByCreatedAtDesc(companyId);
        } else {
            jobs = jobRepository.findByRecruiter_RecruiterId(recruiterId);
        }
        return mapToResponses(jobs);
    }

    @Override
    public PageResponse<JobResponse> getRecruiterJobsPaged(Long recruiterId, int page, int size) {
        checkExpiredJobsThrottled();
        int pageNumber = Math.max(0, page);
        int pageSize = size > 0 ? Math.min(size, 100) : 10;
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                pageNumber, pageSize, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));

        Recruiter recruiter = recruiterRepository.findById(recruiterId).orElse(null);
        Long companyId = (recruiter != null && recruiter.getCompany() != null)
                ? recruiter.getCompany().getCompanyId()
                : (companyRepository != null ? companyRepository.findByRecruiterId(recruiterId).map(Company::getCompanyId).orElse(null) : null);

        org.springframework.data.domain.Page<Job> jobPage;
        if (companyId != null) {
            jobPage = jobRepository.findByCompany_CompanyId(companyId, pageable);
        } else {
            jobPage = jobRepository.findByRecruiter_RecruiterId(recruiterId, pageable);
        }
        return PageResponse.of(jobPage, mapToResponses(jobPage.getContent()));
    }

    @Override
    @Transactional
    public void closeJob(Long jobId, User user) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        // Kiểm tra quyền theo chi nhánh / tác giả / admin
        if (!isAuthorizedRecruiterForJob(job, user)) {
            throw new SecurityException("Bạn chỉ có quyền chỉnh sửa tin tuyển dụng thuộc chi nhánh hoặc quyền phụ trách của mình!");
        }

        job.setStatus(JobStatus.CLOSED);
        jobRepository.save(job);
    }

    @Override
    @Transactional
    public void deleteJob(Long jobId, User user) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tin tuyển dụng với ID: " + jobId));

        // Kiểm tra quyền: người tạo, Head Recruiter công ty mẹ, HR cùng chi nhánh hoặc Admin
        if (!isAuthorizedRecruiterForJob(job, user)) {
            String authorName = (job.getRecruiter() != null && job.getRecruiter().getUser() != null)
                    ? job.getRecruiter().getUser().getFullName()
                    : "chuyên viên khác";
            throw new SecurityException("Bạn không có quyền xóa tin tuyển dụng này. Bài đăng thuộc quyền sở hữu của chuyên viên " + authorName + "!");
        }

        log.info(">> [JobService] User ID {} ({}) đang xóa tin tuyển dụng ID {} (\"{}\")",
                user.getUserId(), user.getFullName(), jobId, job.getTitle());

        // 1. Gỡ bỏ tham chiếu job_id khỏi các phiên phỏng vấn (Interview Sessions) để giữ lại lịch sử luyện tập
        if (interviewSessionRepository != null) {
            try {
                List<com.hiremate.entity.InterviewSession> sessions = interviewSessionRepository.findByJob_JobId(jobId);
                if (sessions != null && !sessions.isEmpty()) {
                    for (com.hiremate.entity.InterviewSession s : sessions) {
                        s.setJob(null);
                    }
                    interviewSessionRepository.saveAll(sessions);
                    log.info(">> [JobService] Đã gỡ tham chiếu {} phiên phỏng vấn gắn với job ID {}", sessions.size(), jobId);
                }
            } catch (Exception ex) {
                log.warn(">> [JobService] Lỗi gỡ tham chiếu interview sessions: {}", ex.getMessage());
            }
        }

        // 2. Chặn hard-delete nếu tin tuyển dụng đã có ứng viên nộp hồ sơ (bảo toàn hồ sơ ứng viên)
        List<com.hiremate.entity.Application> apps = applicationRepository.findByJob_JobId(jobId);
        if (apps != null && !apps.isEmpty()) {
            throw new IllegalStateException(String.format(
                    "Tin tuyển dụng \"%s\" hiện đang có %d ứng viên đã nộp hồ sơ. Để đảm bảo tính toàn vẹn hồ sơ của ứng viên, bạn không thể xóa tin này. Vui lòng chuyển trạng thái tin sang ĐÓNG (CLOSED) nếu muốn dừng nhận hồ sơ.",
                    job.getTitle(), apps.size()));
        }

        // 3. Xóa các bản ghi tính điểm AI Match
        if (aiJobMatchRepository != null) {
            try {
                aiJobMatchRepository.deleteByJob_JobId(jobId);
                log.info(">> [JobService] Đã xóa cache điểm AI match của job ID {}", jobId);
            } catch (Exception ex) {
                log.warn(">> [JobService] Lỗi khi xóa ai_job_matches: {}", ex.getMessage());
            }
        }

        // 4. Xóa Job Skills (Bắt buộc / Ưu tiên)
        try {
            jobSkillRepository.deleteByJobId(jobId);
        } catch (Exception ex) {
            log.warn(">> [JobService] Lỗi khi xóa job_skills: {}", ex.getMessage());
        }

        // 5. Xóa tin tuyển dụng khỏi cơ sở dữ liệu
        jobRepository.delete(job);
        log.info(">> [JobService] Đã xóa hoàn toàn tin tuyển dụng ID {} (\"{}\") khỏi hệ thống!", jobId, job.getTitle());
    }

    @Override
    @Transactional
    public JobResponse updateJobStatus(Long jobId, JobStatus status, User user) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        // Kiểm tra quyền: tác giả, đồng nghiệp cùng chi nhánh, hoặc Admin
        if (!isAuthorizedRecruiterForJob(job, user)) {
            throw new SecurityException("Bạn chỉ có quyền chỉnh sửa tin tuyển dụng thuộc chi nhánh hoặc quyền phụ trách của mình!");
        }

        if (status == JobStatus.PUBLISHED && job.getStatus() != JobStatus.PUBLISHED) {
            // 0. Kiểm tra trạng thái phê duyệt của Admin: Không được mở tin khi bị REJECTED hoặc PENDING
            if (job.getApprovalStatus() == com.hiremate.enums.JobApprovalStatus.REJECTED) {
                String note = (job.getModerationNote() != null && !job.getModerationNote().isBlank()) ? job.getModerationNote() : "Chưa đạt tiêu chuẩn kiểm duyệt";
                throw new IllegalArgumentException("Tin tuyển dụng này đang bị Quản trị viên từ chối (" + note + "). Vui lòng bấm 'Sửa' để cập nhật nội dung và gửi lại phê duyệt.");
            }
            if (job.getApprovalStatus() == com.hiremate.enums.JobApprovalStatus.PENDING) {
                throw new IllegalArgumentException("Tin tuyển dụng này đang chờ Quản trị viên kiểm duyệt. Không thể tự kích hoạt xuất bản.");
            }

            // 1. Kiểm tra hạn nộp hồ sơ
            if (job.getDeadlineDate() != null && job.getDeadlineDate().isBefore(LocalDate.now())) {
                throw new IllegalArgumentException("Hạn nộp hồ sơ của tin tuyển dụng này đã qua. Vui lòng cập nhật gia hạn ngày hết hạn trước khi mở lại tin.");
            }

            // 2. Kiểm tra giấy phép kinh doanh công ty đã được phê duyệt chưa
            Company company = job.getCompany();
            if (company == null && job.getRecruiter() != null) {
                company = job.getRecruiter().getCompany();
            }
            if (user.getRole() != com.hiremate.enums.UserRole.ADMIN) {
                if (company == null) {
                    throw new IllegalArgumentException("Doanh nghiệp chưa có thông tin. Vui lòng cập nhật và xác thực Giấy phép kinh doanh.");
                }
                if (company.getStatus() != com.hiremate.enums.CompanyStatus.VERIFIED && company.getStatus() != com.hiremate.enums.CompanyStatus.ACTIVE) {
                    throw new IllegalArgumentException(
                            "Doanh nghiệp \"" + company.getCompanyName() + "\" chưa được xác minh Giấy phép kinh doanh (trạng thái: "
                                    + company.getStatus() + "). Không thể kích hoạt xuất bản tin tuyển dụng.");
                }
            }

            // 3. Kiểm tra hạn ngạch gói dịch vụ
            checkRecruiterJobQuota(user);
        }

        if (status != null) {
            job.setStatus(status);
            Job updated = jobRepository.save(job);
            log.info(">> [JobService] Tin tuyển dụng ID {} đã được cập nhật trạng thái: {}", jobId, status);
            return mapToResponse(updated);
        }
        return mapToResponse(job);
    }

    @Override
    public PageResponse<JobResponse> getPublishedJobsPagedAdvanced(
            String keyword,
            String location,
            com.hiremate.enums.EmploymentType employmentType,
            java.math.BigDecimal minSalary,
            java.math.BigDecimal maxSalary,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) {
        int pageNumber = Math.max(0, page);
        int pageSize = size > 0 ? Math.min(size, 100) : 10;
        org.springframework.data.domain.Sort.Direction direction =
                "asc".equalsIgnoreCase(sortDir) ? org.springframework.data.domain.Sort.Direction.ASC : org.springframework.data.domain.Sort.Direction.DESC;
        String sortProperty = (sortBy != null && !sortBy.isBlank()) ? sortBy.trim() : "createdAt";

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                pageNumber, pageSize, org.springframework.data.domain.Sort.by(direction, sortProperty));

        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String cleanLocation = (location != null && !location.trim().isEmpty()) ? location.trim() : null;

        java.math.BigDecimal effectiveMin = minSalary;
        java.math.BigDecimal effectiveMax = maxSalary;
        if (effectiveMin != null && effectiveMin.compareTo(new java.math.BigDecimal("50000")) < 0) {
            effectiveMin = effectiveMin.multiply(new java.math.BigDecimal("25400"));
        }
        if (effectiveMax != null && effectiveMax.compareTo(new java.math.BigDecimal("50000")) < 0) {
            effectiveMax = effectiveMax.multiply(new java.math.BigDecimal("25400"));
        }

        org.springframework.data.domain.Page<Job> jobPage = jobRepository.searchJobsAdvancedPaged(
                cleanKeyword, cleanLocation, employmentType, effectiveMin, effectiveMax, pageable);

        return PageResponse.of(jobPage, mapToResponses(jobPage.getContent()));
    }

    @Override
    @Transactional
    public JobResponse cloneJob(Long jobId, User user) {
        Job originalJob = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        // Kiểm tra quyền: tác giả, đồng nghiệp cùng chi nhánh, hoặc Admin
        if (!isAuthorizedRecruiterForJob(originalJob, user)) {
            throw new SecurityException("Bạn chỉ có quyền chỉnh sửa tin tuyển dụng thuộc chi nhánh hoặc quyền phụ trách của mình!");
        }

        Recruiter currentRecruiter = recruiterRepository.findById(user.getUserId())
                .orElse(originalJob.getRecruiter());

        LocalDate newDeadline = (originalJob.getDeadlineDate() == null || originalJob.getDeadlineDate().isBefore(LocalDate.now()))
                ? LocalDate.now().plusDays(30)
                : originalJob.getDeadlineDate();

        String branch = (currentRecruiter != null && currentRecruiter.getBranchName() != null && !currentRecruiter.getBranchName().isBlank())
                ? currentRecruiter.getBranchName()
                : originalJob.getBranchName();

        Job cloned = Job.builder()
                .recruiter(currentRecruiter)
                .company(originalJob.getCompany() != null ? originalJob.getCompany() : (currentRecruiter != null ? currentRecruiter.getCompany() : null))
                .title("[Bản sao] " + originalJob.getTitle())
                .description(originalJob.getDescription())
                .requirements(originalJob.getRequirements())
                .benefits(originalJob.getBenefits())
                .salaryMin(originalJob.getSalaryMin())
                .salaryMax(originalJob.getSalaryMax())
                .salaryCurrency(originalJob.getSalaryCurrency() != null ? originalJob.getSalaryCurrency() : "VND")
                .jobCategory(originalJob.getJobCategory())
                .location(originalJob.getLocation())
                .branchName(branch)
                .employmentType(originalJob.getEmploymentType())
                .vacanciesCount(originalJob.getVacanciesCount() != null ? originalJob.getVacanciesCount() : 1)
                .deadlineDate(newDeadline)
                .status(JobStatus.DRAFT)
                .approvalStatus(JobApprovalStatus.PENDING)
                .totalViews(0)
                .build();

        Job savedJob = jobRepository.save(cloned);

        // Sao chép kỹ năng liên kết từ job cũ
        try {
            List<JobSkill> originalSkills = jobSkillRepository.findByJobId(jobId);
            for (JobSkill js : originalSkills) {
                jobSkillRepository.save(JobSkill.builder()
                        .jobId(savedJob.getJobId())
                        .skillId(js.getSkillId())
                        .importance(js.getImportance())
                        .weight(js.getWeight())
                        .build());
            }
        } catch (Exception e) {
            log.warn(">> [JobService] Không thể sao chép skills cho job clone: {}", e.getMessage());
        }

        log.info(">> [JobService] Tin tuyển dụng ID {} đã được sao chép thành công thành Job ID {}", jobId, savedJob.getJobId());
        return mapToResponse(savedJob);
    }

    @Override
    public List<JobResponse> mapToResponses(List<Job> jobs) {
        if (jobs == null || jobs.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> jobIds = jobs.stream().map(Job::getJobId).filter(Objects::nonNull).toList();

        // 1. Batch query applicant counts for all jobs in 1 single SQL query
        Map<Long, Long> applicantCounts = new HashMap<>();
        if (!jobIds.isEmpty() && applicationRepository != null) {
            try {
                List<Object[]> countRows = applicationRepository.countApplicationsByJobIds(jobIds);
                for (Object[] row : countRows) {
                    if (row != null && row.length >= 2 && row[0] instanceof Long jId && row[1] instanceof Number cnt) {
                        applicantCounts.put(jId, cnt.longValue());
                    }
                }
            } catch (Exception e) {
                log.warn("Batch count applications error: {}", e.getMessage());
            }
        }

        // 2. Batch query job skills for all jobs in 1 single SQL query
        Map<Long, List<String>> jobSkillsMap = new HashMap<>();
        Map<Long, List<String>> jobMandatorySkillsMap = new HashMap<>();
        Map<Long, List<String>> jobPreferredSkillsMap = new HashMap<>();
        if (!jobIds.isEmpty() && jobSkillRepository != null) {
            try {
                List<JobSkill> allJobSkills = jobSkillRepository.findByJobIdIn(jobIds);
                for (JobSkill js : allJobSkills) {
                    if (js.getJobId() != null && js.getSkillId() != null) {
                        String name = skillNameCache.computeIfAbsent(js.getSkillId(), id ->
                                skillRepository.findById(id).map(Skill::getSkillName).orElse(null)
                        );
                        if (name != null) {
                            jobSkillsMap.computeIfAbsent(js.getJobId(), k -> new ArrayList<>()).add(name);
                            if (js.getImportance() == SkillImportance.MANDATORY) {
                                jobMandatorySkillsMap.computeIfAbsent(js.getJobId(), k -> new ArrayList<>()).add(name);
                            } else {
                                jobPreferredSkillsMap.computeIfAbsent(js.getJobId(), k -> new ArrayList<>()).add(name);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Batch find job skills error: {}", e.getMessage());
            }
        }

        // 3. Map all jobs to JobResponse using pre-loaded maps
        List<JobResponse> responses = new ArrayList<>(jobs.size());
        for (Job job : jobs) {
            long appCount = applicantCounts.getOrDefault(job.getJobId(), 0L);
            List<String> skillNames = jobSkillsMap.getOrDefault(job.getJobId(), Collections.emptyList());
            List<String> mandSkills = jobMandatorySkillsMap.getOrDefault(job.getJobId(), Collections.emptyList());
            List<String> prefSkills = jobPreferredSkillsMap.getOrDefault(job.getJobId(), Collections.emptyList());
            responses.add(buildJobResponse(job, appCount, skillNames, mandSkills, prefSkills));
        }
        return responses;
    }

    @Override
    public JobResponse mapToResponse(Job job) {
        if (job == null) return null;
        List<JobResponse> list = mapToResponses(List.of(job));
        return list.isEmpty() ? null : list.get(0);
    }

    private JobResponse buildJobResponse(Job job, long applicantCount, List<String> skillNames, List<String> mandatorySkills, List<String> preferredSkills) {
        Company company = null;
        try {
            company = job.getCompany();
        } catch (Exception ignored) {}

        Recruiter recruiter = null;
        try {
            recruiter = job.getRecruiter();
        } catch (Exception ignored) {}

        User recruiterUser = null;
        String recruiterPosition = null;
        String recruiterDepartment = null;

        if (recruiter != null) {
            try {
                recruiterUser = recruiter.getUser();
            } catch (Exception ignored) {}
            if (recruiterUser == null && recruiter.getRecruiterId() != null && userRepository != null) {
                try {
                    recruiterUser = userRepository.findById(recruiter.getRecruiterId()).orElse(null);
                } catch (Exception ignored) {}
            }
            if (company == null) {
                try {
                    company = recruiter.getCompany();
                } catch (Exception ignored) {}
            }
            if (company == null && recruiter.getRecruiterId() != null && companyRepository != null) {
                try {
                    company = companyRepository.findByRecruiterId(recruiter.getRecruiterId()).orElse(null);
                } catch (Exception ignored) {}
            }
            try {
                recruiterPosition = recruiter.getPosition();
            } catch (Exception ignored) {}
            try {
                recruiterDepartment = recruiter.getDepartment();
            } catch (Exception ignored) {}
        }

        Long companyId = null;
        String companyName = "HireMate Partner";
        String companyLogo = null;
        String companySize = null;
        String companyAddress = null;
        String companyDescription = null;
        String companyWebsite = null;
        String companyIndustry = null;

        if (company != null) {
            try {
                companyId = company.getCompanyId();
                if (company.getCompanyName() != null) companyName = company.getCompanyName();
                companyLogo = company.getLogoUrl();
                companySize = company.getCompanySize();
                companyAddress = company.getAddress();
                companyDescription = company.getDescription();
                companyWebsite = company.getWebsite();
                companyIndustry = company.getIndustry();
            } catch (Exception ignored) {}
        }

        JobResponse resp = new JobResponse();
        resp.setJobId(job.getJobId());
        resp.setRecruiterId(recruiter != null ? recruiter.getRecruiterId() : null);
        resp.setRecruiterName(recruiterUser != null ? recruiterUser.getFullName() : null);
        resp.setRecruiterEmail(recruiterUser != null ? recruiterUser.getEmail() : null);
        resp.setRecruiterPhone(recruiterUser != null ? recruiterUser.getPhone() : null);
        resp.setRecruiterAvatar(recruiterUser != null ? recruiterUser.getAvatarUrl() : null);
        resp.setRecruiterPosition(recruiterPosition);
        resp.setRecruiterDepartment(recruiterDepartment);
        resp.setRecruiterBio(recruiterUser != null ? recruiterUser.getBio() : null);
        resp.setCompanyId(companyId);
        resp.setCompanyName(companyName);
        resp.setCompanyLogo(companyLogo);
        resp.setCompanySize(companySize);
        resp.setCompanyAddress(companyAddress);
        resp.setCompanyDescription(companyDescription);
        resp.setCompanyWebsite(companyWebsite);
        resp.setCompanyIndustry(companyIndustry);
        resp.setTitle(job.getTitle());
        resp.setDescription(job.getDescription());
        resp.setRequirements(parseCleanList(job.getRequirements()));
        resp.setBenefits(parseCleanList(job.getBenefits()));
        resp.setSalaryMin(job.getSalaryMin());
        resp.setSalaryMax(job.getSalaryMax());
        resp.setSalaryCurrency(job.getSalaryCurrency() != null ? job.getSalaryCurrency() : "VND");
        resp.setJobCategory(job.getJobCategory());
        resp.setLocation(job.getLocation());
        resp.setBranchName(job.getBranchName() != null && !job.getBranchName().isBlank()
                ? job.getBranchName()
                : (recruiter != null && recruiter.getBranchName() != null && !recruiter.getBranchName().isBlank() ? recruiter.getBranchName() : "Trụ sở chính"));
        resp.setEmploymentType(job.getEmploymentType());
        resp.setStatus(job.getStatus());
        resp.setApprovalStatus(job.getApprovalStatus());
        resp.setVacanciesCount(job.getVacanciesCount());
        resp.setTotalViews(job.getTotalViews());
        resp.setApplicantCount(applicantCount);
        resp.setDeadlineDate(job.getDeadlineDate());
        resp.setModerationNote(job.getModerationNote());
        resp.setSkills(skillNames);
        resp.setMandatorySkills(mandatorySkills != null ? mandatorySkills : Collections.emptyList());
        resp.setPreferredSkills(preferredSkills != null ? preferredSkills : Collections.emptyList());
        resp.setCreatedAt(job.getCreatedAt());
        return resp;
    }

    /**
     * Chuẩn hóa và bóc tách chuỗi thô thành mảng danh sách sạch:
     * - Xử lý các biến thể newline: '/n', '\n', '\r\n'
     * - Loại bỏ dấu gạch đầu dòng (-, *), bullet point (•), số thứ tự (1., 2.)
     * - Hỗ trợ cả danh sách phân tách bằng dấu phẩy
     */
    private List<String> parseCleanList(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            return new ArrayList<>();
        }

        // Chuẩn hóa tất cả các ký tự/chuỗi xuống dòng thành \n đơn
        String normalized = raw.replace("/n", "\n")
                               .replace("\\n", "\n")
                               .replace("\r", "");

        List<String> list = new ArrayList<>();
        String[] lines = normalized.split("\n");
        for (String line : lines) {
            String trimmed = line.trim();
            // Loại bỏ ký tự bullet point, gạch đầu dòng, số thứ tự ở đầu dòng
            trimmed = trimmed.replaceFirst("^[-*•·–—]+\\s*", "");
            trimmed = trimmed.replaceFirst("^\\d+[.)]\\s*", "");
            trimmed = trimmed.trim();

            if (!trimmed.isEmpty()) {
                list.add(trimmed);
            }
        }

        // Nếu chuỗi là một dòng đơn phân cách bằng dấu phẩy
        if (list.size() == 1 && list.get(0).contains(",")) {
            String[] commaParts = list.get(0).split(",");
            list.clear();
            for (String part : commaParts) {
                String p = part.trim().replaceFirst("^[-*•·–—]+\\s*", "").trim();
                if (!p.isEmpty()) {
                    list.add(p);
                }
            }
        }

        return list;
    }

    @Override
    public List<JobResponse> getAllJobsForAdmin() {
        return mapToResponses(jobRepository.findAllByOrderByCreatedAtDesc());
    }

    @Override
    @Transactional
    public JobResponse updateJobApproval(Long jobId, JobApprovalStatus status) {
        return updateJobApproval(jobId, status, null);
    }

    @Override
    @Transactional
    public JobResponse updateJobApproval(Long jobId, JobApprovalStatus status, String reason) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new com.hiremate.exception.ResourceNotFoundException("Không tìm thấy công việc ID: " + jobId));
        job.setApprovalStatus(status);
        if (status == JobApprovalStatus.APPROVED) {
            // 1. Kiểm tra tư cách pháp lý của Doanh nghiệp sở hữu tin
            if (job.getCompany() != null) {
                Company comp = job.getCompany();
                if (comp.getStatus() != CompanyStatus.VERIFIED && comp.getStatus() != CompanyStatus.ACTIVE) {
                    throw new com.hiremate.exception.BadRequestException(String.format(
                            "Không thể phê duyệt tin tuyển dụng vì Doanh nghiệp '%s' chưa được xác thực Giấy phép kinh doanh hợp lệ (Trạng thái hiện tại: %s)!",
                            comp.getCompanyName(), comp.getStatus()));
                }
            }

            // 2. Kiểm tra trạng thái tài khoản của Recruiter & Hạn ngạch tin đăng
            if (job.getRecruiter() != null && job.getRecruiter().getUser() != null) {
                User recUser = job.getRecruiter().getUser();
                if (recUser.getStatus() != com.hiremate.enums.UserStatus.ACTIVE) {
                    throw new com.hiremate.exception.BadRequestException("Không thể phê duyệt tin tuyển dụng vì tài khoản Nhà tuyển dụng này đang bị tạm ngưng hoặc khóa!");
                }
                checkRecruiterJobQuota(recUser);
            }

            // 3. Kiểm tra hạn nộp hồ sơ (Deadline) không được trong quá khứ
            boolean deadlineExpired = job.getDeadlineDate() != null && job.getDeadlineDate().isBefore(LocalDate.now());
            if (deadlineExpired) {
                throw new com.hiremate.exception.BadRequestException("Tin tuyển dụng này đã hết hạn nộp hồ sơ (Deadline trong quá khứ). Vui lòng yêu cầu Nhà tuyển dụng gia hạn trước khi phê duyệt xuất bản!");
            }

            job.setStatus(JobStatus.PUBLISHED);
            job.setModerationNote(null);
        } else if (status == JobApprovalStatus.REJECTED) {
            job.setStatus(JobStatus.CLOSED);
            if (reason != null && !reason.isBlank()) {
                job.setModerationNote(reason.trim());
            } else {
                job.setModerationNote("Nội dung tin đăng chưa đáp ứng tiêu chuẩn kiểm duyệt của HireMate AI. Vui lòng cập nhật lại thông tin tuyển dụng.");
            }
        }
        Job saved = jobRepository.save(job);

        // Gửi thông báo cho nhà tuyển dụng
        try {
            if (saved.getRecruiter() != null && saved.getRecruiter().getRecruiterId() != null) {
                Long recruiterUserId = saved.getRecruiter().getRecruiterId();
                String notiTitle = status == JobApprovalStatus.APPROVED
                        ? "Tin tuyển dụng đã được phê duyệt"
                        : "Tin tuyển dụng bị từ chối phê duyệt";
                String notiContent;
                if (status == JobApprovalStatus.APPROVED) {
                    notiContent = "Tin tuyển dụng \"" + saved.getTitle() + "\" của bạn đã được Admin phê duyệt và xuất bản công khai.";
                } else {
                    if (reason != null && !reason.isBlank()) {
                        notiContent = "Tin tuyển dụng \"" + saved.getTitle() + "\" đã bị từ chối phê duyệt. Lý do: " + reason.trim() + ". Vui lòng chỉnh sửa và gửi duyệt lại.";
                    } else {
                        notiContent = "Tin tuyển dụng \"" + saved.getTitle() + "\" chưa đạt yêu cầu kiểm duyệt. Vui lòng cập nhật lại nội dung.";
                    }
                }
                notificationService.createNotification(
                        recruiterUserId,
                        com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                        notiTitle,
                        notiContent,
                        saved.getJobId(),
                        "jobs"
                );
            }
        } catch (Exception e) {
            log.warn("Không thể gửi notification cho recruiter: {}", e.getMessage());
        }

        return mapToResponse(saved);
    }

    @Override
    public java.util.Map<String, Object> parseJdFile(org.springframework.web.multipart.MultipartFile file, String rawText) {
        String extractedText = "";

        if (file != null && !file.isEmpty()) {
            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
            try {
                byte[] bytes = file.getBytes();
                // 1. Nếu là ảnh chụp tin tuyển dụng (Screenshot/Photo) -> Dùng Gemini Vision OCR
                if (originalName.endsWith(".png") || originalName.endsWith(".jpg") || originalName.endsWith(".jpeg") || originalName.endsWith(".webp")) {
                    String mimeType = originalName.endsWith(".png") ? "image/png" : (originalName.endsWith(".webp") ? "image/webp" : "image/jpeg");
                    if (geminiAiService != null) {
                        log.info(">> [JobService] Đang OCR ảnh chụp bài đăng tuyển dụng bằng Gemini Vision: {}", originalName);
                        java.util.Map<String, Object> imgParsed = geminiAiService.parseJobDescriptionImage(bytes, mimeType);
                        return postProcessParsedJd(imgParsed, extractedText);
                    }
                } else if (originalName.endsWith(".pdf")) {
                    try (org.apache.pdfbox.pdmodel.PDDocument document = org.apache.pdfbox.Loader.loadPDF(bytes)) {
                        org.apache.pdfbox.text.PDFTextStripper stripper = new org.apache.pdfbox.text.PDFTextStripper();
                        extractedText = stripper.getText(document);
                        // Nếu PDF scan dạng ảnh (<50 ký tự), OCR đa trang (tối đa 3 trang) bằng Gemini Vision
                        if ((extractedText == null || extractedText.trim().length() < 50) && document.getNumberOfPages() > 0 && geminiAiService != null) {
                            log.info(">> [JobService] PDF có ít text (<50 ký tự), OCR đa trang qua Gemini Vision...");
                            try {
                                int maxPages = Math.min(document.getNumberOfPages(), 3);
                                org.apache.pdfbox.rendering.PDFRenderer renderer = new org.apache.pdfbox.rendering.PDFRenderer(document);
                                List<java.awt.image.BufferedImage> pageImages = new ArrayList<>();
                                int totalHeight = 0;
                                int maxWidth = 0;

                                for (int p = 0; p < maxPages; p++) {
                                    java.awt.image.BufferedImage pageImg = renderer.renderImageWithDPI(p, 140);
                                    pageImages.add(pageImg);
                                    totalHeight += pageImg.getHeight();
                                    if (pageImg.getWidth() > maxWidth) {
                                        maxWidth = pageImg.getWidth();
                                    }
                                }

                                java.awt.image.BufferedImage stitched = new java.awt.image.BufferedImage(maxWidth, totalHeight, java.awt.image.BufferedImage.TYPE_INT_RGB);
                                java.awt.Graphics2D g2d = stitched.createGraphics();
                                int currentY = 0;
                                for (java.awt.image.BufferedImage pageImg : pageImages) {
                                    g2d.drawImage(pageImg, 0, currentY, null);
                                    currentY += pageImg.getHeight();
                                }
                                g2d.dispose();

                                java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
                                javax.imageio.ImageIO.write(stitched, "png", baos);
                                java.util.Map<String, Object> pdfImgParsed = geminiAiService.parseJobDescriptionImage(baos.toByteArray(), "image/png");
                                return postProcessParsedJd(pdfImgParsed, extractedText);
                            } catch (Exception ocrEx) {
                                log.warn(">> [JobService] OCR scanned PDF failed: {}", ocrEx.getMessage());
                            }
                        }
                    }
                } else if (originalName.endsWith(".docx")) {
                    try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(bytes);
                         org.apache.poi.xwpf.usermodel.XWPFDocument doc = new org.apache.poi.xwpf.usermodel.XWPFDocument(bais);
                         org.apache.poi.xwpf.extractor.XWPFWordExtractor extractor = new org.apache.poi.xwpf.extractor.XWPFWordExtractor(doc)) {
                        extractedText = extractor.getText();
                    } catch (Exception docxEx) {
                        log.warn(">> [JobService] Apache POI đọc DOCX lỗi ({}), thử fallback ZipInputStream...", docxEx.getMessage());
                        try (java.util.zip.ZipInputStream zis = new java.util.zip.ZipInputStream(new java.io.ByteArrayInputStream(bytes))) {
                            java.util.zip.ZipEntry entry;
                            while ((entry = zis.getNextEntry()) != null) {
                                if ("word/document.xml".equals(entry.getName())) {
                                    String xmlContent = new String(zis.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
                                    String cleaned = xmlContent
                                            .replaceAll("(?i)<w:p[^>]*>", "\n")
                                            .replaceAll("(?i)<w:br[^>]*>", "\n")
                                            .replaceAll("(?i)<w:tab[^>]*>", "\t")
                                            .replaceAll("<[^>]+>", " ")
                                            .replaceAll("[ \t]+", " ")
                                            .replaceAll("\n\\s*\n", "\n")
                                            .trim();
                                    if (!cleaned.isBlank()) {
                                        extractedText = cleaned;
                                        log.info(">> [JobService] Đã trích xuất {} ký tự từ DOCX qua fallback ZipInputStream", extractedText.length());
                                    }
                                    break;
                                }
                            }
                        } catch (Exception zipEx) {
                            log.warn(">> [JobService] Không thể bóc tách text từ DOCX qua ZipInputStream: {}", zipEx.getMessage());
                        }
                    }
                } else if (originalName.endsWith(".doc")) {
                    try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(bytes);
                         org.apache.poi.hwpf.HWPFDocument doc = new org.apache.poi.hwpf.HWPFDocument(bais);
                         org.apache.poi.hwpf.extractor.WordExtractor extractor = new org.apache.poi.hwpf.extractor.WordExtractor(doc)) {
                        extractedText = extractor.getText();
                    } catch (Exception docEx) {
                        log.warn(">> [JobService] HWPF doc read failed ({}), falling back to text stream...", docEx.getMessage());
                        try {
                            String rawStr = new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
                            String cleaned = rawStr.replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]", " ").trim();
                            if (cleaned.length() > 50) {
                                extractedText = cleaned;
                            }
                        } catch (Exception ignored) {}
                    }
                } else {
                    extractedText = new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
                }
            } catch (Exception e) {
                log.warn(">> [JobService] Không thể đọc nội dung file JD {}: {}", originalName, e.getMessage());
            }
        }

        if ((extractedText == null || extractedText.isBlank()) && rawText != null && !rawText.isBlank()) {
            extractedText = rawText;
        }

        java.util.Map<String, Object> aiResult = null;
        if (geminiAiService != null && extractedText != null && !extractedText.isBlank()) {
            try {
                aiResult = geminiAiService.parseJobDescription(extractedText);
            } catch (Exception e) {
                log.warn(">> [JobService] Gemini JD parse failed: {}. Falling back to domain parser.", e.getMessage());
            }
        }

        if (aiResult == null) {
            if (geminiAiService != null) {
                try {
                    aiResult = geminiAiService.parseJobDescription(extractedText != null ? extractedText : "");
                } catch (Exception ignored) {}
            }
            if (aiResult == null) {
                aiResult = createSmartFallbackJd(extractedText);
            }
        }

        return postProcessParsedJd(aiResult, extractedText);
    }

    @SuppressWarnings("unchecked")
    private java.util.Map<String, Object> postProcessParsedJd(java.util.Map<String, Object> parsed, String rawText) {
        if (parsed == null) {
            parsed = createSmartFallbackJd(rawText);
        }

        List<String> mandList = new ArrayList<>();
        Object rawMand = parsed.get("mandatorySkills");
        if (rawMand instanceof List<?>) {
            for (Object obj : (List<?>) rawMand) {
                if (obj != null && !obj.toString().isBlank()) mandList.add(obj.toString().trim());
            }
        }

        List<String> prefList = new ArrayList<>();
        Object rawPref = parsed.get("preferredSkills");
        if (rawPref instanceof List<?>) {
            for (Object obj : (List<?>) rawPref) {
                if (obj != null && !obj.toString().isBlank()) prefList.add(obj.toString().trim());
            }
        }

        // Nếu cả 2 danh sách kỹ năng rỗng, tự động suy luận qua skillService.extractSkillsFromJd
        if (mandList.isEmpty() && prefList.isEmpty() && skillService != null) {
            try {
                String title = parsed.get("title") != null ? parsed.get("title").toString() : "Vị trí tuyển dụng";
                String desc = parsed.get("description") != null ? parsed.get("description").toString() : "";
                String req = parsed.get("requirements") != null ? parsed.get("requirements").toString() : "";
                String fullContext = (desc + "\n" + req).trim();
                if (fullContext.isBlank()) fullContext = rawText != null ? rawText : "";
                com.hiremate.dto.request.AiJdSkillExtractRequest extractReq = com.hiremate.dto.request.AiJdSkillExtractRequest.builder()
                        .title(title)
                        .description(fullContext)
                        .industry(parsed.get("domain") != null ? parsed.get("domain").toString() : null)
                        .build();
                com.hiremate.dto.response.AiJdSkillExtractResponse autoExtracted = skillService.extractSkillsFromJd(extractReq);
                if (autoExtracted != null) {
                    if (autoExtracted.getMandatorySkills() != null) {
                        for (com.hiremate.dto.response.SkillItemDTO item : autoExtracted.getMandatorySkills()) {
                            if (item.getSkillName() != null && !mandList.contains(item.getSkillName())) {
                                mandList.add(item.getSkillName());
                            }
                        }
                    }
                    if (autoExtracted.getPreferredSkills() != null) {
                        for (com.hiremate.dto.response.SkillItemDTO item : autoExtracted.getPreferredSkills()) {
                            if (item.getSkillName() != null && !mandList.contains(item.getSkillName()) && !prefList.contains(item.getSkillName())) {
                                prefList.add(item.getSkillName());
                            }
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn(">> [JobService] Tự động suy luận kỹ năng cho JD thất bại: {}", ex.getMessage());
            }
        }

        // Chuẩn hóa và lưu kỹ năng vào CSDL 3NF qua skillService.findOrCreateNormalizedSkill
        List<String> normalizedMand = new ArrayList<>();
        List<String> normalizedPref = new ArrayList<>();
        List<String> newSkillsAdded = new ArrayList<>();
        String domainStr = parsed.get("domain") != null ? parsed.get("domain").toString() : null;

        for (String sk : mandList) {
            if (sk == null || sk.isBlank()) continue;
            String trimmed = sk.trim();
            boolean existed = skillRepository.existsBySkillNameIgnoreCase(trimmed);
            try {
                if (skillService != null) {
                    com.hiremate.entity.Skill normSkill = skillService.findOrCreateNormalizedSkill(trimmed, domainStr, null);
                    if (normSkill != null && normSkill.getSkillName() != null) {
                        String nName = normSkill.getSkillName().trim();
                        if (!normalizedMand.contains(nName)) normalizedMand.add(nName);
                        skillNameCache.put(normSkill.getSkillId(), nName);
                        if (!existed && !newSkillsAdded.contains(nName)) {
                            newSkillsAdded.add(nName);
                        }
                        continue;
                    }
                }
            } catch (Exception ex) {
                log.warn(">> [JobService] findOrCreateNormalizedSkill failed for mandatory skill '{}': {}", trimmed, ex.getMessage());
            }
            Long sid = resolveOrCreateSkillId(trimmed, domainStr);
            if (sid != null) {
                String normalizedName = skillNameCache.get(sid);
                if (normalizedName == null) {
                    normalizedName = skillRepository.findById(sid).map(Skill::getSkillName).orElse(trimmed);
                    skillNameCache.put(sid, normalizedName);
                }
                if (!normalizedMand.contains(normalizedName)) {
                    normalizedMand.add(normalizedName);
                }
                if (!existed && !newSkillsAdded.contains(normalizedName)) {
                    newSkillsAdded.add(normalizedName);
                }
            } else {
                if (!normalizedMand.contains(trimmed)) normalizedMand.add(trimmed);
            }
        }

        for (String sk : prefList) {
            if (sk == null || sk.isBlank()) continue;
            String trimmed = sk.trim();
            boolean existed = skillRepository.existsBySkillNameIgnoreCase(trimmed);
            try {
                if (skillService != null) {
                    com.hiremate.entity.Skill normSkill = skillService.findOrCreateNormalizedSkill(trimmed, domainStr, null);
                    if (normSkill != null && normSkill.getSkillName() != null) {
                        String nName = normSkill.getSkillName().trim();
                        if (!normalizedMand.contains(nName) && !normalizedPref.contains(nName)) {
                            normalizedPref.add(nName);
                        }
                        skillNameCache.put(normSkill.getSkillId(), nName);
                        if (!existed && !newSkillsAdded.contains(nName)) {
                            newSkillsAdded.add(nName);
                        }
                        continue;
                    }
                }
            } catch (Exception ex) {
                log.warn(">> [JobService] findOrCreateNormalizedSkill failed for preferred skill '{}': {}", trimmed, ex.getMessage());
            }
            Long sid = resolveOrCreateSkillId(trimmed, domainStr);
            if (sid != null) {
                String normalizedName = skillNameCache.get(sid);
                if (normalizedName == null) {
                    normalizedName = skillRepository.findById(sid).map(Skill::getSkillName).orElse(trimmed);
                    skillNameCache.put(sid, normalizedName);
                }
                if (!normalizedMand.contains(normalizedName) && !normalizedPref.contains(normalizedName)) {
                    normalizedPref.add(normalizedName);
                }
                if (!existed && !newSkillsAdded.contains(normalizedName)) {
                    newSkillsAdded.add(normalizedName);
                }
            } else {
                if (!normalizedMand.contains(trimmed) && !normalizedPref.contains(trimmed)) {
                    normalizedPref.add(trimmed);
                }
            }
        }

        parsed.put("mandatorySkills", normalizedMand);
        parsed.put("preferredSkills", normalizedPref);
        parsed.put("newSkillsAdded", newSkillsAdded);
        parsed.put("newSkillsAddedCount", newSkillsAdded.size());

        return parsed;
    }

    private java.util.Map<String, Object> createSmartFallbackJd(String rawText) {
        String lower = (rawText != null ? rawText : "").toLowerCase();
        java.util.Map<String, Object> fallback = new java.util.HashMap<>();
        fallback.put("employmentType", "FULL_TIME");
        fallback.put("salaryMin", 12000000);
        fallback.put("salaryMax", 22000000);
        fallback.put("salaryText", "12 – 22 triệu VNĐ / tháng");
        fallback.put("location", "Hà Nội");
        fallback.put("vacanciesCount", 1);
        fallback.put("deadlineDate", java.time.LocalDate.now().plusDays(45).toString());

        if (lower.contains("marketing") || lower.contains("seo") || lower.contains("content") || lower.contains("truyền thông")) {
            fallback.put("title", "Chuyên viên Marketing");
            fallback.put("domain", "Marketing / Truyền thông / Quảng cáo");
            fallback.put("description", "- Lập kế hoạch và triển khai các chiến dịch Digital Marketing (SEO, SEM, Social Media, Email Marketing).\n" +
                    "- Sáng tạo nội dung truyền thông, kịch bản video và thông điệp thương hiệu trên các kênh số.\n" +
                    "- Phân tích chỉ số hiệu quả chiến dịch (Google Analytics, Meta Ads) và tối ưu chi phí chuyển đổi.");
            fallback.put("requirements", "- Tốt nghiệp Đại học/Cao đẳng chuyên ngành Marketing, QTKD hoặc Truyền thông.\n" +
                    "- Có tối thiểu 1 năm kinh nghiệm thực chiến trong lĩnh vực Digital Marketing / SEO / Content.\n" +
                    "- Kỹ năng sáng tạo nội dung và sử dụng các công cụ quảng cáo trực tuyến.");
            fallback.put("benefits", "- Thu nhập cạnh tranh từ 12 – 22 triệu VNĐ / tháng + Thưởng chiến dịch.\n" +
                    "- Môi trường làm việc trẻ trung, năng động, khuyến khích sáng tạo.\n" +
                    "- Đầy đủ BHXH, du lịch nghỉ mát định kỳ hàng năm.");
            fallback.put("mandatorySkills", java.util.List.of("Digital Marketing", "Content Creation", "SEO"));
            fallback.put("preferredSkills", java.util.List.of("Google Analytics", "Facebook Ads", "Canva"));
        } else if (lower.contains("sales") || lower.contains("kinh doanh") || lower.contains("bán hàng") || lower.contains("khách hàng")) {
            fallback.put("title", "Chuyên viên Kinh doanh / Sales B2B");
            fallback.put("domain", "Kinh doanh / Bán hàng / Phát triển thị trường");
            fallback.put("description", "- Tìm kiếm, tiếp cận khách hàng tiềm năng và mở rộng mạng lưới đối tác kinh doanh.\n" +
                    "- Tư vấn giải pháp, đàm phán hợp đồng thương mại và chốt đơn hàng theo chỉ tiêu doanh thu.\n" +
                    "- Chăm sóc khách hàng hiện hữu và quản lý dữ liệu trên hệ thống CRM.");
            fallback.put("requirements", "- Tốt nghiệp Cao đẳng/Đại học khối ngành Kinh tế, QTKD hoặc Thương mại.\n" +
                    "- Kỹ năng giao tiếp, thuyết phục và đàm phán thương lượng xuất sắc.\n" +
                    "- Tác phong chuyên nghiệp, đam mê kinh doanh và hướng đến mục tiêu.");
            fallback.put("benefits", "- Lương cứng 10 – 15 triệu + Hoa hồng doanh số không giới hạn (Thu nhập 20 – 35 triệu/tháng).\n" +
                    "- Thưởng nóng khi vượt chỉ tiêu doanh số quý/năm.\n" +
                    "- Chế độ phúc lợi, bảo hiểm và phụ cấp công tác đầy đủ.");
            fallback.put("mandatorySkills", java.util.List.of("B2B Sales", "Đàm phán thương lượng", "Kỹ năng giao tiếp"));
            fallback.put("preferredSkills", java.util.List.of("CRM", "Lead Generation", "Chăm sóc khách hàng"));
        } else if (lower.contains("kế toán") || lower.contains("kiểm toán") || lower.contains("tài chính") || lower.contains("accountant")) {
            fallback.put("title", "Chuyên viên Kế toán");
            fallback.put("domain", "Kế toán / Kiểm toán / Tài chính");
            fallback.put("description", "- Hạch toán các nghiệp vụ kinh tế phát sinh, lập phiếu thu chi và hóa đơn điện tử.\n" +
                    "- Lập báo cáo thuế định kỳ (GTGT, TNDN, TNCN) và quyết toán thuế năm.\n" +
                    "- Lập Báo cáo tài chính và theo dõi công nợ khách hàng, nhà cung cấp.");
            fallback.put("requirements", "- Tốt nghiệp Đại học/Cao đẳng chuyên ngành Kế toán, Kiểm toán, Tài chính.\n" +
                    "- Nắm vững chuẩn mực kế toán và các quy định pháp luật về thuế hiện hành.\n" +
                    "- Thành thạo phần mềm kế toán MISA / FAST và kỹ năng Excel nâng cao.");
            fallback.put("benefits", "- Thu nhập từ 10 – 18 triệu VNĐ / tháng + Lương tháng 13 và thưởng quyết toán năm.\n" +
                    "- Môi trường chuẩn mực, ổn định, đầy đủ chế độ BHXH/BHYT.\n" +
                    "- Cơ hội thăng tiến lên Kế toán tổng hợp / Kế toán trưởng.");
            fallback.put("mandatorySkills", java.util.List.of("Kế toán tổng hợp", "Báo cáo tài chính", "MISA"));
            fallback.put("preferredSkills", java.util.List.of("Kê khai thuế", "Excel nâng cao", "Hóa đơn điện tử"));
        } else if (lower.contains("nhân sự") || lower.contains("tuyển dụng") || lower.contains("hr") || lower.contains("c&b")) {
            fallback.put("title", "Chuyên viên Nhân sự (HR/TA)");
            fallback.put("domain", "Nhân sự / Tuyển dụng / Quản trị nguồn nhân lực");
            fallback.put("description", "- Tiếp nhận nhu cầu tuyển dụng, đăng tuyển và sàng lọc hồ sơ ứng viên.\n" +
                    "- Điều phối lịch phỏng vấn và thực hiện thủ tục tiếp nhận nhân sự mới (Onboarding).\n" +
                    "- Quản lý hồ sơ nhân viên, theo dõi chấm công và hỗ trợ tính lương, BHXH.");
            fallback.put("requirements", "- Tốt nghiệp Đại học khối ngành Quản trị Nhân lực, Luật hoặc QTKD.\n" +
                    "- Tối thiểu 1 năm kinh nghiệm trong lĩnh vực Tuyển dụng hoặc C&B.\n" +
                    "- Kỹ năng giao tiếp, kết nối con người và nắm bắt Luật Lao động.");
            fallback.put("benefits", "- Thu nhập 10 – 16 triệu VNĐ / tháng + Thưởng tuyển dụng theo KPI.\n" +
                    "- Chế độ chăm sóc sức khỏe, teambuilding và du lịch hàng năm.\n" +
                    "- Cơ hội nâng cao kỹ năng xây dựng văn hóa doanh nghiệp.");
            fallback.put("mandatorySkills", java.util.List.of("Tuyển dụng & Đào tạo", "Luật Lao động", "Quản lý hồ sơ nhân sự"));
            fallback.put("preferredSkills", java.util.List.of("C&B", "BHXH", "Phỏng vấn & Đánh giá"));
        } else if (lower.contains("thiết kế") || lower.contains("graphic") || lower.contains("designer") || lower.contains("ui/ux")) {
            fallback.put("title", "Chuyên viên Thiết kế (UI/UX / Graphic Designer)");
            fallback.put("domain", "Thiết kế / Sáng tạo nghệ thuật");
            fallback.put("description", "- Thiết kế giao diện Website, Mobile App (UI/UX) hoặc các ấn phẩm truyền thông thương hiệu.\n" +
                    "- Xây dựng Wireframes, Prototypes và Design System nhất quán.\n" +
                    "- Phối hợp với bộ phận Marketing và Lập trình để hoàn thiện sản phẩm.");
            fallback.put("requirements", "- Thành thạo Figma, Adobe Photoshop, Adobe Illustrator.\n" +
                    "- Có portfolio thể hiện tư duy thẩm mỹ, màu sắc và typography hiện đại.\n" +
                    "- Tinh thần trách nhiệm cao và khả năng làm việc nhóm tốt.");
            fallback.put("benefits", "- Mức lương 12 – 20 triệu VNĐ / tháng + Thưởng dự án sáng tạo.\n" +
                    "- Trang bị máy tính cấu hình cao và bản quyền phần mềm thiết kế.\n" +
                    "- Không gian làm việc hiện đại, cởi mở, khuyến khích sáng tạo.");
            fallback.put("mandatorySkills", java.util.List.of("Figma", "Adobe Photoshop", "Adobe Illustrator"));
            fallback.put("preferredSkills", java.util.List.of("UI/UX Design", "Tư duy thẩm mỹ", "Typography"));
        } else if (lower.contains("frontend") || lower.contains("front-end") || lower.contains("react") || lower.contains("vue") || lower.contains("angular")) {
            fallback.put("title", "Frontend Developer");
            fallback.put("domain", "Công nghệ thông tin / Frontend Web");
            fallback.put("description", "- Tham gia nghiên cứu, thiết kế kiến trúc và phát triển giao diện người dùng (Frontend Architecture) cho các ứng dụng web hiện đại.\n" +
                    "- Xây dựng các UI Components tái sử dụng, tối ưu hóa tốc độ tải trang, Core Web Vitals và tính tương thích trên đa trình duyệt/thiết bị.\n" +
                    "- Tích hợp mượt mà với các hệ thống Backend thông qua RESTful API và GraphQL.\n" +
                    "- Phối hợp chặt chẽ cùng UI/UX Designer và Product Owner để hiện thực hóa trải nghiệm người dùng tinh tế theo chuẩn Agile/Scrum.");
            fallback.put("requirements", "- Tối thiểu 1-3 năm kinh nghiệm phát triển Frontend thực chiến với React.js / Vue.js / Next.js và TypeScript / JavaScript.\n" +
                    "- Thành thạo HTML5, CSS3, Tailwind CSS / Sass, thiết kế Responsive Design hiện đại.\n" +
                    "- Nắm vững kiến trúc quản lý state (Redux Toolkit, Zustand, Context API) và cơ chế DOM Rendering.\n" +
                    "- Khả năng làm việc nhóm, tư duy thẩm mỹ giao diện tốt và tinh thần trách nhiệm cao.");
            fallback.put("benefits", "- Mức thu nhập cạnh tranh từ 25 – 45 triệu VNĐ/tháng (Gross/Net + Thưởng dự án).\n" +
                    "- Gói bảo hiểm sức khỏe VIP toàn diện cho bản thân và người thân.\n" +
                    "- Chế độ làm việc Hybrid linh hoạt, du lịch nghỉ dưỡng định kỳ hàng năm.");
            fallback.put("mandatorySkills", java.util.List.of("React", "TypeScript", "HTML5 & CSS3"));
            fallback.put("preferredSkills", java.util.List.of("Tailwind CSS", "Next.js", "RESTful API"));
        } else if (lower.contains("tester") || lower.contains("qa") || lower.contains("qc") || lower.contains("kiểm thử")) {
            fallback.put("title", "QA / Automation Test Engineer");
            fallback.put("domain", "Công nghệ thông tin / Đảm bảo chất lượng (QA/QC)");
            fallback.put("description", "- Xây dựng và thực thi kịch bản kiểm thử tự động (Automation Testing) cho các hệ thống phần mềm.\n" +
                    "- Viết Test Plan, Test Case và báo cáo lỗi (Bug Report) chi tiết trên Jira.\n" +
                    "- Phối hợp với đội ngũ phát triển để phân tích nguyên nhân gốc rễ và xác thực bản vá lỗi.");
            fallback.put("requirements", "- Kinh nghiệm kiểm thử phần mềm thực tế với Selenium / Playwright / Postman.\n" +
                    "- Hiểu biết về quy trình kiểm thử phần mềm (STLC), kiểm thử hiệu năng (JMeter).\n" +
                    "- Kỹ năng phân tích vấn đề và giao tiếp tốt.");
            fallback.put("benefits", "- Mức thu nhập hấp dẫn từ 18 – 30 triệu VNĐ/tháng.\n" +
                    "- Bảo hiểm sức khỏe VIP toàn diện, khám sức khỏe định kỳ.\n" +
                    "- Cơ hội học hỏi và nâng cao kỹ năng kiểm thử tự động chuyên sâu.");
            fallback.put("mandatorySkills", java.util.List.of("Automation Testing", "Selenium", "Postman"));
            fallback.put("preferredSkills", java.util.List.of("Playwright", "CI/CD", "JMeter"));
        } else if (lower.contains("mobile") || lower.contains("android") || lower.contains("ios") || lower.contains("flutter")) {
            fallback.put("title", "Mobile App Developer");
            fallback.put("domain", "Công nghệ thông tin / Ứng dụng di động");
            fallback.put("description", "- Phát triển ứng dụng di động đa nền tảng hoặc native cho iOS và Android.\n" +
                    "- Tối ưu hóa hiệu năng và trải nghiệm người dùng trên các thiết bị di động.\n" +
                    "- Tích hợp các RESTful API và dịch vụ đám mây (Firebase, Cloud Messaging).");
            fallback.put("requirements", "- Kinh nghiệm phát triển ứng dụng di động với Flutter / React Native / Swift / Kotlin.\n" +
                    "- Nắm vững kiến trúc phần mềm di động (BLoC, Provider, MVC, MVVM).\n" +
                    "- Đã từng xuất bản ứng dụng lên App Store hoặc Google Play là lợi thế.");
            fallback.put("benefits", "- Thu nhập cạnh tranh từ 20 – 35 triệu VNĐ/tháng.\n" +
                    "- Môi trường năng động, công nghệ hiện đại.\n" +
                    "- Cung cấp thiết bị kiểm thử di động cao cấp.");
            fallback.put("mandatorySkills", java.util.List.of("Flutter", "React Native", "RESTful API"));
            fallback.put("preferredSkills", java.util.List.of("Firebase", "iOS", "Android"));
        } else if (lower.contains("giảng viên") || lower.contains("giáo viên") || lower.contains("đào tạo") || lower.contains("giáo dục") || lower.contains("teacher") || lower.contains("lecturer")) {
            fallback.put("title", "Giảng viên Đại học / Giáo viên");
            fallback.put("domain", "Giáo dục / Đào tạo");
            fallback.put("description", "- Giảng dạy học phần chuyên ngành theo đề cương chi tiết và chuẩn đầu ra chương trình đào tạo.\n" +
                    "- Soạn thảo bài giảng điện tử, học liệu số và quản lý sinh viên qua hệ thống LMS (Canvas / Moodle).\n" +
                    "- Hướng dẫn sinh viên nghiên cứu khoa học, đồ án tốt nghiệp và tham gia các đề tài nghiên cứu cấp trường/bộ.");
            fallback.put("requirements", "- Trình độ Thạc sĩ / Tiến sĩ chuyên ngành hoặc có chứng chỉ Nghiệp vụ Sư phạm giảng dạy đại học.\n" +
                    "- Khả năng nghiên cứu khoa học độc lập và công bố bài báo trên các tạp chí chuyên ngành uy tín.\n" +
                    "- Kỹ năng sư phạm, truyền cảm hứng và thành thạo ứng dụng công nghệ trong giảng dạy.");
            fallback.put("benefits", "- Thu nhập 15 – 30 triệu VNĐ / tháng + Thù lao vượt giờ giảng và thưởng công bố bài báo khoa học.\n" +
                    "- Môi trường học thuật văn minh, chuẩn mực, tài trợ kinh phí nghiên cứu và tham dự hội thảo quốc tế.\n" +
                    "- Đầy đủ chế độ BHXH/BHYT, bảo hiểm sức khỏe VIP và chế độ nghỉ phép theo quy định.");
            fallback.put("mandatorySkills", java.util.List.of("Phương pháp Sư phạm & Giảng dạy Đại học", "Biên soạn Đề cương & Bài giảng LMS", "Nghiên cứu Khoa học & Công bố Quốc tế (Scopus/ISI)"));
            fallback.put("preferredSkills", java.util.List.of("Hệ thống LMS (Canvas / Moodle)", "Kiểm định Chất lượng Giáo dục (AUN-QA)", "Xử lý Dữ liệu Nghiên cứu (SPSS / R / Stata)"));
        } else if (lower.contains("luật") || lower.contains("luật sư") || lower.contains("pháp lý") || lower.contains("pháp chế") || lower.contains("legal") || lower.contains("lawyer")) {
            fallback.put("title", "Chuyên viên Pháp chế / Luật sư Doanh nghiệp");
            fallback.put("domain", "Pháp lý / Luật sư / Pháp chế");
            fallback.put("description", "- Soạn thảo, rà soát và tham gia đàm phán các hợp đồng thương mại, đầu tư, hợp tác kinh doanh.\n" +
                    "- Đánh giá rủi ro pháp lý trong hoạt động vận hành của doanh nghiệp và tư vấn tuân thủ quy định pháp luật.\n" +
                    "- Đại diện hoặc hỗ trợ tham gia giải quyết tranh chấp kinh tế tại Tòa án và Trọng tài thương mại.");
            fallback.put("requirements", "- Tốt nghiệp Đại học Luật trở lên; ưu tiên có Chứng chỉ hành nghề Luật sư hoặc thẻ Luật sư.\n" +
                    "- Nắm vững Luật Doanh nghiệp, Luật Đầu tư, Luật Thương mại và Luật Lao động.\n" +
                    "- Tư duy pháp lý logic, kỹ năng lập luận, tranh tụng và đàm phán hợp đồng sắc bén.");
            fallback.put("benefits", "- Mức thu nhập 18 – 35 triệu VNĐ / tháng + Thưởng hiệu quả vụ việc / hợp đồng.\n" +
                    "- Môi trường chuyên nghiệp, bảo hiểm sức khỏe VIP và chế độ phúc lợi toàn diện.");
            fallback.put("mandatorySkills", java.util.List.of("Soạn thảo & Đàm phán Hợp đồng Thương mại", "Thẩm định Pháp lý Doanh nghiệp (Due Diligence)", "Tư vấn Pháp luật Doanh nghiệp & Đầu tư"));
            fallback.put("preferredSkills", java.util.List.of("Kỹ năng Tranh tụng tại Tòa & Trọng tài", "Giải quyết Tranh chấp Thương mại (VIAC)", "Quản trị Rủi ro Tuân thủ Pháp lý"));
        } else if (lower.contains("bác sĩ") || lower.contains("dược sĩ") || lower.contains("y tế") || lower.contains("điều dưỡng") || lower.contains("y khoa") || lower.contains("bệnh viện") || lower.contains("phòng khám") || lower.contains("clinical") || lower.contains("doctor") || lower.contains("pharmacist") || lower.contains("nurse")) {
            fallback.put("title", "Bác sĩ Chuyên khoa / Dược sĩ Lâm sàng");
            fallback.put("domain", "Y tế / Dược phẩm / Chăm sóc Sức khỏe");
            fallback.put("description", "- Thăm khám, chẩn đoán lâm sàng và lập phác đồ điều trị an toàn, hiệu quả cho bệnh nhân.\n" +
                    "- Tư vấn sử dụng thuốc hợp lý, theo dõi phản ứng có hại của thuốc (ADR) và tương tác thuốc.\n" +
                    "- Cập nhật hồ sơ bệnh án điện tử trên hệ thống thông tin bệnh viện (HIS/EMR) theo chuẩn Bộ Y tế.");
            fallback.put("requirements", "- Tốt nghiệp Đại học Y Dược; có Chứng chỉ hành nghề khám chữa bệnh hoặc hành nghề Dược hợp lệ.\n" +
                    "- Nắm vững kiến thức chuyên môn, quy trình chuyên môn kỹ thuật và quy chế ngành y tế.\n" +
                    "- Đạo đức nghề nghiệp chuẩn mực (Y đức), thái độ ân cần, tận tâm và giao tiếp tốt với người bệnh.");
            fallback.put("benefits", "- Thu nhập 20 – 45 triệu VNĐ / tháng + Phụ cấp phẫu thuật / thủ thuật / ca trực.\n" +
                    "- Chế độ bảo hiểm sức khỏe cao cấp, bảo hiểm trách nhiệm nghề nghiệp.");
            fallback.put("mandatorySkills", java.util.List.of("Khám Chẩn đoán & Điều trị Lâm sàng", "Dược lý học & Kê đơn Thuốc an toàn", "Bệnh án Điện tử & Hệ thống HIS/EMR"));
            fallback.put("preferredSkills", java.util.List.of("Quy trình Vận hành Tiêu chuẩn Y tế (SOP / GPP / GSP)", "Cấp cứu Hồi sức Cơ bản & Nâng cao (BLS / ACLS)", "Tư vấn Dinh dưỡng & Chăm sóc Người bệnh"));
        } else if (lower.contains("xây dựng") || lower.contains("kiến trúc") || lower.contains("kết cấu") || lower.contains("công trình") || lower.contains("giám sát công trình") || lower.contains("dự toán") || lower.contains("civil engineer") || lower.contains("architect") || lower.contains("cad") || lower.contains("revit") || lower.contains("bim")) {
            fallback.put("title", "Kỹ sư Xây dựng / Kiến trúc sư");
            fallback.put("domain", "Kỹ thuật Xây dựng / Kiến trúc");
            fallback.put("description", "- Lập bản vẽ thiết kế kiến trúc, kết cấu và biện pháp thi công công trình dân dụng / công nghiệp.\n" +
                    "- Bóc tách khối lượng, lập dự toán chi phí xây dựng và kiểm soát hao hụt vật tư trên công trường.\n" +
                    "- Giám sát thi công xây dựng, nghiệm thu chất lượng công việc và đảm bảo an toàn lao động (HSE).");
            fallback.put("requirements", "- Tốt nghiệp Đại học chuyên ngành Xây dựng Dân dụng & Công nghiệp hoặc Kiến trúc.\n" +
                    "- Có chứng chỉ hành nghề Giám sát / Thiết kế xây dựng là lợi thế.\n" +
                    "- Thành thạo AutoCAD, phần mềm tính toán kết cấu (ETABS/SAP2000), mô hình BIM (Revit) và phần mềm dự toán G8.");
            fallback.put("benefits", "- Mức lương 15 – 28 triệu VNĐ / tháng + Phụ cấp công trường, công tác phí và thưởng hoàn thành tiến độ dự án.\n" +
                    "- Chế độ BHXH đầy đủ, bảo hiểm tai nạn công trường 24/7.");
            fallback.put("mandatorySkills", java.util.List.of("AutoCAD", "Mô hình BIM (Revit)", "Bóc tách Khối lượng & Lập Dự toán (G8 / Acitt)"));
            fallback.put("preferredSkills", java.util.List.of("Tính toán Kết cấu Công trình (ETABS / SAP2000)", "Giám sát & Quản lý Chất lượng Công trình (QA/QC)", "An toàn Lao động & Vệ sinh Môi trường (HSE)"));
        } else if (lower.contains("cơ khí") || lower.contains("chế tạo máy") || lower.contains("tự động hóa") || lower.contains("plc") || lower.contains("cnc") || lower.contains("bảo trì") || lower.contains("mechanical") || lower.contains("automation") || lower.contains("solidworks")) {
            fallback.put("title", "Kỹ sư Cơ khí / Kỹ sư Tự động hóa");
            fallback.put("domain", "Kỹ thuật Cơ khí / Chế tạo máy / Tự động hóa");
            fallback.put("description", "- Thiết kế chi tiết cơ khí, khuôn mẫu, đồ gá (Jig) và lập bản vẽ gia công 2D/3D.\n" +
                    "- Lập trình gia công chi tiết trên máy CNC (phay/tiện) hoặc lập trình điều khiển hệ thống tự động hóa PLC/SCADA.\n" +
                    "- Theo dõi quy trình lắp ráp, vận hành chạy thử và bảo trì phòng ngừa hệ thống máy móc sản xuất (TPM).");
            fallback.put("requirements", "- Tốt nghiệp Đại học/Cao đẳng chuyên ngành Cơ khí chế tạo máy, Cơ điện tử hoặc Tự động hóa.\n" +
                    "- Thành thạo phần mềm thiết kế 3D (SolidWorks / Inventor) hoặc phần mềm CAM (Mastercam).\n" +
                    "- Khả năng đọc hiểu bản vẽ kỹ thuật cơ khí, dung sai lắp ghép và hiểu biết về khí nén, thủy lực.");
            fallback.put("benefits", "- Thu nhập 14 – 26 triệu VNĐ / tháng + Phụ cấp độc hại / ca kíp + Thưởng sáng kiến cải tiến kỹ thuật.\n" +
                    "- Môi trường làm việc an toàn, trang bị đầy đủ bảo hộ lao động đạt chuẩn.");
            fallback.put("mandatorySkills", java.util.List.of("Thiết kế Cơ khí 3D (SolidWorks / Inventor)", "Lập trình & Vận hành Máy CNC (Mastercam)", "Lập trình Hệ thống Tự động hóa PLC (Siemens / Mitsubishi)"));
            fallback.put("preferredSkills", java.util.List.of("Bảo trì & Bảo dưỡng Thiết bị Công nghiệp (TPM)", "Đọc Bản vẽ Kỹ thuật & Dung sai Cơ khí (GD&T)", "Hệ thống Khí nén & Thủy lực Công nghiệp"));
        } else if (lower.contains("nhà hàng") || lower.contains("khách sạn") || lower.contains("f&b") || lower.contains("bếp") || lower.contains("đầu bếp") || lower.contains("pha chế") || lower.contains("barista") || lower.contains("phục vụ") || lower.contains("hospitality") || lower.contains("chef") || lower.contains("cook") || lower.contains("lễ tân")) {
            fallback.put("title", "Quản lý Nhà hàng / Khách sạn (F&B / Hospitality)");
            fallback.put("domain", "Nhà hàng / Khách sạn / Dịch vụ Ẩm thực (F&B)");
            fallback.put("description", "- Quản lý và điều hành toàn bộ hoạt động vận hành thường nhật của bộ phận F&B / Nhà hàng / Tiền sảnh.\n" +
                    "- Đảm bảo chất lượng dịch vụ khách hàng, an toàn vệ sinh thực phẩm (HACCP) và quy chuẩn dịch vụ 5 sao.\n" +
                    "- Kiểm soát định lượng món ăn, chi phí nguyên vật liệu (Food Cost) và quản lý nhân sự ca kíp.");
            fallback.put("requirements", "- Tốt nghiệp Trung cấp/Cao đẳng/Đại học chuyên ngành Quản trị Nhà hàng - Khách sạn hoặc Ẩm thực.\n" +
                    "- Có chứng chỉ Vệ sinh An toàn Thực phẩm; ưu tiên chứng chỉ pha chế SCA hoặc kỹ thuật chế biến món ăn.\n" +
                    "- Kỹ năng giao tiếp, xử lý phàn nàn của khách hàng (Complaint Handling) và quản lý đội ngũ hiệu quả.");
            fallback.put("benefits", "- Thu nhập 12 – 25 triệu VNĐ / tháng + Tip/Service Charge hàng tháng + Phụ cấp ăn ca.\n" +
                    "- Làm việc trong môi trường dịch vụ chuyên nghiệp, năng động, nhiều cơ hội giao lưu quốc tế.");
            fallback.put("mandatorySkills", java.util.List.of("Tiêu chuẩn An toàn Vệ sinh Thực phẩm (HACCP)", "Nghiệp vụ Quản trị Nhà hàng - Khách sạn", "Quản trị Chi phí Thực phẩm & Đồ uống (F&B Cost Control)"));
            fallback.put("preferredSkills", java.util.List.of("Phần mềm Quản lý Khách sạn (Opera PMS)", "Nghiệp vụ Pha chế Chuyên nghiệp (Barista / Bartender)", "Nghệ thuật Ẩm thực & Chế biến Món ăn (Culinary Arts)"));
        } else if (lower.contains("logistics") || lower.contains("xuất nhập khẩu") || lower.contains("chuỗi cung ứng") || lower.contains("kho vận") || lower.contains("hải quan") || lower.contains("giao nhận") || lower.contains("supply chain") || lower.contains("import") || lower.contains("export") || lower.contains("forwarder")) {
            fallback.put("title", "Chuyên viên Logistics & Xuất nhập khẩu");
            fallback.put("domain", "Logistics / Xuất nhập khẩu / Chuỗi cung ứng");
            fallback.put("description", "- Tiếp nhận đơn hàng, liên hệ hãng tàu/hãng hàng không (Forwarder/Carrier) để lấy cước và book chỗ vận chuyển.\n" +
                    "- Lập bộ chứng từ xuất nhập khẩu (Invoice, Packing List, B/L, C/O) và truyền tờ khai hải quan trên hệ thống VNACCS/VCIS.\n" +
                    "- Theo dõi lịch trình giao nhận hàng hóa, giải quyết các sự cố phát sinh tại cảng/kho và tối ưu chi phí vận tải.");
            fallback.put("requirements", "- Tốt nghiệp Cao đẳng/Đại học chuyên ngành Kinh tế đối ngoại, Logistics & Chuỗi cung ứng hoặc Thương mại quốc tế.\n" +
                    "- Thành thạo nghiệp vụ ngoại thương, nắm vững điều kiện giao hàng Incoterms 2020 và quy trình thủ tục hải quan.\n" +
                    "- Tiếng Anh thương mại tốt (đọc hiểu chứng từ và trao đổi email với đối tác quốc tế).");
            fallback.put("benefits", "- Thu nhập 12 – 22 triệu VNĐ / tháng + Thưởng quý/năm theo chỉ số KPI giao nhận.\n" +
                    "- Chế độ bảo hiểm, phụ cấp ăn trưa và môi trường làm việc toàn cầu.");
            fallback.put("mandatorySkills", java.util.List.of("Nghiệp vụ Xuất nhập khẩu & Bộ chứng từ (C/O, B/L)", "Khai báo Hải quan Điện tử (VNACCS / VCIS)", "Điều kiện Giao nhận Vận tải Quốc tế (Incoterms 2020)"));
            fallback.put("preferredSkills", java.util.List.of("Quản trị Kho bãi & Hàng tồn kho (WMS / Inventory Control)", "Quản lý Vận tải & Chuỗi cung ứng (TMS)", "Tiếng Anh Thương mại Quốc tế"));
        } else if (lower.contains("cskh") || lower.contains("chăm sóc khách hàng") || lower.contains("tổng đài") || lower.contains("call center") || lower.contains("customer care") || lower.contains("customer service")) {
            fallback.put("title", "Chuyên viên Chăm sóc Khách hàng (CSKH / Call Center)");
            fallback.put("domain", "Chăm sóc Khách hàng / Dịch vụ Hỗ trợ");
            fallback.put("description", "- Tiếp nhận cuộc gọi, tin nhắn, email từ khách hàng qua hệ thống tổng đài và các kênh đa kênh (Omnichannel).\n" +
                    "- Giải đáp thắc mắc, hướng dẫn sử dụng sản phẩm/dịch vụ và hỗ trợ xử lý sự cố phát sinh của khách hàng.\n" +
                    "- Ghi nhận phản hồi, phân loại yêu cầu và phối hợp với các phòng ban chuyên môn để giải quyết khiếu nại thỏa đáng.");
            fallback.put("requirements", "- Giọng nói chuẩn, phát âm rõ ràng, không nói ngọng hoặc nói giọng địa phương quá nặng.\n" +
                    "- Kỹ năng lắng nghe thấu cảm, kiên nhẫn, điềm tĩnh và giao tiếp khéo léo trong các tình huống căng thẳng.\n" +
                    "- Sử dụng thành thạo máy tính, tốc độ gõ phím tốt và hiểu biết về phần mềm CRM / Call Center.");
            fallback.put("benefits", "- Thu nhập 8 – 16 triệu VNĐ / tháng (Lương cứng + Thưởng KPI chất lượng cuộc gọi CSAT).\n" +
                    "- Môi trường làm việc hiện đại, phụ cấp ca kíp, thưởng lễ tết đầy đủ.");
            fallback.put("mandatorySkills", java.util.List.of("Chăm sóc & Phục vụ Khách hàng Chuyên nghiệp", "Xử lý Khiếu nại & Khủng hoảng Dịch vụ", "Kỹ năng Giao tiếp & Thuyết phục qua Điện thoại"));
            fallback.put("preferredSkills", java.util.List.of("Hệ thống CRM & Tổng đài Đa kênh (Omnichannel)", "Quản trị Trải nghiệm Khách hàng (CX / CSAT)", "Đánh máy & Soạn thảo Văn bản Nhanh"));
        } else if (lower.contains("bất động sản") || lower.contains("bđs") || lower.contains("nhà đất") || lower.contains("môi giới bất động sản") || lower.contains("real estate") || lower.contains("property")) {
            fallback.put("title", "Chuyên viên Tư vấn & Môi giới Bất động sản");
            fallback.put("domain", "Bất động sản / Môi giới & Quản lý Dự án BĐS");
            fallback.put("description", "- Tìm kiếm, khai thác danh sách khách hàng tiềm năng có nhu cầu đầu tư hoặc an cư tại các dự án bất động sản.\n" +
                    "- Tư vấn thông tin quy hoạch, vị trí, tiện ích, chính sách bán hàng và phân tích bài toán tài chính sinh lời.\n" +
                    "- Hướng dẫn khách hàng tham quan dự án/nhà mẫu, hỗ trợ hoàn thiện thủ tục đặt cọc và ký kết hợp đồng mua bán.");
            fallback.put("requirements", "- Đam mê kinh doanh, chịu được áp lực doanh số và tác phong chuyên nghiệp, lịch thiệp.\n" +
                    "- Nắm vững kiến thức thị trường bất động sản, quy trình pháp lý nhà đất và kỹ năng đàm phán chốt giao dịch.\n" +
                    "- Kỹ năng mở rộng mạng lưới quan hệ và khả năng tự tạo nguồn khách hàng qua digital marketing là lợi thế.");
            fallback.put("benefits", "- Lương cứng hỗ trợ 6 – 12 triệu/tháng + Hoa hồng giao dịch cao bậc nhất thị trường (Thu nhập không giới hạn từ 30 – 100+ triệu/tháng).\n" +
                    "- Đào tạo nghiệp vụ bất động sản bài bản từ cơ bản đến nâng cao.");
            fallback.put("mandatorySkills", java.util.List.of("Tư vấn & Môi giới Bất động sản", "Thẩm định Giá & Pháp lý Bất động sản", "Kỹ năng Đàm phán & Chốt Giao dịch BĐS"));
            fallback.put("preferredSkills", java.util.List.of("Quản lý Vận hành Tòa nhà (BMS / Property Management)", "Marketing Bất động sản (Digital Ads / Telesales)", "Luật Đất đai & Luật Kinh doanh Bất động sản"));
        } else if (lower.contains("java") || lower.contains("backend") || lower.contains("back-end") || lower.contains("spring") || lower.contains("lập trình") || lower.contains("software") || lower.contains("developer") || lower.contains("kỹ sư phần mềm") || lower.contains("it") || lower.contains("cntt")) {
            fallback.put("title", "Backend Developer");
            fallback.put("domain", "Công nghệ thông tin / Phát triển Backend");
            fallback.put("description", "- Thiết kế, xây dựng các dịch vụ RESTful API và module chịu tải lớn, đảm bảo tính sẵn sàng cao (High Availability).\n" +
                    "- Tối ưu hóa cơ sở dữ liệu quan hệ và phân tán, thiết lập giải pháp bộ nhớ đệm và xử lý luồng nghiệp vụ mượt mà.\n" +
                    "- Phối hợp chặt chẽ cùng Technical Lead, Solution Architect và Product Owner trong mô hình Agile/Scrum.\n" +
                    "- Thực hiện Code Review, viết Unit Test & Integration Test, bảo đảm chất lượng mã nguồn.");
            fallback.put("requirements", "- Kinh nghiệm làm việc với Java (Spring Boot) hoặc Node.js / Python / Golang.\n" +
                    "- Nắm vững cơ sở dữ liệu quan hệ (PostgreSQL / MySQL) và NoSQL (MongoDB / Redis).\n" +
                    "- Hiểu biết về kiến trúc Microservices, Docker và Docker Compose.\n" +
                    "- Tư duy giải quyết vấn đề tốt và tinh thần trách nhiệm cao.");
            fallback.put("benefits", "- Mức thu nhập cạnh tranh từ 25 – 45 triệu VNĐ/tháng (Gross/Net + Thưởng dự án).\n" +
                    "- Bảo hiểm sức khỏe VIP toàn diện, đầy đủ BHXH/BHYT theo quy định.\n" +
                    "- Cung cấp trang thiết bị hiện đại (Laptop chuyên dụng và màn hình phụ).\n" +
                    "- 15 ngày phép năm có lương, hoạt động du lịch dã ngoại và teambuilding định kỳ hàng năm.");
            fallback.put("mandatorySkills", java.util.List.of("Java 21", "Spring Boot 3", "PostgreSQL"));
            fallback.put("preferredSkills", java.util.List.of("Docker", "Microservices", "Redis"));
        } else {
            fallback.put("title", "Chuyên viên Quản trị & Vận hành Doanh nghiệp");
            fallback.put("domain", "Quản trị Kinh doanh / Vận hành Doanh nghiệp");
            fallback.put("description", "- Theo dõi, giám sát tiến độ thực hiện kế hoạch kinh doanh và chỉ tiêu vận hành của các phòng ban.\n" +
                    "- Tối ưu hóa quy trình làm việc nội bộ (Standard Operating Procedures), loại bỏ các điểm nghẽn vận hành.\n" +
                    "- Tổng hợp số liệu, lập báo cáo phân tích hiệu suất định kỳ (KPI/OKR) phục vụ ban lãnh đạo ra quyết định.");
            fallback.put("requirements", "- Tốt nghiệp Đại học chuyên ngành Quản trị Kinh doanh, Kinh tế hoặc Ngoại thương.\n" +
                    "- Kỹ năng phân tích số liệu, tư duy tổ chức logic và khả năng điều phối liên phòng ban nhịp nhàng.\n" +
                    "- Thành thạo các công cụ tin học văn phòng, phần mềm quản lý dự án (Jira, Trello, Notion, Asana).");
            fallback.put("benefits", "- Mức lương 14 – 25 triệu VNĐ / tháng + Thưởng hiệu quả vận hành doanh nghiệp.\n" +
                    "- Lộ trình phát triển rõ ràng lên Quản lý vận hành (Operations Manager) hoặc Trợ lý Tổng Giám đốc.");
            fallback.put("mandatorySkills", java.util.List.of("Quản trị Vận hành Doanh nghiệp", "Tối ưu hóa Quy trình Hoạt động (SOP)", "Phân tích Dữ liệu Kinh doanh & Báo cáo KPI"));
            fallback.put("preferredSkills", java.util.List.of("Quản lý Dự án (Agile / Scrum / PMP)", "Hệ thống Quản trị Doanh nghiệp (ERP / CRM)", "Kỹ năng Đàm phán & Điều phối Liên phòng ban"));
        }

        // Tự động trích xuất thông tin thực tế từ rawText nếu có để không bị gắn cứng dữ liệu mặc định
        if (rawText != null && !rawText.isBlank()) {
            String[] lines = rawText.split("\\r?\\n");
            for (String l : lines) {
                String clean = l.replaceAll("^[#*\\-•\\s]+", "").trim();
                if (clean.length() >= 5 && clean.length() <= 80 
                        && !clean.toLowerCase().contains("mô tả") 
                        && !clean.toLowerCase().contains("yêu cầu") 
                        && !clean.toLowerCase().contains("quyền lợi")) {
                    fallback.put("title", clean);
                    break;
                }
            }
            if (lower.contains("hồ chí minh") || lower.contains("hcm") || lower.contains("tp.hcm") || lower.contains("sài gòn")) {
                fallback.put("location", "TP. Hồ Chí Minh");
            } else if (lower.contains("đà nẵng")) {
                fallback.put("location", "Đà Nẵng");
            } else if (lower.contains("hà nội")) {
                fallback.put("location", "Hà Nội");
            } else if (lower.contains("remote") || lower.contains("từ xa")) {
                fallback.put("location", "Làm việc từ xa (Remote)");
            }

            // Gọi skillService.extractSkillsFromJd để tự động bóc tách kỹ năng theo heuristic đa ngành thay vì hardcode
            if (skillService != null) {
                try {
                    String candidateTitle = fallback.get("title") != null ? fallback.get("title").toString() : "Vị trí Tuyển Dụng";
                    com.hiremate.dto.request.AiJdSkillExtractRequest extractReq = com.hiremate.dto.request.AiJdSkillExtractRequest.builder()
                            .title(candidateTitle)
                            .description(rawText)
                            .industry(fallback.get("domain") != null ? fallback.get("domain").toString() : null)
                            .build();
                    com.hiremate.dto.response.AiJdSkillExtractResponse autoExtracted = skillService.extractSkillsFromJd(extractReq);
                    if (autoExtracted != null) {
                        List<String> mList = new ArrayList<>();
                        List<String> pList = new ArrayList<>();
                        if (autoExtracted.getMandatorySkills() != null) {
                            for (var it : autoExtracted.getMandatorySkills()) {
                                if (it.getSkillName() != null && !mList.contains(it.getSkillName())) {
                                    mList.add(it.getSkillName());
                                }
                            }
                        }
                        if (autoExtracted.getPreferredSkills() != null) {
                            for (var it : autoExtracted.getPreferredSkills()) {
                                if (it.getSkillName() != null && !mList.contains(it.getSkillName()) && !pList.contains(it.getSkillName())) {
                                    pList.add(it.getSkillName());
                                }
                            }
                        }
                        if (!mList.isEmpty()) fallback.put("mandatorySkills", mList);
                        if (!pList.isEmpty()) fallback.put("preferredSkills", pList);
                    }
                } catch (Exception ex) {
                    log.warn(">> [JobService] Fallback skill extraction via skillService warning: {}", ex.getMessage());
                }
            }
        }

        return fallback;
    }
}

