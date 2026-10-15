package com.hiremate.service.impl;

import com.hiremate.dto.request.JobCreateRequest;
import com.hiremate.dto.response.JobResponse;
import com.hiremate.entity.Company;
import com.hiremate.entity.Job;
import com.hiremate.entity.JobSkill;
import com.hiremate.entity.Recruiter;
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
import java.util.ArrayList;
import java.util.List;
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

    @Override
    @Transactional
    public JobResponse createJob(JobCreateRequest request, User user) {
        // Lấy Recruiter subclass – recruiter_id = user_id (Shared PK)
        Recruiter recruiter = recruiterRepository.findById(user.getUserId())
                .orElseThrow(() -> new IllegalStateException(
                        "Recruiter profile not found for user: " + user.getUserId()));

        // Lấy company của recruiter qua Recruiter.company
        Company company = recruiter.getCompany();

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
                .approvalStatus(JobApprovalStatus.PENDING)
                .build();

        Job savedJob = jobRepository.save(job);

        // Lưu mandatory skills (weight = 1.0 = 70% của matching formula)
        if (request.getMandatorySkillIds() != null) {
            for (Long skillId : request.getMandatorySkillIds()) {
                jobSkillRepository.save(JobSkill.builder()
                        .jobId(savedJob.getJobId())
                        .skillId(skillId)
                        .importance(SkillImportance.MANDATORY)
                        .weight(1.0f)
                        .build());
            }
        }

        // Lưu preferred skills (weight = 0.5 = 30% của matching formula)
        if (request.getPreferredSkillIds() != null) {
            for (Long skillId : request.getPreferredSkillIds()) {
                jobSkillRepository.save(JobSkill.builder()
                        .jobId(savedJob.getJobId())
                        .skillId(skillId)
                        .importance(SkillImportance.PREFERRED)
                        .weight(0.5f)
                        .build());
            }
        }

        // Gửi thông báo hệ thống cho nhà tuyển dụng
        notificationService.createNotification(
                user.getUserId(),
                com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                "Đăng tin tuyển dụng thành công!",
                "Tin tuyển dụng \"" + savedJob.getTitle() + "\" đã được đăng tải và sẵn sàng đón nhận hồ sơ ứng viên.",
                savedJob.getJobId(),
                "jobs"
        );

        return mapToResponse(savedJob);
    }

    @Override
    @Transactional
    public JobResponse updateJob(Long jobId, JobCreateRequest request, User user) {
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

        Job updatedJob = jobRepository.save(job);

        // Update skills if provided
        if (request.getMandatorySkillIds() != null || request.getPreferredSkillIds() != null) {
            jobSkillRepository.deleteByJobId(jobId);
            if (request.getMandatorySkillIds() != null) {
                for (Long skillId : request.getMandatorySkillIds()) {
                    jobSkillRepository.save(JobSkill.builder()
                            .jobId(jobId)
                            .skillId(skillId)
                            .importance(SkillImportance.MANDATORY)
                            .weight(1.0f)
                            .build());
                }
            }
            if (request.getPreferredSkillIds() != null) {
                for (Long skillId : request.getPreferredSkillIds()) {
                    jobSkillRepository.save(JobSkill.builder()
                            .jobId(jobId)
                            .skillId(skillId)
                            .importance(SkillImportance.PREFERRED)
                            .weight(0.5f)
                            .build());
                }
            }
        }

        return mapToResponse(updatedJob);
    }

    @Override
    public JobResponse getJobById(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        // Increment total views
        job.setTotalViews(job.getTotalViews() + 1);
        jobRepository.save(job);

        return mapToResponse(job);
    }

    @Override
    public List<JobResponse> getPublishedJobs(String keyword, String location) {
        List<Job> jobs;
        boolean hasKeyword = keyword != null && !keyword.trim().isEmpty();
        boolean hasLocation = location != null && !location.trim().isEmpty();

        if (!hasKeyword && !hasLocation) {
            jobs = jobRepository.findByStatus(JobStatus.PUBLISHED);
        } else {
            jobs = jobRepository.searchJobs(hasKeyword ? keyword.trim() : null, hasLocation ? location.trim() : null);
        }

        List<JobResponse> responses = new ArrayList<>();
        for (Job job : jobs) {
            responses.add(mapToResponse(job));
        }
        return responses;
    }

    @Override
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

        List<JobResponse> mapped = jobPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PageResponse.of(jobPage, mapped);
    }

    @Override
    public List<JobResponse> getRecruiterJobs(Long recruiterId) {
        // Dùng method mới qua Recruiter subclass relationship
        List<Job> jobs = jobRepository.findByRecruiter_RecruiterId(recruiterId);
        List<JobResponse> responses = new ArrayList<>();
        for (Job job : jobs) {
            responses.add(mapToResponse(job));
        }
        return responses;
    }

    @Override
    public PageResponse<JobResponse> getRecruiterJobsPaged(Long recruiterId, int page, int size) {
        int pageNumber = Math.max(0, page);
        int pageSize = size > 0 ? Math.min(size, 100) : 10;
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                pageNumber, pageSize, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));

        org.springframework.data.domain.Page<Job> jobPage = jobRepository.findByRecruiter_RecruiterId(recruiterId, pageable);
        List<JobResponse> mapped = jobPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PageResponse.of(jobPage, mapped);
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

        List<JobResponse> mapped = jobPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PageResponse.of(jobPage, mapped);
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

    /**
     * Map Job entity -> JobResponse DTO.
     * Truy xuất companyId và recruiterId qua object navigation.
     */
    private JobResponse mapToResponse(Job job) {
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

        // Load skills list for this job
        List<String> skillNames = new ArrayList<>();
        try {
            List<JobSkill> jobSkills = jobSkillRepository.findByJobId(job.getJobId());
            for (JobSkill js : jobSkills) {
                if (js.getSkillId() != null) {
                    skillRepository.findById(js.getSkillId())
                            .ifPresent(s -> skillNames.add(s.getSkillName()));
                }
            }
        } catch (Exception ignored) {}

        return JobResponse.builder()
                .jobId(job.getJobId())
                // Truy xuất qua Recruiter subclass (Shared PK: recruiterId = userId)
                .recruiterId(recruiter != null ? recruiter.getRecruiterId() : null)
                .recruiterName(recruiterUser != null ? recruiterUser.getFullName() : null)
                .recruiterEmail(recruiterUser != null ? recruiterUser.getEmail() : null)
                .recruiterPhone(recruiterUser != null ? recruiterUser.getPhone() : null)
                .recruiterAvatar(recruiterUser != null ? recruiterUser.getAvatarUrl() : null)
                .recruiterPosition(recruiterPosition)
                .recruiterDepartment(recruiterDepartment)
                .recruiterBio(recruiterUser != null ? recruiterUser.getBio() : null)
                // Truy xuất qua Company object
                .companyId(companyId)
                .companyName(companyName)
                .companyLogo(companyLogo)
                .companySize(companySize)
                .companyAddress(companyAddress)
                .companyDescription(companyDescription)
                .companyWebsite(companyWebsite)
                .companyIndustry(companyIndustry)
                .title(job.getTitle())
                .description(job.getDescription())
                .requirements(parseCleanList(job.getRequirements()))
                .benefits(parseCleanList(job.getBenefits()))
                .salaryMin(job.getSalaryMin())
                .salaryMax(job.getSalaryMax())
                .location(job.getLocation())
                .employmentType(job.getEmploymentType())
                .status(job.getStatus())
                .approvalStatus(job.getApprovalStatus())
                .vacanciesCount(job.getVacanciesCount())
                .totalViews(job.getTotalViews())
                .applicantCount(applicationRepository != null ? applicationRepository.countByJob_JobId(job.getJobId()) : 0L)
                .deadlineDate(job.getDeadlineDate())
                .skills(skillNames)
                .createdAt(job.getCreatedAt())
                .build();
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
        return jobRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
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
}
