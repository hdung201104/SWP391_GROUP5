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
    private final RecruiterRepository recruiterRepository;
    private final CompanyRepository companyRepository;
    private final com.hiremate.service.NotificationService notificationService;
    private final com.hiremate.service.AiJobMatchService aiJobMatchService;
    private final com.hiremate.service.EmailService emailService;
    private final Map<Long, CachedApplications> candidateAppsCache = new java.util.concurrent.ConcurrentHashMap<>();

    private record CachedApplications(List<ApplicationResponse> data, long timestamp) {}

    /**
     * Kiểm tra phân quyền Nhà tuyển dụng đối với một tin tuyển dụng:
     * 1. Quản trị viên (ADMIN)
     * 2. Chính Recruiter đăng tin
     * 3. Recruiter khác nhưng thuộc CÙNG CÔNG TY với tin đăng
     */
    private boolean isAuthorizedRecruiterForJob(Job job, User user) {
        if (user == null || job == null) return false;
        if (user.getRole() == com.hiremate.enums.UserRole.ADMIN) {
            return true;
        }
        // 1. Chính người tạo bài đăng
        if (job.getRecruiter() != null && job.getRecruiter().getRecruiterId().equals(user.getUserId())) {
            return true;
        }
        // 2. HR cùng công ty (Cho phép các thành viên HR trong cùng doanh nghiệp cùng xem và phối hợp tuyển dụng)
        if (user.getRole() == com.hiremate.enums.UserRole.RECRUITER && job.getCompany() != null && job.getCompany().getCompanyId() != null) {
            Recruiter currentRecruiter = recruiterRepository.findById(user.getUserId()).orElse(null);
            if (currentRecruiter != null && currentRecruiter.getCompany() != null
                    && currentRecruiter.getCompany().getCompanyId().equals(job.getCompany().getCompanyId())) {
                return true;
            }
        }
        return false;
    }

    @Override
    @Transactional(readOnly = true)
    public ApplicationResponse getApplicationById(Long applicationId, User user) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn ứng tuyển với ID: " + applicationId));

        // Kiểm tra quyền: ADMIN, chính ứng viên, hoặc Recruiter được phân quyền đối với job
        if (user != null) {
            if (user.getRole() == com.hiremate.enums.UserRole.ADMIN) {
                // Cho phép Admin
            } else if (user.getRole() == com.hiremate.enums.UserRole.CANDIDATE) {
                if (!app.getCandidate().getCandidateId().equals(user.getUserId())) {
                    throw new SecurityException("Bạn không có quyền xem đơn ứng tuyển của ứng viên khác.");
                }
            } else if (user.getRole() == com.hiremate.enums.UserRole.RECRUITER) {
                // Recruiter thuộc cùng công ty (hoặc chi nhánh)
                if (app.getJob() != null && app.getJob().getCompany() != null) {
                    Recruiter currentRecruiter = recruiterRepository.findById(user.getUserId()).orElse(null);
                    if (currentRecruiter == null || currentRecruiter.getCompany() == null
                            || !currentRecruiter.getCompany().getCompanyId().equals(app.getJob().getCompany().getCompanyId())) {
                        throw new SecurityException("Bạn không có quyền xem đơn ứng tuyển của doanh nghiệp khác.");
                    }
                }
            }
        }

        return mapToResponse(app);
    }


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

        // Kiểm tra trạng thái của Công ty: không cho phép nộp vào công ty BANNED / REJECTED / SUSPENDED
        if (job.getCompany() != null && (job.getCompany().getStatus() == com.hiremate.enums.CompanyStatus.BANNED
                || job.getCompany().getStatus() == com.hiremate.enums.CompanyStatus.REJECTED
                || job.getCompany().getStatus() == com.hiremate.enums.CompanyStatus.SUSPENDED)) {
            throw new BadRequestException("Doanh nghiệp tuyển dụng vị trí này hiện đang tạm ngưng tiếp nhận hồ sơ.");
        }

        // Kiểm tra hạn chót nộp hồ sơ
        if (job.getDeadlineDate() != null && job.getDeadlineDate().isBefore(java.time.LocalDate.now())) {
            throw new BadRequestException("Tin tuyển dụng này đã hết hạn nộp hồ sơ.");
        }

        // Lấy Candidate subclass – candidate_id = user_id (Shared PK)
        Candidate candidate = candidateRepository.findById(user.getUserId())
                .orElseThrow(() -> new IllegalStateException(
                        "Candidate profile not found for user: " + user.getUserId()));

        // Tìm CV: bắt buộc phải có CV hợp lệ và thuộc về chính ứng viên này để ứng tuyển
        Cv cv = null;
        if (request.getCvId() != null) {
            Cv requestedCv = cvRepository.findById(request.getCvId()).orElse(null);
            if (requestedCv != null && java.util.Objects.equals(requestedCv.getCandidateId(), candidate.getCandidateId())) {
                cv = requestedCv;
            }
        }

        // Fallback: Nếu không tìm thấy hoặc không khớp quyền sở hữu, lấy CV mặc định hoặc CV mới nhất của chính candidate
        if (cv == null) {
            cv = cvRepository.findByCandidateIdAndIsDefaultTrue(candidate.getCandidateId())
                    .orElseGet(() -> {
                        List<Cv> cvs = cvRepository.findByCandidateIdOrderByCreatedAtDesc(candidate.getCandidateId());
                        if (cvs == null || cvs.isEmpty()) {
                            cvs = cvRepository.findByCandidateId(candidate.getCandidateId());
                        }
                        return (cvs != null && !cvs.isEmpty()) ? cvs.get(0) : null;
                    });
        }

        if (cv == null) {
            throw new BadRequestException("Vui lòng tải lên hoặc chọn một CV trước khi ứng tuyển!");
        }

        // Enforce Single Application Rule per candidate per job (Hỗ trợ nộp lại nếu trước đó tự rút đơn)
        Optional<Application> existing = applicationRepository
                .findByJob_JobIdAndCandidate_CandidateId(job.getJobId(), candidate.getCandidateId());
        if (existing.isPresent()) {
            Application existingApp = existing.get();
            boolean isWithdrawn = false;
            if (existingApp.getStatus() == ApplicationStatus.REJECTED) {
                if (existingApp.getRejectionReason() != null &&
                        (existingApp.getRejectionReason().contains("WITHDRAWN_BY_CANDIDATE")
                                || existingApp.getRejectionReason().toLowerCase().contains("rút đơn"))) {
                    isWithdrawn = true;
                } else {
                    List<RecruitmentPipelineLog> logs = pipelineLogRepository.findByApplicationIdOrderByCreatedAtDesc(existingApp.getApplicationId());
                    if (!logs.isEmpty()) {
                        RecruitmentPipelineLog latestLog = logs.get(0);
                        if (user.getUserId().equals(latestLog.getChangedBy())
                                || (latestLog.getNotes() != null && latestLog.getNotes().contains("WITHDRAWN_BY_CANDIDATE"))) {
                            isWithdrawn = true;
                        }
                    }
                }
            }

            if (isWithdrawn) {
                // Ứng viên tự rút trước đó: Cho phép nộp lại CV mới
                existingApp.setCv(cv);
                existingApp.setCoverLetter(request.getCoverLetter());
                existingApp.setStatus(ApplicationStatus.APPLIED);
                existingApp.setRejectionReason(null);
                Application savedApp = applicationRepository.save(existingApp);

                pipelineLogRepository.save(RecruitmentPipelineLog.builder()
                        .applicationId(savedApp.getApplicationId())
                        .fromStage(ApplicationStatus.REJECTED)
                        .toStage(ApplicationStatus.APPLIED)
                        .notes("Ứng viên đã nộp lại hồ sơ ứng tuyển với CV cập nhật")
                        .changedBy(user.getUserId())
                        .build());

                try {
                    aiJobMatchService.calculateAndSaveMatch(candidate, job, cv);
                } catch (Throwable ex) {
                    log.warn("AI match calculation non-blocking warning: {}", ex.getMessage());
                }

                notificationService.createNotification(
                        user.getUserId(),
                        com.hiremate.enums.NotificationType.APPLICATION_STATUS,
                        "Nộp lại hồ sơ ứng tuyển thành công!",
                        "Bạn đã nộp lại hồ sơ thành công vào vị trí: " + job.getTitle() + " tại " + (job.getCompany() != null ? job.getCompany().getCompanyName() : "công ty tuyển dụng"),
                        savedApp.getApplicationId(),
                        "applications"
                );

                if (job.getRecruiter() != null && job.getRecruiter().getRecruiterId() != null) {
                    notificationService.createNotification(
                            job.getRecruiter().getRecruiterId(),
                            com.hiremate.enums.NotificationType.APPLICATION_STATUS,
                            "Ứng viên nộp lại hồ sơ!",
                            "Ứng viên " + user.getFullName() + " vừa nộp lại hồ sơ vào vị trí " + job.getTitle() + " với CV cập nhật",
                            savedApp.getApplicationId(),
                            "applications"
                    );
                }

                candidateAppsCache.remove(user.getUserId());
                return mapToResponse(savedApp);
            } else if (existingApp.getStatus() == ApplicationStatus.REJECTED) {
                java.time.LocalDateTime lastUpdated = existingApp.getUpdatedAt() != null ? existingApp.getUpdatedAt() : existingApp.getCreatedAt();
                long daysSince = lastUpdated != null ? java.time.temporal.ChronoUnit.DAYS.between(lastUpdated, java.time.LocalDateTime.now()) : 999;
                int cooldownDays = 30; // Giãn cách 30 ngày cho đợt tuyển dụng tiếp theo

                // Chỉ coi là đợt tuyển dụng mới (isNewWave) nếu tin tuyển dụng được gia hạn hoặc tạo sau ngày ứng viên bị từ chối
                boolean isNewWave = (job.getUpdatedAt() != null && lastUpdated != null && job.getUpdatedAt().isAfter(lastUpdated.plusDays(1)));
                if (daysSince >= cooldownDays || isNewWave) {
                    // Đã qua thời gian giãn cách 30 ngày hoặc mở đợt mới: Cho phép ứng tuyển lại đợt mới
                    existingApp.setCv(cv);
                    existingApp.setCoverLetter(request.getCoverLetter());
                    existingApp.setStatus(ApplicationStatus.APPLIED);
                    existingApp.setRejectionReason(null);
                    Application savedApp = applicationRepository.save(existingApp);

                    String noteMsg = isNewWave 
                            ? "Ứng viên nộp lại hồ sơ vào đợt tuyển dụng mới của vị trí này"
                            : "Ứng viên nộp lại hồ sơ sau thời gian giãn cách (" + daysSince + " ngày)";
                    pipelineLogRepository.save(RecruitmentPipelineLog.builder()
                            .applicationId(savedApp.getApplicationId())
                            .fromStage(ApplicationStatus.REJECTED)
                            .toStage(ApplicationStatus.APPLIED)
                            .notes(noteMsg)
                            .changedBy(user.getUserId())
                            .build());

                    try {
                        aiJobMatchService.calculateAndSaveMatch(candidate, job, cv);
                    } catch (Throwable ex) {
                        log.warn("AI match calculation non-blocking warning: {}", ex.getMessage());
                    }

                    notificationService.createNotification(
                            user.getUserId(),
                            com.hiremate.enums.NotificationType.APPLICATION_STATUS,
                            "Nộp lại hồ sơ ứng tuyển thành công!",
                            "Bạn đã nộp lại hồ sơ thành công vào vị trí: " + job.getTitle() + " sau thời gian giãn cách.",
                            savedApp.getApplicationId(),
                            "applications"
                    );

                    if (job.getRecruiter() != null && job.getRecruiter().getRecruiterId() != null) {
                        notificationService.createNotification(
                                job.getRecruiter().getRecruiterId(),
                                com.hiremate.enums.NotificationType.APPLICATION_STATUS,
                                "Ứng viên nộp lại hồ sơ đợt mới!",
                                "Ứng viên " + user.getFullName() + " vừa nộp lại hồ sơ vào vị trí " + job.getTitle() + " sau đợt tuyển dụng trước.",
                                savedApp.getApplicationId(),
                                "applications"
                        );
                    }

                    candidateAppsCache.remove(user.getUserId());
                    return mapToResponse(savedApp);
                } else {
                    long daysRemaining = cooldownDays - daysSince;
                    throw new BadRequestException("Hồ sơ ứng tuyển của bạn đã từng bị từ chối cho vị trí này. Theo chính sách tuyển dụng, bạn có thể nộp lại hồ sơ sau " + daysRemaining + " ngày nữa (thời gian giãn cách 30 ngày) để hoàn thiện thêm kỹ năng & kinh nghiệm.");
                }
            } else {
                throw new BadRequestException("Bạn đang có hồ sơ ứng tuyển cho vị trí này (trạng thái: " + existingApp.getStatus() + "). Vui lòng theo dõi tiến trình tại mục Việc làm đã ứng tuyển.");
            }
        }

        Application application = Application.builder()
                .job(job)
                .candidate(candidate)
                .cv(cv)
                .coverLetter(request.getCoverLetter())
                .status(ApplicationStatus.APPLIED)
                .build();

        Application savedApp;
        try {
            savedApp = applicationRepository.save(application);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            log.warn("Race condition: Trùng lặp đơn nộp song song của ứng viên #{} cho vị trí #{}. Đang thu hồi bản ghi duplicate.", candidate.getCandidateId(), job.getJobId());
            Application existingApp = applicationRepository.findByJob_JobIdAndCandidate_CandidateId(job.getJobId(), candidate.getCandidateId()).orElse(null);
            if (existingApp != null) {
                return mapToResponse(existingApp);
            }
            throw new BadRequestException("Hồ sơ ứng tuyển của bạn đang được hệ thống xử lý, vui lòng theo dõi tại mục Việc làm đã ứng tuyển.");
        }

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

        // Kiểm tra quyền: chính Recruiter đăng tin, Recruiter cùng công ty, hoặc ADMIN
        if (!isAuthorizedRecruiterForJob(job, user)) {
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
        Long companyId = recruiterRepository.findById(recruiterId)
                .map(r -> r.getCompany() != null ? r.getCompany().getCompanyId() : null)
                .orElse(null);
        if (companyId == null) {
            companyId = companyRepository.findByRecruiterId(recruiterId)
                    .map(Company::getCompanyId)
                    .orElse(null);
        }

        List<Application> apps = (companyId != null)
                ? applicationRepository.findByCompanyId(companyId)
                : applicationRepository.findByRecruiterId(recruiterId);
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
                if (request.getStatus() == ApplicationStatus.HIRED && e.getMessage() != null && e.getMessage().contains("đã tuyển đủ chỉ tiêu")) {
                    log.warn(">> [ApplicationService] Dừng duyệt batch HIRED vì đã đạt đủ chỉ tiêu tuyển dụng.");
                    break;
                }
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

        // Kiểm tra quyền: recruiter đăng tin, recruiter cùng công ty, hoặc ADMIN
        if (!isAuthorizedRecruiterForJob(job, user)) {
            throw new SecurityException("Unauthorized to modify this application.");
        }

        // Chặn không cho phép thay đổi trạng thái nếu ứng viên đã chủ động rút đơn hoặc đã từ chối Offer
        if (application.getStatus() == ApplicationStatus.REJECTED
                && application.getRejectionReason() != null
                && (application.getRejectionReason().contains("WITHDRAWN_BY_CANDIDATE")
                    || application.getRejectionReason().contains("OFFER_DECLINED_BY_CANDIDATE"))) {
            throw new IllegalStateException("Ứng viên đã chủ động rút đơn hoặc từ chối Offer nhận việc, không thể thay đổi trạng thái hồ sơ.");
        }

        ApplicationStatus previousStatus = application.getStatus();

        // Kiểm tra trần chỉ tiêu tuyển dụng (vacanciesCount guard): Chặn không cho phê duyệt quá số lượng tuyển
        if (request.getStatus() == ApplicationStatus.HIRED && previousStatus != ApplicationStatus.HIRED && job != null) {
            long currentHired = applicationRepository.countByJob_JobIdAndStatus(job.getJobId(), ApplicationStatus.HIRED);
            if (job.getVacanciesCount() != null && job.getVacanciesCount() > 0 && currentHired >= job.getVacanciesCount()) {
                throw new BadRequestException(String.format(
                        "Không thể phê duyệt trúng tuyển! Vị trí \"%s\" đã tuyển đủ chỉ tiêu (%d/%d nhân sự). Vui lòng nâng chỉ tiêu tuyển dụng nếu muốn tuyển thêm.",
                        job.getTitle(), currentHired, job.getVacanciesCount()));
            }
        }

        // Kiểm tra thời gian phỏng vấn không được ở trong quá khứ
        if (request.getStatus() == ApplicationStatus.INTERVIEWING && request.getNotes() != null) {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("ngày\\s+(\\d{4}-\\d{2}-\\d{2})\\s+lúc\\s+(\\d{2}:\\d{2})").matcher(request.getNotes());
            if (m.find()) {
                try {
                    java.time.LocalDateTime interviewTime = java.time.LocalDateTime.parse(m.group(1) + "T" + m.group(2) + ":00");
                    if (interviewTime.isBefore(java.time.LocalDateTime.now().plusMinutes(30))) {
                        throw new BadRequestException("Thời gian phỏng vấn không hợp lệ! Lịch hẹn phỏng vấn phải sau thời điểm hiện tại ít nhất 30 phút.");
                    }
                } catch (java.time.format.DateTimeParseException ignored) {}
            }
        }

        // Ràng buộc pipeline: Không cho phép chuyển lùi trạng thái của ứng viên đã HIRED về lại APPLIED hoặc SCREENING
        if (previousStatus == ApplicationStatus.HIRED && (request.getStatus() == ApplicationStatus.APPLIED || request.getStatus() == ApplicationStatus.SCREENING)) {
            throw new BadRequestException("Không thể chuyển lùi trạng thái của ứng viên đã trúng tuyển chính thức (HIRED) về lại vòng nộp hồ sơ hoặc sàng lọc.");
        }

        application.setStatus(request.getStatus());
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            application.setEvaluationNotes(request.getNotes());
        }
        if (request.getStatus() == ApplicationStatus.REJECTED && request.getNotes() != null && !request.getNotes().isBlank()) {
            application.setRejectionReason(request.getNotes());
        }
        Application updated = applicationRepository.save(application);

        // Kiểm tra phục hồi trạng thái tin khi chỉ tiêu bị khuyết (chuyển từ HIRED về trạng thái khác)
        if (previousStatus == ApplicationStatus.HIRED && request.getStatus() != ApplicationStatus.HIRED) {
            checkAndReopenJobIfVacanciesOpen(job);
        }

        // Kiểm tra chỉ tiêu tuyển dụng vacanciesCount khi chuyển sang HIRED
        if (request.getStatus() == ApplicationStatus.HIRED && job != null) {
            long hiredCount = applicationRepository.countByJob_JobIdAndStatus(job.getJobId(), ApplicationStatus.HIRED);
            if (job.getVacanciesCount() != null && job.getVacanciesCount() > 0 && hiredCount >= job.getVacanciesCount()) {
                job.setStatus(com.hiremate.enums.JobStatus.CLOSED);
                jobRepository.save(job);
                log.info(">> [ApplicationService] Vị trí #{} ({}) đã tuyển đủ chỉ tiêu ({}/{}). Tự động đóng tin tuyển dụng.",
                        job.getJobId(), job.getTitle(), hiredCount, job.getVacanciesCount());
                if (job.getRecruiter() != null && job.getRecruiter().getRecruiterId() != null) {
                    notificationService.createNotification(
                            job.getRecruiter().getRecruiterId(),
                            com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                            "Tuyển dụng đủ chỉ tiêu!",
                            "🎉 Vị trí \"" + job.getTitle() + "\" đã tuyển đủ chỉ tiêu (" + hiredCount + "/" + job.getVacanciesCount() + " nhân sự). Hệ thống đã tự động đóng nhận hồ sơ mới cho tin này.",
                            job.getJobId(),
                            "jobs"
                    );
                }
            }
        }

        // Hỗ trợ tự động chuyển đổi tuần tự khi HR nhảy cóc (APPLIED/SCREENING -> SHORTLISTED -> INTERVIEWING/OFFERED)
        if ((previousStatus == ApplicationStatus.APPLIED || previousStatus == ApplicationStatus.SCREENING)
                && (request.getStatus() == ApplicationStatus.INTERVIEWING || request.getStatus() == ApplicationStatus.OFFERED)) {
            pipelineLogRepository.save(RecruitmentPipelineLog.builder()
                    .applicationId(updated.getApplicationId())
                    .fromStage(previousStatus)
                    .toStage(ApplicationStatus.SHORTLISTED)
                    .notes("Hệ thống tự động đồng bộ danh sách rút gọn (Shortlisted)")
                    .changedBy(user.getUserId())
                    .build());
            if (request.getStatus() == ApplicationStatus.OFFERED) {
                pipelineLogRepository.save(RecruitmentPipelineLog.builder()
                        .applicationId(updated.getApplicationId())
                        .fromStage(ApplicationStatus.SHORTLISTED)
                        .toStage(ApplicationStatus.INTERVIEWING)
                        .notes("Hệ thống tự động đồng bộ qua vòng phỏng vấn (Interviewing)")
                        .changedBy(user.getUserId())
                        .build());
            }
        }

        // Log pipeline transition chính thức
        pipelineLogRepository.save(RecruitmentPipelineLog.builder()
                .applicationId(updated.getApplicationId())
                .fromStage(previousStatus)
                .toStage(request.getStatus())
                .notes(request.getNotes() != null ? request.getNotes() : "Recruiter updated pipeline stage")
                .changedBy(user.getUserId())
                .build());

        // Gửi thông báo chuyển vòng cho Ứng viên (Chuông in-app + Email tự động)
        // Lưu ý: Nếu trạng thái không đổi hoặc ghi chú nội bộ HR ([{...]), không gửi thông báo/email cho ứng viên để tránh lộ ghi chú nội bộ
        boolean isInternalNoteOnly = (request.getStatus() == previousStatus)
                || (request.getNotes() != null && request.getNotes().trim().startsWith("[{"));

        if (!isInternalNoteOnly && application.getCandidate() != null && application.getCandidate().getCandidateId() != null) {
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

            // 2. Gửi Email thông báo trực tiếp đến hộp thư của ứng viên
            try {
                User candidateUser = application.getCandidate().getUser();
                if (candidateUser == null || candidateUser.getEmail() == null) {
                    candidateUser = userRepository.findById(candidateId).orElse(null);
                }

                if (candidateUser != null && candidateUser.getEmail() != null) {
                    if ((request.getCustomSubject() != null && !request.getCustomSubject().isBlank())
                            || (request.getCustomBody() != null && !request.getCustomBody().isBlank())) {
                        emailService.sendCustomEmail(
                                candidateUser.getEmail(),
                                candidateUser.getFullName(),
                                request.getCustomSubject(),
                                request.getCustomBody()
                        );
                    } else {
                        emailService.sendApplicationStatusEmail(
                                candidateUser.getEmail(),
                                candidateUser.getFullName(),
                                job.getTitle(),
                                companyName,
                                request.getStatus(),
                                request.getNotes()
                        );
                    }
                }
            } catch (Exception ex) {
                // Email gửi lỗi hoặc chưa cấu hình SMTP không làm gián đoạn transaction
                log.warn(">> [ApplicationService] Lỗi gửi email chuyển vòng đơn #{}: {}", applicationId, ex.getMessage());
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
        boolean isAuthorizedHR = isAuthorizedRecruiterForJob(application.getJob(), user);

        if (!isCandidate && !isAuthorizedHR) {
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

        boolean isWithdrawn = app.getStatus() == ApplicationStatus.REJECTED
                && app.getRejectionReason() != null
                && (app.getRejectionReason().contains("WITHDRAWN_BY_CANDIDATE") || app.getRejectionReason().toLowerCase().contains("rút đơn"));

        boolean isOfferDeclined = app.getStatus() == ApplicationStatus.REJECTED
                && app.getRejectionReason() != null
                && (app.getRejectionReason().contains("OFFER_DECLINED_BY_CANDIDATE")
                    || app.getRejectionReason().toLowerCase().contains("từ chối offer")
                    || app.getRejectionReason().toLowerCase().contains("từ chối lời mời nhận việc"));

        return ApplicationResponse.builder()
                .applicationId(app.getApplicationId())
                .jobId(job != null ? job.getJobId() : null)
                .jobTitle(jobTitle)
                .companyName(companyName)
                .candidateId(candidate != null ? candidate.getCandidateId() : null)
                .candidateName(candidateUser != null ? candidateUser.getFullName() : "Candidate")
                .candidateEmail(candidateUser != null ? candidateUser.getEmail() : null)
                .candidatePhone(candidateUser != null ? candidateUser.getPhone() : null)
                .candidateAvatar(candidateUser != null ? candidateUser.getAvatarUrl() : null)
                .withdrawnByCandidate(isWithdrawn)
                .offerDeclinedByCandidate(isOfferDeclined)
                .recruiterId(recruiterId)
                .recruiterName(recruiterName)
                .recruiterEmail(recruiterEmail)
                .cvId(cv != null ? cv.getCvId() : null)
                .cvUrl(cv != null ? cv.getFileUrl() : null)
                .status(app.getStatus())
                .coverLetter(app.getCoverLetter())
                .matchingScore(score)
                .evaluationNotes(app.getEvaluationNotes())
                .notes(app.getEvaluationNotes())
                .rejectionReason(app.getRejectionReason())
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

        if (application.getStatus() == ApplicationStatus.REJECTED) {
            throw new IllegalStateException("Hồ sơ đã có kết quả xét duyệt từ Nhà tuyển dụng, không thể rút đơn ứng tuyển.");
        }

        ApplicationStatus oldStatus = application.getStatus();
        application.setStatus(ApplicationStatus.REJECTED);
        application.setRejectionReason("WITHDRAWN_BY_CANDIDATE: Ứng viên đã chủ động rút đơn ứng tuyển.");
        Application updated = applicationRepository.save(application);

        // Ghi log vào recruitment_pipeline_logs
        pipelineLogRepository.save(com.hiremate.entity.RecruitmentPipelineLog.builder()
                .applicationId(application.getApplicationId())
                .fromStage(oldStatus != null ? oldStatus : ApplicationStatus.APPLIED)
                .toStage(ApplicationStatus.REJECTED)
                .changedBy(candidate.getUserId())
                .notes("WITHDRAWN_BY_CANDIDATE: Ứng viên đã chủ động rút đơn ứng tuyển.")
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
            String phone = (app.getCandidatePhone() != null && !app.getCandidatePhone().isBlank()) ? app.getCandidatePhone() : "Chưa cập nhật";
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

    @Override
    @Transactional
    public ApplicationResponse respondOffer(Long applicationId, com.hiremate.dto.request.RespondOfferRequest request, User candidate) {
        if (candidate == null) {
            throw new SecurityException("Vui lòng đăng nhập để thực hiện thao tác này.");
        }
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new com.hiremate.exception.ResourceNotFoundException("Application not found with ID " + applicationId));

        if (application.getCandidate() == null || !application.getCandidate().getCandidateId().equals(candidate.getUserId())) {
            throw new SecurityException("Unauthorized to respond to this application offer.");
        }

        if (application.getStatus() != ApplicationStatus.OFFERED) {
            throw new IllegalStateException("Đơn ứng tuyển hiện không ở trạng thái Chờ phản hồi Offer (OFFERED). Trạng thái hiện tại: " + application.getStatus());
        }

        Job job = application.getJob();
        String candidateName = candidate.getFullName() != null ? candidate.getFullName() : (candidate.getEmail() != null ? candidate.getEmail() : "Ứng viên");
        String jobTitle = job != null ? job.getTitle() : "vị trí ứng tuyển";

        if (request != null && request.isAccepted()) {
            application.setStatus(ApplicationStatus.HIRED);
            Application updated = applicationRepository.save(application);

            // Kiểm tra chỉ tiêu tuyển dụng vacanciesCount khi chuyển sang HIRED
            if (job != null) {
                long hiredCount = applicationRepository.countByJob_JobIdAndStatus(job.getJobId(), ApplicationStatus.HIRED);
                if (job.getVacanciesCount() != null && job.getVacanciesCount() > 0 && hiredCount >= job.getVacanciesCount()) {
                    job.setStatus(com.hiremate.enums.JobStatus.CLOSED);
                    jobRepository.save(job);
                    log.info(">> [ApplicationService] Vị trí #{} ({}) đã tuyển đủ chỉ tiêu ({}/{}). Tự động đóng tin tuyển dụng.",
                            job.getJobId(), job.getTitle(), hiredCount, job.getVacanciesCount());
                    if (job.getRecruiter() != null && job.getRecruiter().getRecruiterId() != null) {
                        notificationService.createNotification(
                                job.getRecruiter().getRecruiterId(),
                                com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                                "Tuyển dụng đủ chỉ tiêu!",
                                "🎉 Vị trí \"" + job.getTitle() + "\" đã tuyển đủ chỉ tiêu (" + hiredCount + "/" + job.getVacanciesCount() + " nhân sự). Hệ thống đã tự động đóng nhận hồ sơ mới cho tin này.",
                                job.getJobId(),
                                "jobs"
                        );
                    }
                }
            }

            // Ghi log pipeline
            pipelineLogRepository.save(com.hiremate.entity.RecruitmentPipelineLog.builder()
                    .applicationId(updated.getApplicationId())
                    .fromStage(ApplicationStatus.OFFERED)
                    .toStage(ApplicationStatus.HIRED)
                    .changedBy(candidate.getUserId())
                    .notes(request.getNote() != null && !request.getNote().isBlank() ? request.getNote() : "Ứng viên đã chính thức ký xác nhận nhận việc (Offer Acceptance).")
                    .build());

            // Gửi thông báo cho Nhà tuyển dụng
            if (job != null && job.getRecruiter() != null && job.getRecruiter().getRecruiterId() != null) {
                notificationService.createNotification(
                        job.getRecruiter().getRecruiterId(),
                        com.hiremate.enums.NotificationType.APPLICATION_STATUS,
                        "Ứng viên đã ký nhận Offer!",
                        "🎉 Ứng viên " + candidateName + " đã chính thức ký xác nhận nhận việc (Offer) cho vị trí \"" + jobTitle + "\"!",
                        updated.getApplicationId(),
                        "applications"
                );
            }

            candidateAppsCache.remove(candidate.getUserId());
            log.info(">> [ApplicationService] Ứng viên #{} đã ký chấp thuận Offer cho đơn #{}", candidate.getUserId(), applicationId);
            return mapToResponse(updated);
        } else {
            String note = (request != null && request.getNote() != null && !request.getNote().isBlank()) ? request.getNote() : "Ứng viên từ chối lời mời nhận việc.";
            String declineReason = "OFFER_DECLINED_BY_CANDIDATE: " + note;
            application.setStatus(ApplicationStatus.REJECTED);
            application.setRejectionReason(declineReason);
            Application updated = applicationRepository.save(application);

            // Ghi log pipeline
            pipelineLogRepository.save(com.hiremate.entity.RecruitmentPipelineLog.builder()
                    .applicationId(updated.getApplicationId())
                    .fromStage(ApplicationStatus.OFFERED)
                    .toStage(ApplicationStatus.REJECTED)
                    .changedBy(candidate.getUserId())
                    .notes(declineReason)
                    .build());

            // Gửi thông báo cho Nhà tuyển dụng
            if (job != null && job.getRecruiter() != null && job.getRecruiter().getRecruiterId() != null) {
                notificationService.createNotification(
                        job.getRecruiter().getRecruiterId(),
                        com.hiremate.enums.NotificationType.APPLICATION_STATUS,
                        "Ứng viên từ chối Offer",
                        "Ứng viên " + candidateName + " đã từ chối thư mời nhận việc (Offer) cho vị trí \"" + jobTitle + "\". Lý do: " + note,
                        updated.getApplicationId(),
                        "applications"
                );
            }

            candidateAppsCache.remove(candidate.getUserId());
            log.info(">> [ApplicationService] Ứng viên #{} đã từ chối Offer cho đơn #{}", candidate.getUserId(), applicationId);
            checkAndReopenJobIfVacanciesOpen(job);
            return mapToResponse(updated);
        }
    }

    /**
     * Tự động phục hồi trạng thái tin tuyển dụng từ CLOSED về PUBLISHED nếu còn hạn nộp
     * nhưng chỉ tiêu tuyển dụng thực tế (hiredCount) bị khuyết so với vacanciesCount.
     */
    private void checkAndReopenJobIfVacanciesOpen(Job job) {
        if (job == null || job.getStatus() != com.hiremate.enums.JobStatus.CLOSED) {
            return;
        }
        if (job.getApprovalStatus() == com.hiremate.enums.JobApprovalStatus.APPROVED) {
            java.time.LocalDate today = java.time.LocalDate.now();
            boolean notExpired = job.getDeadlineDate() == null || !job.getDeadlineDate().isBefore(today);
            if (notExpired && job.getVacanciesCount() != null && job.getVacanciesCount() > 0) {
                long hiredCount = applicationRepository.countByJob_JobIdAndStatus(job.getJobId(), ApplicationStatus.HIRED);
                if (hiredCount < job.getVacanciesCount()) {
                    job.setStatus(com.hiremate.enums.JobStatus.PUBLISHED);
                    jobRepository.save(job);
                    log.info(">> [ApplicationService] Vị trí #{} ({}) khuyết chỉ tiêu ({}/{}). Tự động phục hồi trạng thái sang PUBLISHED.",
                            job.getJobId(), job.getTitle(), hiredCount, job.getVacanciesCount());
                    if (job.getRecruiter() != null && job.getRecruiter().getRecruiterId() != null) {
                        notificationService.createNotification(
                                job.getRecruiter().getRecruiterId(),
                                com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                                "Tự động mở lại tin tuyển dụng!",
                                "Tin tuyển dụng \"" + job.getTitle() + "\" đã tự động chuyển sang PUBLISHED để tiếp tục nhận hồ sơ vì còn thiếu chỉ tiêu (" + hiredCount + "/" + job.getVacanciesCount() + " nhân sự).",
                                job.getJobId(),
                                "jobs"
                        );
                    }
                }
            }
        }
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
