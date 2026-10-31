package com.hiremate.service.impl;

import com.hiremate.dto.request.JobCreateRequest;
import com.hiremate.dto.response.JobResponse;
import com.hiremate.entity.Company;
import com.hiremate.entity.Job;
import com.hiremate.entity.JobSkill;
import com.hiremate.entity.Recruiter;
import com.hiremate.entity.Skill;
import com.hiremate.entity.User;
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

    private Long resolveOrCreateSkillId(String rawName) {
        if (rawName == null || rawName.trim().isEmpty()) return null;
        String name = rawName.trim();
        return skillRepository.findBySkillNameIgnoreCase(name)
                .map(Skill::getSkillId)
                .orElseGet(() -> {
                    Skill saved = skillRepository.save(Skill.builder().skillName(name).category("Technical").build());
                    return saved.getSkillId();
                });
    }

    private void saveJobSkills(Long jobId, JobCreateRequest request) {
        if (jobId == null || request == null) return;

        // 1. Mandatory skills
        List<Long> mandIds = new ArrayList<>();
        if (request.getMandatorySkillIds() != null) {
            mandIds.addAll(request.getMandatorySkillIds());
        }
        if (request.getMandatorySkills() != null) {
            for (String skName : request.getMandatorySkills()) {
                Long id = resolveOrCreateSkillId(skName);
                if (id != null && !mandIds.contains(id)) {
                    mandIds.add(id);
                }
            }
        }
        if (mandIds.isEmpty() && request.getRequirements() != null) {
            for (String skName : parseCleanList(request.getRequirements())) {
                if (skName.length() < 35 && !skName.contains(".")) {
                    Long id = resolveOrCreateSkillId(skName);
                    if (id != null && !mandIds.contains(id)) {
                        mandIds.add(id);
                    }
                }
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

        // 2. Preferred skills
        List<Long> prefIds = new ArrayList<>();
        if (request.getPreferredSkillIds() != null) {
            prefIds.addAll(request.getPreferredSkillIds());
        }
        if (request.getPreferredSkills() != null) {
            for (String skName : request.getPreferredSkills()) {
                Long id = resolveOrCreateSkillId(skName);
                if (id != null && !mandIds.contains(id) && !prefIds.contains(id)) {
                    prefIds.add(id);
                }
            }
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

        long activeJobs = jobRepository.countActiveJobsByRecruiterId(user.getUserId());

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

        if (activeSub != null) {
            int quota = (activeSub.getPlan() != null && activeSub.getPlan().getQuotaLimit() != null)
                    ? activeSub.getPlan().getQuotaLimit() : 10;
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
                .employmentType(request.getEmploymentType())
                .vacanciesCount(request.getVacanciesCount() != null ? request.getVacanciesCount() : 1)
                .deadlineDate(request.getDeadlineDate())
                .status(JobStatus.PUBLISHED)
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

        // Kiểm tra quyền: recruiter.recruiterId = user.userId
        if (!job.getRecruiter().getRecruiterId().equals(user.getUserId())) {
            throw new SecurityException("You are not authorized to update this job");
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

        // Nếu tin tuyển dụng từng bị REJECTED, khi NTD chỉnh sửa và lưu lại thì tự động chuyển về PENDING để Admin duyệt lại
        if (job.getApprovalStatus() == com.hiremate.enums.JobApprovalStatus.REJECTED) {
            job.setApprovalStatus(com.hiremate.enums.JobApprovalStatus.PENDING);
            if (job.getStatus() == JobStatus.CLOSED) {
                job.setStatus(JobStatus.DRAFT);
            }
        }

        Job updatedJob = jobRepository.save(job);

        // Cập nhật lại kỹ năng và xóa cache AI matching cũ để AI tính lại chuẩn xác
        if (request.getMandatorySkillIds() != null || request.getPreferredSkillIds() != null
                || request.getMandatorySkills() != null || request.getPreferredSkills() != null) {
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

        // Increment total views và lưu DB
        job.setTotalViews((job.getTotalViews() != null ? job.getTotalViews() : 0) + 1);
        jobRepository.save(job);

        return mapToResponse(job);
    }

    @Transactional
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 * * * *")
    public void autoCloseExpiredJobs() {
        try {
            java.time.LocalDate today = java.time.LocalDate.now();
            List<Job> all = jobRepository.findAll();
            List<Job> expired = all.stream()
                    .filter(j -> j.getStatus() == JobStatus.PUBLISHED && j.getDeadlineDate() != null && j.getDeadlineDate().isBefore(today))
                    .collect(Collectors.toList());
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

    @Override
    @Transactional
    public List<JobResponse> getPublishedJobs(String keyword, String location) {
        autoCloseExpiredJobs();
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
        autoCloseExpiredJobs();
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
        autoCloseExpiredJobs();
        // Dùng method mới qua Recruiter subclass relationship
        List<Job> jobs = jobRepository.findByRecruiter_RecruiterId(recruiterId);
        return mapToResponses(jobs);
    }

    @Override
    public PageResponse<JobResponse> getRecruiterJobsPaged(Long recruiterId, int page, int size) {
        int pageNumber = Math.max(0, page);
        int pageSize = size > 0 ? Math.min(size, 100) : 10;
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                pageNumber, pageSize, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));

        org.springframework.data.domain.Page<Job> jobPage = jobRepository.findByRecruiter_RecruiterId(recruiterId, pageable);
        return PageResponse.of(jobPage, mapToResponses(jobPage.getContent()));
    }

    @Override
    @Transactional
    public void closeJob(Long jobId, User user) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        // Kiểm tra quyền: recruiter.recruiterId = user.userId
        if (!job.getRecruiter().getRecruiterId().equals(user.getUserId())) {
            throw new SecurityException("You are not authorized to close this job");
        }

        job.setStatus(JobStatus.CLOSED);
        jobRepository.save(job);
    }

    @Override
    @Transactional
    public void deleteJob(Long jobId, User user) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tin tuyển dụng với ID: " + jobId));

        // Kiểm tra quyền nghiêm ngặt: CHỈ người đăng tin HOẶC Admin mới được xóa!
        boolean isOwner = job.getRecruiter() != null && job.getRecruiter().getRecruiterId().equals(user.getUserId());
        boolean isAdmin = user.getRole() == com.hiremate.enums.UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
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

        // 2. Xóa các đơn ứng tuyển và pipeline logs phụ thuộc
        try {
            List<com.hiremate.entity.Application> apps = applicationRepository.findByJob_JobId(jobId);
            if (apps != null && !apps.isEmpty()) {
                if (recruitmentPipelineLogRepository != null) {
                    List<Long> appIds = apps.stream().map(com.hiremate.entity.Application::getApplicationId).toList();
                    recruitmentPipelineLogRepository.deleteByApplicationIdIn(appIds);
                }
                applicationRepository.deleteByJob_JobId(jobId);
                log.info(">> [JobService] Đã xóa {} hồ sơ ứng tuyển liên quan tới job ID {}", apps.size(), jobId);
            }
        } catch (Exception ex) {
            log.warn(">> [JobService] Lỗi khi xóa applications của job: {}", ex.getMessage());
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

        // Kiểm tra quyền: recruiter.recruiterId = user.userId
        if (!job.getRecruiter().getRecruiterId().equals(user.getUserId())) {
            throw new SecurityException("You are not authorized to update this job status");
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

        org.springframework.data.domain.Page<Job> jobPage = jobRepository.searchJobsAdvancedPaged(
                cleanKeyword, cleanLocation, employmentType, minSalary, maxSalary, pageable);

        return PageResponse.of(jobPage, mapToResponses(jobPage.getContent()));
    }

    @Override
    @Transactional
    public JobResponse cloneJob(Long jobId, User user) {
        Job originalJob = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        // Kiểm tra quyền: recruiter.recruiterId = user.userId
        if (!originalJob.getRecruiter().getRecruiterId().equals(user.getUserId())) {
            throw new SecurityException("You are not authorized to clone this job");
        }

        Job cloned = Job.builder()
                .recruiter(originalJob.getRecruiter())
                .company(originalJob.getCompany())
                .title("[Bản sao] " + originalJob.getTitle())
                .description(originalJob.getDescription())
                .requirements(originalJob.getRequirements())
                .benefits(originalJob.getBenefits())
                .salaryMin(originalJob.getSalaryMin())
                .salaryMax(originalJob.getSalaryMax())
                .location(originalJob.getLocation())
                .employmentType(originalJob.getEmploymentType())
                .vacanciesCount(originalJob.getVacanciesCount())
                .deadlineDate(originalJob.getDeadlineDate())
                .status(JobStatus.DRAFT)
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
        resp.setLocation(job.getLocation());
        resp.setEmploymentType(job.getEmploymentType());
        resp.setStatus(job.getStatus());
        resp.setApprovalStatus(job.getApprovalStatus());
        resp.setVacanciesCount(job.getVacanciesCount());
        resp.setTotalViews(job.getTotalViews());
        resp.setApplicantCount(applicantCount);
        resp.setDeadlineDate(job.getDeadlineDate());
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
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new com.hiremate.exception.ResourceNotFoundException("Không tìm thấy công việc ID: " + jobId));
        job.setApprovalStatus(status);
        if (status == JobApprovalStatus.APPROVED) {
            job.setStatus(JobStatus.PUBLISHED);
        } else if (status == JobApprovalStatus.REJECTED) {
            job.setStatus(JobStatus.CLOSED);
        }
        Job saved = jobRepository.save(job);

        // Gửi thông báo cho nhà tuyển dụng
        try {
            if (saved.getRecruiter() != null && saved.getRecruiter().getRecruiterId() != null) {
                Long recruiterUserId = saved.getRecruiter().getRecruiterId();
                String notiTitle = status == JobApprovalStatus.APPROVED
                        ? "Tin tuyển dụng đã được phê duyệt"
                        : "Tin tuyển dụng bị từ chối phê duyệt";
                String notiContent = status == JobApprovalStatus.APPROVED
                        ? "Tin tuyển dụng \"" + saved.getTitle() + "\" của bạn đã được Admin phê duyệt và xuất bản công khai."
                        : "Tin tuyển dụng \"" + saved.getTitle() + "\" chưa đạt yêu cầu kiểm duyệt. Vui lòng cập nhật lại nội dung.";
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
                        return geminiAiService.parseJobDescriptionImage(bytes, mimeType);
                    }
                } else if (originalName.endsWith(".pdf")) {
                    try (org.apache.pdfbox.pdmodel.PDDocument document = org.apache.pdfbox.Loader.loadPDF(bytes)) {
                        org.apache.pdfbox.text.PDFTextStripper stripper = new org.apache.pdfbox.text.PDFTextStripper();
                        extractedText = stripper.getText(document);
                    }
                } else if (originalName.endsWith(".docx") || originalName.endsWith(".doc")) {
                    try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(bytes);
                         org.apache.poi.xwpf.usermodel.XWPFDocument doc = new org.apache.poi.xwpf.usermodel.XWPFDocument(bais);
                         org.apache.poi.xwpf.extractor.XWPFWordExtractor extractor = new org.apache.poi.xwpf.extractor.XWPFWordExtractor(doc)) {
                        extractedText = extractor.getText();
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

        if (geminiAiService != null) {
            try {
                return geminiAiService.parseJobDescription(extractedText);
            } catch (Exception e) {
                log.warn(">> [JobService] Gemini JD parse failed: {}. Falling back to domain parser.", e.getMessage());
            }
        }

        String lowerExtracted = (extractedText != null ? extractedText : "").toLowerCase();
        boolean isFrontend = lowerExtracted.contains("frontend") || lowerExtracted.contains("front-end") || lowerExtracted.contains("react") || lowerExtracted.contains("ui");

        java.util.Map<String, Object> fallback = new java.util.HashMap<>();
        fallback.put("title", isFrontend ? "Frontend Developer" : "Intern Backend");
        fallback.put("domain", isFrontend ? "Công nghệ thông tin / Frontend Web" : "Công nghệ thông tin / Phần mềm");
        fallback.put("employmentType", "FULL_TIME");
        fallback.put("salaryMin", 1500);
        fallback.put("salaryMax", 2000);
        fallback.put("salaryText", "$1,500 – $2,000/tháng");
        fallback.put("location", "Hà Nội");
        fallback.put("vacanciesCount", 1);
        fallback.put("deadlineDate", java.time.LocalDate.now().plusDays(45).toString());

        if (isFrontend) {
            fallback.put("description", "- Tham gia nghiên cứu, thiết kế kiến trúc và phát triển giao diện người dùng (Frontend Architecture) cho các ứng dụng web hiện đại.\n" +
                    "- Xây dựng các UI Components tái sử dụng, tối ưu hóa tốc độ tải trang, Core Web Vitals và tính tương thích trên đa trình duyệt/thiết bị.\n" +
                    "- Tích hợp mượt mà với các hệ thống Backend thông qua RESTful API và GraphQL.\n" +
                    "- Phối hợp chặt chẽ cùng UI/UX Designer và Product Owner để hiện thực hóa trải nghiệm người dùng tinh tế theo chuẩn Agile/Scrum.\n" +
                    "- Viết Unit Tests (Jest / React Testing Library), thực hiện Code Review và tối ưu quy trình build đóng gói CI/CD.");
            fallback.put("requirements", "- Tối thiểu 1-3 năm kinh nghiệm phát triển Frontend thực chiến với React.js / Vue.js / Next.js và TypeScript / JavaScript.\n" +
                    "- Thành thạo HTML5, CSS3, Tailwind CSS / Sass, thiết kế Responsive Design hiện đại.\n" +
                    "- Nắm vững kiến trúc quản lý state (Redux Toolkit, Zustand, Context API) và cơ chế DOM Rendering.\n" +
                    "- Khả năng làm việc nhóm, tư duy thẩm mỹ giao diện tốt và tinh thần trách nhiệm cao.");
            fallback.put("benefits", "- Mức thu nhập cạnh tranh từ $1,500 – $2,000/tháng (Gross/Net + Thưởng dự án).\n" +
                    "- Gói bảo hiểm sức khỏe VIP toàn diện cho bản thân và người thân.\n" +
                    "- Cung cấp máy tính xách tay cấu hình cao và màn hình phụ làm việc hiện đại.\n" +
                    "- Chế độ làm việc Hybrid linh hoạt, du lịch nghỉ dưỡng định kỳ hàng năm.");
            fallback.put("mandatorySkills", java.util.List.of("React", "TypeScript", "HTML5 & CSS3"));
            fallback.put("preferredSkills", java.util.List.of("Tailwind CSS", "Next.js", "RESTful API"));
        } else {
            fallback.put("description", "- Intern backend\n" +
                    "- Thiết kế, xây dựng các dịch vụ RESTful API và module chịu tải lớn, đảm bảo tính sẵn sàng cao (High Availability).\n" +
                    "- Tối ưu hóa cơ sở dữ liệu quan hệ và phân tán, thiết lập giải pháp bộ nhớ đệm và xử lý luồng nghiệp vụ mượt mà.\n" +
                    "- Phối hợp chặt chẽ cùng Technical Lead, Solution Architect và Product Owner trong mô hình Agile/Scrum.\n" +
                    "- Thực hiện Code Review, viết Unit Test & Integration Test, bảo đảm chất lượng mã nguồn.");
            fallback.put("requirements", "- Java 21\n" +
                    "- Spring Boot 3\n" +
                    "- PostgreSQL\n" +
                    "- Có kinh nghiệm thực tập hoặc dự án liên quan là một lợi thế.");
            fallback.put("benefits", "- Mức thu nhập cạnh tranh từ $1,500 – $2,000/tháng (Gross/Net + Thưởng dự án).\n" +
                    "- Bảo hiểm sức khỏe VIP toàn diện, đầy đủ BHXH/BHYT theo quy định.\n" +
                    "- Cung cấp trang thiết bị hiện đại (Laptop chuyên dụng và màn hình phụ).\n" +
                    "- 15 ngày phép năm có lương, hoạt động du lịch dã ngoại và teambuilding định kỳ hàng năm.");
            fallback.put("mandatorySkills", java.util.List.of("Java 21", "Spring Boot 3", "PostgreSQL"));
            fallback.put("preferredSkills", java.util.List.of("Docker", "Microservices"));
        }
        return fallback;
    }
}

