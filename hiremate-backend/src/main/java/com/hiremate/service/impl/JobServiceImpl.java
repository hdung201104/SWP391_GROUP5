package com.hiremate.service.impl;

import com.hiremate.dto.request.JobCreateRequest;
import com.hiremate.dto.response.JobResponse;
import com.hiremate.entity.Company;
import com.hiremate.entity.Job;
import com.hiremate.entity.JobSkill;
import com.hiremate.entity.User;
import com.hiremate.enums.JobStatus;
import com.hiremate.enums.SkillImportance;
import com.hiremate.repository.CompanyRepository;
import com.hiremate.repository.JobRepository;
import com.hiremate.repository.JobSkillRepository;
import com.hiremate.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class JobServiceImpl implements JobService {

    private final JobRepository jobRepository;
    private final JobSkillRepository jobSkillRepository;
    private final CompanyRepository companyRepository;

    @Override
    @Transactional
    public JobResponse createJob(JobCreateRequest request, User recruiter) {
        Optional<Company> companyOpt = companyRepository.findByRecruiterId(recruiter.getUserId());
        Long companyId = companyOpt.map(Company::getCompanyId).orElse(null);

        Job job = Job.builder()
                .recruiterId(recruiter.getUserId())
                .companyId(companyId)
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

        // Save mandatory skills
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

        // Save preferred skills
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

        return mapToResponse(savedJob, companyOpt.orElse(null));
    }

    @Override
    @Transactional
    public JobResponse updateJob(Long jobId, JobCreateRequest request, User recruiter) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        if (!job.getRecruiterId().equals(recruiter.getUserId())) {
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
        Company company = job.getCompanyId() != null ? companyRepository.findById(job.getCompanyId()).orElse(null) : null;
        return mapToResponse(updatedJob, company);
    }

    @Override
    public JobResponse getJobById(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        // Increment total views
        job.setTotalViews(job.getTotalViews() + 1);
        jobRepository.save(job);

        Company company = job.getCompanyId() != null ? companyRepository.findById(job.getCompanyId()).orElse(null) : null;
        return mapToResponse(job, company);
    }

    @Override
    public List<JobResponse> getPublishedJobs(String keyword, String location) {
        List<Job> jobs = jobRepository.searchJobs(keyword, location);
        List<JobResponse> responses = new ArrayList<>();
        for (Job job : jobs) {
            Company company = job.getCompanyId() != null ? companyRepository.findById(job.getCompanyId()).orElse(null) : null;
            responses.add(mapToResponse(job, company));
        }
        return responses;
    }

    @Override
    public List<JobResponse> getRecruiterJobs(Long recruiterId) {
        List<Job> jobs = jobRepository.findByRecruiterId(recruiterId);
        Company company = companyRepository.findByRecruiterId(recruiterId).orElse(null);
        List<JobResponse> responses = new ArrayList<>();
        for (Job job : jobs) {
            responses.add(mapToResponse(job, company));
        }
        return responses;
    }

    @Override
    @Transactional
    public void closeJob(Long jobId, User recruiter) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        if (!job.getRecruiterId().equals(recruiter.getUserId())) {
            throw new SecurityException("You are not authorized to close this job");
        }

        job.setStatus(JobStatus.CLOSED);
        jobRepository.save(job);
    }

    private JobResponse mapToResponse(Job job, Company company) {
        return JobResponse.builder()
                .jobId(job.getJobId())
                .recruiterId(job.getRecruiterId())
                .companyId(job.getCompanyId())
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
                .createdAt(job.getCreatedAt())
                .build();
    }
}
