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
    List<JobResponse> getRecruiterJobs(Long recruiterId);
    void closeJob(Long jobId, User recruiter);
}
