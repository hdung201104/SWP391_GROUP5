package com.hiremate.service.impl;

import com.hiremate.dto.request.ApplyRequest;
import com.hiremate.dto.request.UpdateApplicationStatusRequest;
import com.hiremate.dto.response.ApplicationResponse;
import com.hiremate.entity.*;
import com.hiremate.enums.ApplicationStatus;
import com.hiremate.repository.*;
import com.hiremate.service.ApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ApplicationServiceImpl implements ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final CvRepository cvRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final RecruitmentPipelineLogRepository pipelineLogRepository;
    private final AiJobMatchRepository aiJobMatchRepository;
    private final CandidateRepository candidateRepository;

    @Override
    @Transactional
    public ApplicationResponse applyToJob(ApplyRequest request, User user) {
        Job job = jobRepository.findById(request.getJobId())
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + request.getJobId()));

        // Lấy Candidate subclass – candidate_id = user_id (Shared PK)
        Candidate candidate = candidateRepository.findById(user.getUserId())
                .orElseThrow(() -> new IllegalStateException(
                        "Candidate profile not found for user: " + user.getUserId()));

        // Enforce Single Application Rule per candidate per job
        Optional<Application> existing = applicationRepository
                .findByJob_JobIdAndCandidate_CandidateId(job.getJobId(), candidate.getCandidateId());
        if (existing.isPresent()) {
            throw new IllegalStateException("You have already submitted an application for this position.");
        }

        // Tìm CV mặc định nếu không chỉ định cụ thể
        Cv cv = null;
        if (request.getCvId() != null) {
            cv = cvRepository.findById(request.getCvId()).orElse(null);
        } else {
            cv = cvRepository.findByCandidateIdAndIsDefaultTrue(candidate.getCandidateId()).orElse(null);
        }

        Application application = Application.builder()
                .job(job)
                .candidate(candidate)
                .cv(cv)
                .coverLetter(request.getCoverLetter())
                .status(ApplicationStatus.APPLIED)
                .build();

        Application savedApp = applicationRepository.save(application);

        // Audit Log: ghi nhận bước đầu tiên trong pipeline tuyển dụng
        pipelineLogRepository.save(RecruitmentPipelineLog.builder()
                .applicationId(savedApp.getApplicationId())
                .fromStage(null)
                .toStage(ApplicationStatus.APPLIED)
                .notes("Application submitted by candidate.")
                .changedBy(user.getUserId())
                .build());

        return mapToResponse(savedApp);
    }

    @Override
    public List<ApplicationResponse> getCandidateApplications(Long candidateId) {
        // Dùng method mới qua Candidate subclass relationship
        List<Application> apps = applicationRepository.findByCandidate_CandidateId(candidateId);
        List<ApplicationResponse> list = new ArrayList<>();
        for (Application app : apps) {
            list.add(mapToResponse(app));
        }
        return list;
    }

    @Override
    public List<ApplicationResponse> getJobApplications(Long jobId, User user) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        // Kiểm tra quyền: recruiter.recruiterId = user.userId
        if (!job.getRecruiter().getRecruiterId().equals(user.getUserId())) {
            throw new SecurityException("Unauthorized access to this job's candidates.");
        }

        // Dùng method mới qua Job subclass relationship
        List<Application> apps = applicationRepository.findByJob_JobId(jobId);
        List<ApplicationResponse> list = new ArrayList<>();
        for (Application app : apps) {
            list.add(mapToResponse(app));
        }
        return list;
    }

    @Override
    @Transactional
    public ApplicationResponse updateApplicationStatus(
            Long applicationId,
            UpdateApplicationStatusRequest request,
            User user) {

        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));

        Job job = application.getJob();

        // Kiểm tra quyền: recruiter.recruiterId = user.userId
        if (!job.getRecruiter().getRecruiterId().equals(user.getUserId())) {
            throw new SecurityException("Unauthorized to modify this application.");
        }

        ApplicationStatus previousStatus = application.getStatus();
        application.setStatus(request.getStatus());
        Application updated = applicationRepository.save(application);

        // Log pipeline transition
        pipelineLogRepository.save(RecruitmentPipelineLog.builder()
                .applicationId(updated.getApplicationId())
                .fromStage(previousStatus)
                .toStage(request.getStatus())
                .notes(request.getNotes() != null ? request.getNotes() : "Recruiter updated pipeline stage")
                .changedBy(user.getUserId())
                .build());

        return mapToResponse(updated);
    }

    /**
     * Map Application entity -> ApplicationResponse DTO.
     * Truy xuất toàn bộ thông tin qua object navigation (không dùng raw Long FKs).
     */
    private ApplicationResponse mapToResponse(Application app) {
        Job job = app.getJob();
        Candidate candidate = app.getCandidate();
        User candidateUser = candidate != null ? candidate.getUser() : null;
        Cv cv = app.getCv();

        String jobTitle = job != null ? job.getTitle() : "Unknown Job";
        Company company = job != null ? job.getCompany() : null;
        String companyName = company != null ? company.getCompanyName() : "HireMate Partner";

        // Lấy AI matching score từ cache (KHÔNG gọi lại Gemini API)
        Float score = null;
        if (job != null && candidate != null) {
            Optional<AiJobMatch> match = aiJobMatchRepository
                    .findByCandidate_CandidateIdAndJob_JobId(
                            candidate.getCandidateId(),
                            job.getJobId());
            if (match.isPresent()) {
                score = match.get().getMatchingScore();
            }
        }

        return ApplicationResponse.builder()
                .applicationId(app.getApplicationId())
                .jobId(job != null ? job.getJobId() : null)
                .jobTitle(jobTitle)
                .companyName(companyName)
                .candidateId(candidate != null ? candidate.getCandidateId() : null)
                .candidateName(candidateUser != null ? candidateUser.getFullName() : "Candidate")
                .candidateEmail(candidateUser != null ? candidateUser.getEmail() : null)
                .cvId(cv != null ? cv.getCvId() : null)
                .cvUrl(cv != null ? cv.getFileUrl() : null)
                .status(app.getStatus())
                .coverLetter(app.getCoverLetter())
                .matchingScore(score)
                .createdAt(app.getCreatedAt())
                .build();
    }
}
