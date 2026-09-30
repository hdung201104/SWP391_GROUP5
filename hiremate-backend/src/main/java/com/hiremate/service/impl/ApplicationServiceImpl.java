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

    @Override
    @Transactional
    public ApplicationResponse applyToJob(ApplyRequest request, User candidate) {
        Job job = jobRepository.findById(request.getJobId())
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + request.getJobId()));

        // Enforce Single Application Rule per candidate per job
        Optional<Application> existing = applicationRepository.findByJobIdAndCandidateId(job.getJobId(), candidate.getUserId());
        if (existing.isPresent()) {
            throw new IllegalStateException("You have already submitted an application for this position.");
        }

        Long cvId = request.getCvId();
        if (cvId == null) {
            // Find candidate's default CV
            Optional<Cv> defaultCv = cvRepository.findByCandidateIdAndIsDefaultTrue(candidate.getUserId());
            if (defaultCv.isPresent()) {
                cvId = defaultCv.get().getCvId();
            }
        }

        Application application = Application.builder()
                .jobId(job.getJobId())
                .candidateId(candidate.getUserId())
                .cvId(cvId)
                .coverLetter(request.getCoverLetter())
                .status(ApplicationStatus.APPLIED)
                .build();

        Application savedApp = applicationRepository.save(application);

        // Audit Log Pipeline transition
        pipelineLogRepository.save(RecruitmentPipelineLog.builder()
                .applicationId(savedApp.getApplicationId())
                .fromStage(null)
                .toStage(ApplicationStatus.APPLIED)
                .notes("Application submitted by candidate.")
                .changedBy(candidate.getUserId())
                .build());

        return mapToResponse(savedApp, job, candidate);
    }

    @Override
    public List<ApplicationResponse> getCandidateApplications(Long candidateId) {
        List<Application> apps = applicationRepository.findByCandidateId(candidateId);
        List<ApplicationResponse> list = new ArrayList<>();
        User candidate = userRepository.findById(candidateId).orElse(null);

        for (Application app : apps) {
            Job job = jobRepository.findById(app.getJobId()).orElse(null);
            list.add(mapToResponse(app, job, candidate));
        }
        return list;
    }

    @Override
    public List<ApplicationResponse> getJobApplications(Long jobId, User recruiter) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        if (!job.getRecruiterId().equals(recruiter.getUserId())) {
            throw new SecurityException("Unauthorized access to this job's candidates.");
        }

        List<Application> apps = applicationRepository.findByJobId(jobId);
        List<ApplicationResponse> list = new ArrayList<>();

        for (Application app : apps) {
            User candidate = userRepository.findById(app.getCandidateId()).orElse(null);
            list.add(mapToResponse(app, job, candidate));
        }
        return list;
    }

    @Override
    @Transactional
    public ApplicationResponse updateApplicationStatus(Long applicationId, UpdateApplicationStatusRequest request, User recruiter) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));

        Job job = jobRepository.findById(application.getJobId())
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + application.getJobId()));

        if (!job.getRecruiterId().equals(recruiter.getUserId())) {
            throw new SecurityException("Unauthorized to modify this application.");
        }

        ApplicationStatus previousStatus = application.getStatus();
        application.setStatus(request.getStatus());
        Application updated = applicationRepository.save(application);

        // Log transition
        pipelineLogRepository.save(RecruitmentPipelineLog.builder()
                .applicationId(updated.getApplicationId())
                .fromStage(previousStatus)
                .toStage(request.getStatus())
                .notes(request.getNotes() != null ? request.getNotes() : "Recruiter updated pipeline stage")
                .changedBy(recruiter.getUserId())
                .build());

        User candidate = userRepository.findById(application.getCandidateId()).orElse(null);
        return mapToResponse(updated, job, candidate);
    }

    private ApplicationResponse mapToResponse(Application app, Job job, User candidate) {
        String jobTitle = job != null ? job.getTitle() : "Unknown Job";
        String companyName = "HireMate Partner";
        if (job != null && job.getCompanyId() != null) {
            Optional<Company> comp = companyRepository.findById(job.getCompanyId());
            if (comp.isPresent()) {
                companyName = comp.get().getCompanyName();
            }
        }

        String cvUrl = null;
        if (app.getCvId() != null) {
            Optional<Cv> cv = cvRepository.findById(app.getCvId());
            if (cv.isPresent()) {
                cvUrl = cv.get().getFileUrl();
            }
        }

        Float score = null;
        if (job != null && candidate != null) {
            Optional<AiJobMatch> match = aiJobMatchRepository.findByCandidateIdAndJobId(candidate.getUserId(), job.getJobId());
            if (match.isPresent()) {
                score = match.get().getMatchingScore();
            }
        }

        return ApplicationResponse.builder()
                .applicationId(app.getApplicationId())
                .jobId(app.getJobId())
                .jobTitle(jobTitle)
                .companyName(companyName)
                .candidateId(app.getCandidateId())
                .candidateName(candidate != null ? candidate.getFullName() : "Candidate")
                .candidateEmail(candidate != null ? candidate.getEmail() : null)
                .cvId(app.getCvId())
                .cvUrl(cvUrl)
                .status(app.getStatus())
                .coverLetter(app.getCoverLetter())
                .matchingScore(score)
                .createdAt(app.getCreatedAt())
                .build();
    }
}
