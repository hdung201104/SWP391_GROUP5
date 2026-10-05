package com.hiremate.service.impl;

import com.hiremate.dto.request.JobCreateRequest;
import com.hiremate.dto.response.JobResponse;
import com.hiremate.entity.Company;
import com.hiremate.entity.Job;
import com.hiremate.entity.JobSkill;
import com.hiremate.entity.Recruiter;
import com.hiremate.entity.User;
import com.hiremate.enums.JobStatus;
import com.hiremate.enums.SkillImportance;
import com.hiremate.repository.CompanyRepository;
import com.hiremate.repository.JobRepository;
import com.hiremate.repository.JobSkillRepository;
import com.hiremate.repository.RecruiterRepository;
import com.hiremate.repository.SkillRepository;
import com.hiremate.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JobServiceImpl implements JobService {

    private final JobRepository jobRepository;
    private final JobSkillRepository jobSkillRepository;
    private final SkillRepository skillRepository;
    private final RecruiterRepository recruiterRepository;
    private final com.hiremate.service.NotificationService notificationService;

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

    /**
     * Map Job entity -> JobResponse DTO.
     * Truy xuất companyId và recruiterId qua object navigation.
     */
    private JobResponse mapToResponse(Job job) {
        Company company = job.getCompany();

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
                .recruiterId(job.getRecruiter() != null ? job.getRecruiter().getRecruiterId() : null)
                // Truy xuất qua Company object
                .companyId(company != null ? company.getCompanyId() : null)
                .companyName(company != null ? company.getCompanyName() : "HireMate Partner")
                .companyLogo(company != null ? company.getLogoUrl() : null)
                .title(job.getTitle())
                .description(job.getDescription())
                .requirements(job.getRequirements())
                .benefits(job.getBenefits())
                .salaryMin(job.getSalaryMin())
                .salaryMax(job.getSalaryMax())
                .location(job.getLocation())
                .employmentType(job.getEmploymentType())
                .status(job.getStatus())
                .vacanciesCount(job.getVacanciesCount())
                .totalViews(job.getTotalViews())
                .deadlineDate(job.getDeadlineDate())
                .skills(skillNames)
                .createdAt(job.getCreatedAt())
                .build();
    }
}
