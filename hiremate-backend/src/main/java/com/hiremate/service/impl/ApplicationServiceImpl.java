package com.hiremate.service.impl;

import com.hiremate.dto.request.ApplyRequest;
import com.hiremate.dto.request.UpdateApplicationStatusRequest;
import com.hiremate.dto.response.AiJobMatchResponse;
import com.hiremate.dto.response.ApplicationResponse;
import com.hiremate.entity.*;
import com.hiremate.enums.ApplicationStatus;
import com.hiremate.exception.BadRequestException;
import com.hiremate.repository.*;
import com.hiremate.service.ApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
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
    private final Map<Long, CachedApplications> candidateAppsCache = new java.util.concurrent.ConcurrentHashMap<>();

    private record CachedApplications(List<ApplicationResponse> data, long timestamp) {}

    @Override
    @Transactional
    public ApplicationResponse applyToJob(ApplyRequest request, User user) {
        Job job = jobRepository.findById(request.getJobId())
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + request.getJobId()));

        // 1. Kiểm tra điều kiện hợp lệ của tin tuyển dụng: Tin phải đang PUBLISHED và đã được APPROVED
        boolean isPublished = job.getStatus() == com.hiremate.enums.JobStatus.PUBLISHED;
        boolean isApproved = job.getApprovalStatus() == null || job.getApprovalStatus() == com.hiremate.enums.JobApprovalStatus.APPROVED;
        if (!isPublished || !isApproved) {
            throw new BadRequestException("Tin tuyển dụng này hiện không còn nhận hồ sơ.");
        }

        // Kiểm tra hạn chót nộp hồ sơ
        if (job.getDeadlineDate() != null && job.getDeadlineDate().isBefore(java.time.LocalDate.now())) {
            throw new BadRequestException("Tin tuyển dụng này đã hết hạn nộp hồ sơ.");
        }

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

        // 2. Tìm CV: bắt buộc phải có CV hợp lệ để ứng tuyển
        Cv cv = null;
        if (request.getCvId() != null) {
            cv = cvRepository.findById(request.getCvId()).orElse(null);
        } else {
            cv = cvRepository.findByCandidateIdAndIsDefaultTrue(candidate.getCandidateId()).orElse(null);
        }

        if (cv == null) {
            throw new BadRequestException("Vui lòng tải lên hoặc chọn một CV trước khi ứng tuyển!");
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
        } catch (Throwable ex) {
            // Non-blocking fallback: Không để lỗi so khớp làm gián đoạn nộp hồ sơ ứng tuyển
            log.warn("AI match calculation non-blocking warning: {}", ex.getMessage());
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

        candidateAppsCache.remove(user.getUserId());
        return mapToResponse(savedApp);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getCandidateApplications(Long candidateId) {
        if (candidateId == null) {
            return Collections.emptyList();
        }
        CachedApplications cached = candidateAppsCache.get(candidateId);
        if (cached != null && (System.currentTimeMillis() - cached.timestamp() < 10000)) {
            return cached.data();
        }

        List<Application> apps = applicationRepository.findByCandidate_CandidateId(candidateId);
        if (apps == null || apps.isEmpty()) {
            candidateAppsCache.put(candidateId, new CachedApplications(Collections.emptyList(), System.currentTimeMillis()));
            return Collections.emptyList();
        }

        // Batch pre-fetch all AI matches for this candidate in 1 single query instead of N queries
        Map<Long, Float> matchScoreMap = new HashMap<>();
        try {
            List<AiJobMatch> matches = aiJobMatchRepository.findByCandidate_CandidateIdOrderByMatchingScoreDesc(candidateId);
            for (AiJobMatch m : matches) {
                if (m.getJob() != null && m.getJob().getJobId() != null && m.getMatchingScore() != null) {
                    matchScoreMap.putIfAbsent(m.getJob().getJobId(), m.getMatchingScore());
                }
            }
        } catch (Exception ignored) {}

        // Pre-fetch candidate default CV once to avoid N redundant queries
        Cv defaultCv = cvRepository.findByCandidateIdAndIsDefaultTrue(candidateId)
                .orElseGet(() -> cvRepository.findByCandidateId(candidateId).stream().findFirst().orElse(null));

        List<ApplicationResponse> list = new ArrayList<>(apps.size());
        for (Application app : apps) {
            Float score = (app.getJob() != null) ? matchScoreMap.get(app.getJob().getJobId()) : null;
            list.add(mapToResponse(app, score, defaultCv));
        }
        candidateAppsCache.put(candidateId, new CachedApplications(list, System.currentTimeMillis()));
        return list;
    }

    @Override
    public List<ApplicationResponse> getJobApplications(Long jobId, User user) {
        return getJobApplications(jobId, null, user);
    }

    @Override
    @Transactional(readOnly = true)
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

        if (apps == null || apps.isEmpty()) {
            return Collections.emptyList();
        }

        // Batch pre-fetch all AI matches for this job in 1 single query
        Map<Long, Float> matchScoreMap = new HashMap<>();
        try {
            List<AiJobMatch> matches = aiJobMatchRepository.findByJob_JobIdOrderByMatchingScoreDesc(jobId);
            for (AiJobMatch m : matches) {
                if (m.getCandidate() != null && m.getCandidate().getCandidateId() != null && m.getMatchingScore() != null) {
                    matchScoreMap.putIfAbsent(m.getCandidate().getCandidateId(), m.getMatchingScore());
                }
            }
        } catch (Exception ignored) {}

        List<ApplicationResponse> list = new ArrayList<>(apps.size());
        for (Application app : apps) {
            Float score = (app.getCandidate() != null) ? matchScoreMap.get(app.getCandidate().getCandidateId()) : null;
            list.add(mapToResponse(app, score));
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
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getRecruiterApplications(User recruiterUser) {
        Long recruiterId = recruiterUser.getUserId();
        List<Application> apps = applicationRepository.findByRecruiterId(recruiterId);
        if (apps == null || apps.isEmpty()) {
            return Collections.emptyList();
        }

        // Batch pre-fetch all AI matches for all recruiter jobs in 1 single query
        java.util.Set<Long> jobIds = apps.stream()
                .map(a -> a.getJob() != null ? a.getJob().getJobId() : null)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());

        Map<String, Float> matchScoreMap = new HashMap<>();
        try {
            if (!jobIds.isEmpty()) {
                List<AiJobMatch> matches = aiJobMatchRepository.findByJob_JobIdIn(jobIds);
                for (AiJobMatch m : matches) {
                    if (m.getJob() != null && m.getCandidate() != null && m.getMatchingScore() != null) {
                        String key = m.getJob().getJobId() + "_" + m.getCandidate().getCandidateId();
                        matchScoreMap.putIfAbsent(key, m.getMatchingScore());
                    }
                }
            }
        } catch (Exception ignored) {}

        List<ApplicationResponse> list = new ArrayList<>(apps.size());
        for (Application app : apps) {
            Long jobId = app.getJob() != null ? app.getJob().getJobId() : null;
            Long candidateId = app.getCandidate() != null ? app.getCandidate().getCandidateId() : null;
            Float score = (jobId != null && candidateId != null) ? matchScoreMap.get(jobId + "_" + candidateId) : null;
            list.add(mapToResponse(app, score));
        }
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

        // Kiểm tra quyền: recruiter.recruiterId = user.userId hoặc ADMIN
        boolean isOwner = job != null && job.getRecruiter() != null && job.getRecruiter().getRecruiterId().equals(user.getUserId());
        boolean isAdmin = user != null && user.getRole() != null && user.getRole().name().contains("ADMIN");
        if (!isOwner && !isAdmin) {
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

            // 1. Gửi thông báo chuông trên ứng dụng với trạng thái tiếng Việt chuẩn
            String statusVi = formatApplicationStatusVi(request.getStatus());
            notificationService.createNotification(
                    candidateId,
                    com.hiremate.enums.NotificationType.APPLICATION_STATUS,
                    "Cập nhật tiến độ ứng tuyển",
                    String.format("Công ty %s đã cập nhật hồ sơ ứng tuyển vị trí %s của bạn sang trạng thái: \"%s\"",
                            companyName, job.getTitle(), statusVi),
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

        candidateAppsCache.clear();
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
        return mapToResponse(app, null, null);
    }

    private ApplicationResponse mapToResponse(Application app, Float overrideScore) {
        return mapToResponse(app, overrideScore, null);
    }

    private ApplicationResponse mapToResponse(Application app, Float overrideScore, Cv fallbackCv) {
        Job job = app.getJob();
        Candidate candidate = app.getCandidate();
        User candidateUser = candidate != null ? candidate.getUser() : null;
        Cv cv = app.getCv();
        if (cv == null) {
            cv = fallbackCv;
        }
        if (cv == null && candidate != null && fallbackCv == null) {
            cv = cvRepository.findByCandidateIdAndIsDefaultTrue(candidate.getCandidateId())
                    .orElseGet(() -> cvRepository.findByCandidateId(candidate.getCandidateId())
                            .stream().findFirst().orElse(null));
        }

        String jobTitle = job != null ? job.getTitle() : "Unknown Job";
        Company company = job != null ? job.getCompany() : null;
        String companyName = company != null ? company.getCompanyName() : "HireMate Partner";

        Recruiter recruiter = job != null ? job.getRecruiter() : null;
        User recruiterUser = recruiter != null ? recruiter.getUser() : null;
        String recruiterName = recruiterUser != null ? recruiterUser.getFullName() : "Bộ phận Tuyển dụng";
        String recruiterEmail = recruiterUser != null ? recruiterUser.getEmail() : null;
        Long recruiterId = recruiter != null ? recruiter.getRecruiterId() : null;

        // Lấy AI matching score từ override hoặc cache (KHÔNG gọi lại Gemini API)
        Float score = overrideScore;
        if (score == null && job != null && candidate != null) {
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
                .recruiterId(recruiterId)
                .recruiterName(recruiterName)
                .recruiterEmail(recruiterEmail)
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
        candidateAppsCache.remove(candidate.getUserId());
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

    private String formatApplicationStatusVi(ApplicationStatus status) {
        if (status == null) return "Cập nhật hồ sơ";
        switch (status) {
            case APPLIED:
                return "Đã nộp hồ sơ";
            case SCREENING:
                return "Nhà tuyển dụng đã xem hồ sơ";
            case SHORTLISTED:
                return "Vào danh sách rút gọn";
            case INTERVIEWING:
                return "Mời phỏng vấn";
            case OFFERED:
                return "Đề nghị nhận việc (Offer)";
            case HIRED:
                return "Trúng tuyển";
            case REJECTED:
                return "Chưa phù hợp (Từ chối)";
            default:
                return status.name();
        }
    }
}
