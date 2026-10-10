package com.hiremate.service;

import com.hiremate.dto.request.JobCreateRequest;
import com.hiremate.dto.response.JobResponse;
import com.hiremate.entity.User;

import java.util.List;

public interface JobService {
    JobResponse createJob(JobCreateRequest request, User recruiter);
    JobResponse updateJob(Long jobId, JobCreateRequest request, User recruiter);
    JobResponse getJobById(Long jobId);
    List<JobResponse> getPublishedJobs(String keyword, String location);
    com.hiremate.dto.response.PageResponse<JobResponse> getPublishedJobsPaged(String keyword, String location, int page, int size, String sortBy, String sortDir);
    com.hiremate.dto.response.PageResponse<JobResponse> getPublishedJobsPagedAdvanced(
            String keyword,
            String location,
            com.hiremate.enums.EmploymentType employmentType,
            java.math.BigDecimal minSalary,
            java.math.BigDecimal maxSalary,
            int page,
            int size,
            String sortBy,
            String sortDir
    );
    List<JobResponse> getRecruiterJobs(Long recruiterId);
    com.hiremate.dto.response.PageResponse<JobResponse> getRecruiterJobsPaged(Long recruiterId, int page, int size);
    void closeJob(Long jobId, User recruiter);
    JobResponse updateJobStatus(Long jobId, com.hiremate.enums.JobStatus status, User recruiter);
    JobResponse cloneJob(Long jobId, User recruiter);
}
