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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@lombok.extern.slf4j.Slf4j
@Service
@RequiredArgsConstructor
public class ApplicationServiceImpl implements ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final CvRepository cvRepository;
    private final RecruitmentPipelineLogRepository pipelineLogRepository;
    private final AiJobMatchRepository aiJobMatchRepository;
    private final CandidateRepository candidateRepository;
    private final UserRepository userRepository;
    private final com.hiremate.service.NotificationService notificationService;
    private final com.hiremate.service.AiJobMatchService aiJobMatchService;
    private final com.hiremate.service.EmailService emailService;

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
        return getJobApplications(jobId, null, user);
    }

    @Override
    public List<ApplicationResponse> getJobApplications(Long jobId, ApplicationStatus status, User user) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        // Kiểm tra quyền: recruiter.recruiterId = user.userId
        if (!job.getRecruiter().getRecruiterId().equals(user.getUserId())) {
            throw new SecurityException("Unauthorized access to this job's candidates.");
        }

        List<Application> apps = (status != null)
                ? applicationRepository.findByJob_JobIdAndStatus(jobId, status)
                : applicationRepository.findByJob_JobId(jobId);

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
    public List<ApplicationResponse> batchUpdateApplicationStatus(
            com.hiremate.dto.request.BatchUpdateStatusRequest request,
            User user) {
        if (request.getApplicationIds() == null || request.getApplicationIds().isEmpty()) {
            return new ArrayList<>();
        }

        List<ApplicationResponse> updatedResponses = new ArrayList<>();
        for (Long appId : request.getApplicationIds()) {
            try {
                UpdateApplicationStatusRequest singleRequest = new UpdateApplicationStatusRequest();
                singleRequest.setStatus(request.getStatus());
                singleRequest.setNotes(request.getNotes());
                ApplicationResponse res = updateApplicationStatus(appId, singleRequest, user);
                updatedResponses.add(res);
            } catch (Exception e) {
                log.warn(">> [ApplicationService] Không thể cập nhật trạng thái đơn ID {}: {}", appId, e.getMessage());
            }
        }
        return updatedResponses;
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

        // Gửi thông báo chuyển vòng cho Ứng viên (Chuông in-app + Email tự động)
        if (application.getCandidate() != null && application.getCandidate().getCandidateId() != null) {
            Long candidateId = application.getCandidate().getCandidateId();
            String companyName = job.getCompany() != null ? job.getCompany().getCompanyName() : "Nhà tuyển dụng";

            // 1. Gửi thông báo chuông trên ứng dụng
            notificationService.createNotification(
                    candidateId,
                    com.hiremate.enums.NotificationType.APPLICATION_STATUS,
                    "Cập nhật tiến độ ứng tuyển",
                    String.format("Công ty %s đã cập nhật hồ sơ ứng tuyển vị trí %s của bạn sang vòng: %s",
                            companyName, job.getTitle(), request.getStatus().name()),
                    updated.getApplicationId(),
                    "applications"
            );

            // 2. Gửi Email thông báo trực tiếp đến hộp thư của ứng viên (đặc biệt khi INTERVIEWING hoặc OFFERED)
            try {
                User candidateUser = application.getCandidate().getUser();
                if (candidateUser == null || candidateUser.getEmail() == null) {
                    candidateUser = userRepository.findById(candidateId).orElse(null);
                }

                if (candidateUser != null && candidateUser.getEmail() != null) {
                    emailService.sendApplicationStatusEmail(
                            candidateUser.getEmail(),
                            candidateUser.getFullName(),
                            job.getTitle(),
                            companyName,
                            request.getStatus(),
                            request.getNotes()
                    );
                }
            } catch (Exception ex) {
                // Email gửi lỗi hoặc chưa cấu hình SMTP không làm gián đoạn transaction
            }
        }

        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.hiremate.dto.response.PipelineLogResponse> getApplicationTimeline(Long applicationId, User user) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn ứng tuyển với ID: " + applicationId));

        // Phân quyền bảo mật:
        // 1. Chính ứng viên đã nộp đơn
        // 2. Nhà tuyển dụng phụ trách tin tuyển dụng này
        // 3. Quản trị viên (ADMIN)
        boolean isCandidate = application.getCandidate() != null
                && application.getCandidate().getCandidateId().equals(user.getUserId());
        boolean isRecruiter = application.getJob() != null
                && application.getJob().getRecruiter() != null
                && application.getJob().getRecruiter().getRecruiterId().equals(user.getUserId());
        boolean isAdmin = user.getRole() == com.hiremate.enums.UserRole.ADMIN;

        if (!isCandidate && !isRecruiter && !isAdmin) {
            throw new SecurityException("Bạn không có quyền xem lịch sử tiến trình của đơn ứng tuyển này");
        }

        List<RecruitmentPipelineLog> logs = pipelineLogRepository.findByApplicationIdOrderByCreatedAtAsc(applicationId);
        List<com.hiremate.dto.response.PipelineLogResponse> result = new ArrayList<>();

        Map<Long, String> userNameCache = new HashMap<>();

        for (RecruitmentPipelineLog logItem : logs) {
            String changerName = "Hệ thống";
            if (logItem.getChangedBy() != null) {
                changerName = userNameCache.computeIfAbsent(logItem.getChangedBy(), id ->
                        userRepository.findById(id)
                                .map(User::getFullName)
                                .orElse("Người dùng #" + id)
                );
            }

            String stageLabel = getStageLabel(logItem.getToStage());

            result.add(com.hiremate.dto.response.PipelineLogResponse.builder()
                    .logId(logItem.getLogId())
                    .applicationId(logItem.getApplicationId())
                    .fromStage(logItem.getFromStage())
                    .toStage(logItem.getToStage())
                    .stageLabel(stageLabel)
                    .notes(logItem.getNotes())
                    .changedBy(logItem.getChangedBy())
                    .changedByName(changerName)
                    .createdAt(logItem.getCreatedAt())
                    .build());
        }

        return result;
    }

    private String getStageLabel(ApplicationStatus status) {
        if (status == null) return "Khởi tạo hồ sơ";
        return switch (status) {
            case APPLIED -> "Nộp hồ sơ";
            case SCREENING -> "Sàng lọc CV";
            case SHORTLISTED -> "Vào danh sách rút gọn";
            case INTERVIEWING -> "Phỏng vấn";
            case OFFERED -> "Nhận đề nghị nhận việc (Offer)";
            case HIRED -> "Trúng tuyển chính thức";
            case REJECTED -> "Từ chối hồ sơ";
        };
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

    @Override
    @Transactional
    public ApplicationResponse withdrawApplication(Long applicationId, User candidate) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));

        // Kiểm tra quyền: candidate.candidateId = candidate.getUserId()
        if (!application.getCandidate().getCandidateId().equals(candidate.getUserId())) {
            throw new SecurityException("Unauthorized to withdraw this application.");
        }

        if (application.getStatus() == ApplicationStatus.OFFERED || application.getStatus() == ApplicationStatus.HIRED) {
            throw new IllegalStateException("Không thể rút đơn khi đã nhận được lời mời làm việc (OFFERED/HIRED). Vui lòng liên hệ trực tiếp nhà tuyển dụng!");
        }

        ApplicationStatus oldStatus = application.getStatus();
        application.setStatus(ApplicationStatus.REJECTED);
        Application updated = applicationRepository.save(application);

        // Ghi log vào recruitment_pipeline_logs
        pipelineLogRepository.save(com.hiremate.entity.RecruitmentPipelineLog.builder()
                .applicationId(application.getApplicationId())
                .fromStage(oldStatus != null ? oldStatus : ApplicationStatus.APPLIED)
                .toStage(ApplicationStatus.REJECTED)
                .changedBy(candidate.getUserId())
                .notes("Ứng viên đã chủ động rút đơn ứng tuyển.")
                .build());

        // Gửi thông báo chuông cho Nhà tuyển dụng
        if (application.getJob() != null && application.getJob().getRecruiter() != null) {
            notificationService.createNotification(
                    application.getJob().getRecruiter().getRecruiterId(),
                    com.hiremate.enums.NotificationType.APPLICATION_STATUS,
                    "Ứng viên rút đơn ứng tuyển",
                    "Ứng viên " + (candidate.getFullName() != null ? candidate.getFullName() : candidate.getEmail())
                            + " đã rút đơn ứng tuyển vị trí " + application.getJob().getTitle() + ".",
                    application.getApplicationId(),
                    "applications"
            );
        }

        log.info(">> [ApplicationService] Ứng viên {} đã rút đơn ứng tuyển ID {}", candidate.getUserId(), applicationId);
        return mapToResponse(updated);
    }

    @Override
    public byte[] exportJobApplicationsCsv(Long jobId, User recruiter) {
        // Tận dụng getJobApplications đã có quyền kiểm tra, sắp xếp matching score giảm dần
        List<ApplicationResponse> apps = getJobApplications(jobId, recruiter);

        StringBuilder csv = new StringBuilder();
        // UTF-8 BOM để Excel hiển thị đúng dấu tiếng Việt không bị lỗi font
        csv.append("\uFEFF");
        csv.append("Mã đơn,Họ và tên,Email,Số điện thoại,Điểm Match (%),Trạng thái,Đường dẫn CV,Ngày nộp\n");

        for (ApplicationResponse app : apps) {
            String fullName = app.getCandidateName() != null ? app.getCandidateName().replace(",", " ") : "N/A";
            String email = app.getCandidateEmail() != null ? app.getCandidateEmail() : "N/A";
            String phone = "N/A"; // DTO ApplicationResponse
            String score = app.getMatchingScore() != null ? String.format("%.1f", app.getMatchingScore()) : "0";
            String status = app.getStatus() != null ? app.getStatus().name() : "APPLIED";
            String cvUrl = app.getCvUrl() != null ? app.getCvUrl() : "N/A";
            String createdAt = app.getCreatedAt() != null ? app.getCreatedAt().toString() : "";

            csv.append(app.getApplicationId()).append(",")
               .append("\"").append(fullName).append("\",")
               .append(email).append(",")
               .append(phone).append(",")
               .append(score).append(",")
               .append(status).append(",")
               .append("\"").append(cvUrl).append("\",")
               .append(createdAt).append("\n");
        }

        return csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }
}
