package com.hiremate.service;

import com.hiremate.dto.request.ApplyRequest;
import com.hiremate.dto.request.UpdateApplicationStatusRequest;
import com.hiremate.dto.response.ApplicationResponse;
import com.hiremate.entity.User;

import java.util.List;

public interface ApplicationService {
    ApplicationResponse applyToJob(ApplyRequest request, User candidate);
    List<ApplicationResponse> getCandidateApplications(Long candidateId);
    List<ApplicationResponse> getJobApplications(Long jobId, User recruiter);
    ApplicationResponse updateApplicationStatus(Long applicationId, UpdateApplicationStatusRequest request, User recruiter);
}
