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
    private final com.hiremate.service.NotificationService notificationService;
    private final com.hiremate.service.AiJobMatchService aiJobMatchService;

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

        // Tự động tính toán & lưu kết quả so khớp AI (70% mandatory + 30% preferred)
        try {
            aiJobMatchService.calculateAndSaveMatch(candidate, job, cv);
        } catch (Exception ex) {
            // Non-blocking fallback
        }

        // Gửi thông báo cho ứng viên
        notificationService.createNotification(
                user.getUserId(),
                com.hiremate.enums.NotificationType.APPLICATION_STATUS,
                "Ứng tuyển thành công!",
                "Bạn đã nộp hồ sơ thành công vào vị trí: " + job.getTitle() + " tại " + (job.getCompany() != null ? job.getCompany().getCompanyName() : "công ty tuyển dụng"),
                savedApp.getApplicationId(),
                "applications"
        );

        // Gửi thông báo cho nhà tuyển dụng phụ trách
        if (job.getRecruiter() != null && job.getRecruiter().getRecruiterId() != null) {
            notificationService.createNotification(
                    job.getRecruiter().getRecruiterId(),
                    com.hiremate.enums.NotificationType.APPLICATION_STATUS,
                    "Có hồ sơ ứng tuyển mới!",
                    "Ứng viên " + user.getFullName() + " vừa nộp hồ sơ vào vị trí " + job.getTitle(),
                    savedApp.getApplicationId(),
                    "applications"
            );
        }

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

        // Sắp xếp ứng viên theo matching_score DESC (theo chuẩn UC-28: View Rank Candidates)
        list.sort((a, b) -> {
            float sA = a.getMatchingScore() != null ? a.getMatchingScore() : 0f;
            float sB = b.getMatchingScore() != null ? b.getMatchingScore() : 0f;
            return Float.compare(sB, sA);
        });

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

        // Gửi thông báo chuyển vòng cho Ứng viên
        if (application.getCandidate() != null && application.getCandidate().getCandidateId() != null) {
            String companyName = job.getCompany() != null ? job.getCompany().getCompanyName() : "Nhà tuyển dụng";
            notificationService.createNotification(
                    application.getCandidate().getCandidateId(),
                    com.hiremate.enums.NotificationType.APPLICATION_STATUS,
                    "Cập nhật tiến độ ứng tuyển",
                    String.format("Công ty %s đã cập nhật hồ sơ ứng tuyển vị trí %s của bạn sang vòng: %s",
                            companyName, job.getTitle(), request.getStatus().name()),
                    updated.getApplicationId(),
                    "applications"
            );
        }

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
