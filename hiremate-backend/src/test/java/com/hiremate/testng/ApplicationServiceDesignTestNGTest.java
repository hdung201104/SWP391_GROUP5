package com.hiremate.testng;

import com.hiremate.dto.request.ApplyRequest;
import com.hiremate.dto.request.UpdateApplicationStatusRequest;
import com.hiremate.dto.response.ApplicationResponse;
import com.hiremate.entity.AiJobMatch;
import com.hiremate.entity.Application;
import com.hiremate.entity.Candidate;
import com.hiremate.entity.Company;
import com.hiremate.entity.Cv;
import com.hiremate.entity.Job;
import com.hiremate.entity.Recruiter;
import com.hiremate.entity.RecruitmentPipelineLog;
import com.hiremate.entity.User;
import com.hiremate.enums.ApplicationStatus;
import com.hiremate.enums.CompanyStatus;
import com.hiremate.enums.JobApprovalStatus;
import com.hiremate.enums.JobStatus;
import com.hiremate.enums.UserRole;
import com.hiremate.enums.UserStatus;
import com.hiremate.exception.BadRequestException;
import com.hiremate.repository.AiJobMatchRepository;
import com.hiremate.repository.ApplicationRepository;
import com.hiremate.repository.CandidateRepository;
import com.hiremate.repository.CompanyRepository;
import com.hiremate.repository.CvRepository;
import com.hiremate.repository.JobRepository;
import com.hiremate.repository.RecruiterRepository;
import com.hiremate.repository.RecruitmentPipelineLogRepository;
import com.hiremate.repository.UserRepository;
import com.hiremate.service.AiJobMatchService;
import com.hiremate.service.EmailService;
import com.hiremate.service.NotificationService;
import com.hiremate.service.impl.ApplicationServiceImpl;
import com.hiremate.testng.TestDataLoader;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * ==============================================================================
 * HIREMATE AI - APPLICATION MANAGEMENT UNIT TESTS (54 CASES SUITE: FEATURE 3)
 * Workbook: HireMate_APPLICATION_UnitTest_Template_6Cases.xlsx
 * Exactly 6 test cases per function across 3 functions = 18 cases
 * Framework: TestNG 7.9.0 + Mockito (Isolated, no production DB)
 * ==============================================================================
 */
public class ApplicationServiceDesignTestNGTest {

    private ApplicationRepository applicationRepository;
    private JobRepository jobRepository;
    private CvRepository cvRepository;
    private RecruitmentPipelineLogRepository pipelineLogRepository;
    private AiJobMatchRepository aiJobMatchRepository;
    private CandidateRepository candidateRepository;
    private UserRepository userRepository;
    private RecruiterRepository recruiterRepository;
    private CompanyRepository companyRepository;
    private NotificationService notificationService;
    private AiJobMatchService aiJobMatchService;
    private EmailService emailService;

    private ApplicationServiceImpl applicationService;

    private User candidateUser;
    private Candidate sampleCandidate;
    private User recruiterUser;
    private Recruiter sampleRecruiter;
    private Company sampleVerifiedCompany;
    private Job sampleJob;
    private Cv sampleCv;

    @BeforeMethod
    public void setUp() {
        applicationRepository = mock(ApplicationRepository.class);
        jobRepository = mock(JobRepository.class);
        cvRepository = mock(CvRepository.class);
        pipelineLogRepository = mock(RecruitmentPipelineLogRepository.class);
        aiJobMatchRepository = mock(AiJobMatchRepository.class);
        candidateRepository = mock(CandidateRepository.class);
        userRepository = mock(UserRepository.class);
        recruiterRepository = mock(RecruiterRepository.class);
        companyRepository = mock(CompanyRepository.class);
        notificationService = mock(NotificationService.class);
        aiJobMatchService = mock(AiJobMatchService.class);
        emailService = mock(EmailService.class);

        applicationService = new ApplicationServiceImpl(
                applicationRepository,
                jobRepository,
                cvRepository,
                pipelineLogRepository,
                aiJobMatchRepository,
                candidateRepository,
                userRepository,
                recruiterRepository,
                companyRepository,
                notificationService,
                aiJobMatchService,
                emailService
        );

        candidateUser = User.builder()
                .userId(101L)
                .email("candidate@hiremate.ai")
                .fullName("Nguyen Van Candidate")
                .role(UserRole.CANDIDATE)
                .status(UserStatus.ACTIVE)
                .build();

        sampleCandidate = Candidate.builder()
                .candidateId(101L)
                .user(candidateUser)
                .build();

        sampleVerifiedCompany = Company.builder()
                .companyId(10L)
                .companyName("FPT Software")
                .status(CompanyStatus.VERIFIED)
                .build();

        recruiterUser = User.builder()
                .userId(301L)
                .email("recruiter@fpt.com")
                .role(UserRole.RECRUITER)
                .status(UserStatus.ACTIVE)
                .build();

        sampleRecruiter = Recruiter.builder()
                .recruiterId(301L)
                .user(recruiterUser)
                .company(sampleVerifiedCompany)
                .build();

        sampleJob = Job.builder()
                .jobId(1L)
                .title("Fullstack Developer")
                .status(JobStatus.PUBLISHED)
                .approvalStatus(JobApprovalStatus.APPROVED)
                .company(sampleVerifiedCompany)
                .recruiter(sampleRecruiter)
                .deadlineDate(LocalDate.now())
                .vacanciesCount(2)
                .build();

        sampleCv = Cv.builder()
                .cvId(501L)
                .candidateId(101L)
                .fileName("Fullstack CV")
                .isDefault(true)
                .fileUrl("https://storage.hiremate.ai/cvs/fullstack.pdf")
                .build();
    }

    // ==========================================================================
    // FUNCTION 1: applyToJob(ApplyRequest, User) — 6 TEST CASES (APP-A01 to APP-A13)
    // ==========================================================================

    @Test(description = "APP-A01 / UTCID01: Ứng tuyển lần đầu hợp lệ vào tin PUBLISHED & APPROVED với deadline đúng hôm nay")
    public void test_APP_A01_UTCID01_applyToJob_FirstTimeValid_Success() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("applyToJob").path("APP_A01");
        ApplyRequest request = new ApplyRequest();
        request.setJobId(1L);
        request.setCvId(501L);
        request.setCoverLetter(data.path("coverLetter").asText("Thư ứng tuyển hợp lệ đúng hạn"));

        when(jobRepository.findById(1L)).thenReturn(Optional.of(sampleJob));
        when(candidateRepository.findById(101L)).thenReturn(Optional.of(sampleCandidate));
        when(cvRepository.findById(501L)).thenReturn(Optional.of(sampleCv));
        when(applicationRepository.findByJob_JobIdAndCandidate_CandidateId(1L, 101L)).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> {
            Application app = inv.getArgument(0);
            app.setApplicationId(1001L);
            return app;
        });

        ApplicationResponse response = applicationService.applyToJob(request, candidateUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getStatus(), ApplicationStatus.APPLIED);
        verify(applicationRepository, times(1)).save(any(Application.class));
        verify(notificationService, atLeastOnce()).createNotification(any(), any(), any(), any(), any(), any());
    }

    @Test(
        description = "APP-A03 / UTCID02: Ứng tuyển thất bại do tin tuyển dụng đang ở trạng thái DRAFT",
        expectedExceptions = BadRequestException.class,
        expectedExceptionsMessageRegExp = ".*Tin tuyển dụng này hiện đã đóng hoặc không còn nhận hồ sơ.*"
    )
    public void test_APP_A03_UTCID02_applyToJob_JobDraft_ThrowsBadRequestException() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("applyToJob").path("APP_A03");
        Job draftJob = Job.builder()
                .jobId(1L)
                .status(JobStatus.valueOf(data.path("jobStatus").asText("DRAFT")))
                .approvalStatus(JobApprovalStatus.APPROVED)
                .build();

        ApplyRequest request = new ApplyRequest();
        request.setJobId(1L);

        when(jobRepository.findById(1L)).thenReturn(Optional.of(draftJob));

        applicationService.applyToJob(request, candidateUser);
    }

    @Test(
        description = "APP-A04 / UTCID03: Ứng tuyển thất bại do tin tuyển dụng đang chờ duyệt (approvalStatus = PENDING)",
        expectedExceptions = BadRequestException.class,
        expectedExceptionsMessageRegExp = ".*Tin tuyển dụng này hiện đã đóng hoặc không còn nhận hồ sơ.*"
    )
    public void test_APP_A04_UTCID03_applyToJob_JobApprovalPending_ThrowsBadRequestException() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("applyToJob").path("APP_A04");
        Job pendingJob = Job.builder()
                .jobId(1L)
                .status(JobStatus.valueOf(data.path("jobStatus").asText("PUBLISHED")))
                .approvalStatus(JobApprovalStatus.valueOf(data.path("approvalStatus").asText("PENDING")))
                .build();

        ApplyRequest request = new ApplyRequest();
        request.setJobId(1L);

        when(jobRepository.findById(1L)).thenReturn(Optional.of(pendingJob));

        applicationService.applyToJob(request, candidateUser);
    }

    @Test(
        description = "APP-A07 / UTCID04: Ứng tuyển thất bại do tin tuyển dụng đã quá hạn nộp hồ sơ (deadlineDate = today - 1)",
        expectedExceptions = BadRequestException.class,
        expectedExceptionsMessageRegExp = ".*Tin tuyển dụng này đã hết hạn nộp hồ sơ.*"
    )
    public void test_APP_A07_UTCID04_applyToJob_DeadlineYesterday_ThrowsBadRequestException() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("applyToJob").path("APP_A07");
        Job expiredJob = Job.builder()
                .jobId(1L)
                .status(JobStatus.PUBLISHED)
                .approvalStatus(JobApprovalStatus.APPROVED)
                .company(sampleVerifiedCompany)
                .deadlineDate(LocalDate.now().plusDays(data.path("deadlineDaysOffset").asInt(-1)))
                .build();

        ApplyRequest request = new ApplyRequest();
        request.setJobId(1L);

        when(jobRepository.findById(1L)).thenReturn(Optional.of(expiredJob));

        applicationService.applyToJob(request, candidateUser);
    }

    @Test(
        description = "APP-A10 / UTCID05: Ứng tuyển thất bại do ứng viên không có CV nào hợp lệ",
        expectedExceptions = BadRequestException.class,
        expectedExceptionsMessageRegExp = ".*Vui lòng tải lên hoặc chọn một CV trước khi ứng tuyển.*"
    )
    public void test_APP_A10_UTCID05_applyToJob_NoCvAvailable_ThrowsBadRequestException() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("applyToJob").path("APP_A10");
        ApplyRequest request = new ApplyRequest();
        request.setJobId(1L);
        request.setCvId(data.path("cvId").isNull() ? null : data.path("cvId").asLong());

        when(jobRepository.findById(1L)).thenReturn(Optional.of(sampleJob));
        when(candidateRepository.findById(101L)).thenReturn(Optional.of(sampleCandidate));
        when(cvRepository.findByCandidateIdAndIsDefaultTrue(101L)).thenReturn(Optional.empty());
        when(cvRepository.findByCandidateIdOrderByCreatedAtDesc(101L)).thenReturn(Collections.emptyList());
        when(cvRepository.findByCandidateId(101L)).thenReturn(Collections.emptyList());

        applicationService.applyToJob(request, candidateUser);
    }

    @Test(
        description = "APP-A13 / UTCID06: Từ chối nộp đơn trùng khi đã có đơn ứng tuyển đang hoạt động cho cùng một tin",
        expectedExceptions = BadRequestException.class,
        expectedExceptionsMessageRegExp = ".*hồ sơ ứng tuyển cho vị trí này.*"
    )
    public void test_APP_A13_UTCID06_applyToJob_DuplicateActiveApplication_ThrowsException() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("applyToJob").path("APP_A13");
        ApplyRequest request = new ApplyRequest();
        request.setJobId(1L);
        request.setCvId(501L);

        Application activeApp = Application.builder()
                .applicationId(888L)
                .status(ApplicationStatus.valueOf(data.path("existingStatus").asText("APPLIED")))
                .build();

        when(jobRepository.findById(1L)).thenReturn(Optional.of(sampleJob));
        when(candidateRepository.findById(101L)).thenReturn(Optional.of(sampleCandidate));
        when(cvRepository.findById(501L)).thenReturn(Optional.of(sampleCv));
        when(applicationRepository.findByJob_JobIdAndCandidate_CandidateId(1L, 101L)).thenReturn(Optional.of(activeApp));

        applicationService.applyToJob(request, candidateUser);
    }

    // ==========================================================================
    // FUNCTION 2: getJobApplications(Long, ApplicationStatus, User) — 6 TEST CASES (APP-G01 to APP-G06)
    // ==========================================================================

    @Test(description = "APP-G01 / UTCID01: Recruiter sở hữu xem danh sách hồ sơ, kết quả được sắp xếp giảm dần theo điểm AI")
    public void test_APP_G01_UTCID01_getJobApplications_OwnerRecruiter_SortedByScore_Success() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("getJobApplications").path("APP_G01");
        Long jobId = data.path("jobId").asLong(1L);

        Candidate cand1 = Candidate.builder().candidateId(101L).user(User.builder().userId(101L).fullName("Cand 1").build()).build();
        Candidate cand2 = Candidate.builder().candidateId(102L).user(User.builder().userId(102L).fullName("Cand 2").build()).build();

        Application app1 = Application.builder().applicationId(1L).candidate(cand1).job(sampleJob).status(ApplicationStatus.APPLIED).build();
        Application app2 = Application.builder().applicationId(2L).candidate(cand2).job(sampleJob).status(ApplicationStatus.APPLIED).build();

        AiJobMatch match1 = AiJobMatch.builder().candidate(cand1).matchingScore(70.0f).build();
        AiJobMatch match2 = AiJobMatch.builder().candidate(cand2).matchingScore(90.0f).build();

        when(jobRepository.findById(jobId)).thenReturn(Optional.of(sampleJob));
        when(applicationRepository.findByJob_JobId(jobId)).thenReturn(Arrays.asList(app1, app2));
        when(aiJobMatchRepository.findByJob_JobIdOrderByMatchingScoreDesc(jobId)).thenReturn(Arrays.asList(match2, match1));

        List<ApplicationResponse> responses = applicationService.getJobApplications(jobId, null, recruiterUser);

        Assert.assertNotNull(responses);
        Assert.assertEquals(responses.size(), 2);
    }

    @Test(
        description = "APP-G02 / UTCID02: Recruiter khác công ty bị từ chối truy cập danh sách ứng viên (SecurityException)",
        expectedExceptions = SecurityException.class,
        expectedExceptionsMessageRegExp = ".*Unauthorized access to this job's candidates.*"
    )
    public void test_APP_G02_UTCID02_getJobApplications_UnauthorizedUser_ThrowsSecurityException() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("getJobApplications").path("APP_G02");
        Long jobId = data.path("jobId").asLong(1L);
        Long otherRecruiterId = data.path("otherRecruiterId").asLong(999L);
        User stranger = User.builder().userId(otherRecruiterId).role(UserRole.RECRUITER).build();

        when(jobRepository.findById(jobId)).thenReturn(Optional.of(sampleJob));
        when(recruiterRepository.findById(otherRecruiterId)).thenReturn(Optional.empty());

        applicationService.getJobApplications(jobId, null, stranger);
    }

    @Test(
        description = "APP-G03 / UTCID03: Tìm kiếm danh sách ứng viên thất bại khi Job ID không tồn tại (404)",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Job not found.*"
    )
    public void test_APP_G03_UTCID03_getJobApplications_JobNotFound_ThrowsIllegalArgumentException() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("getJobApplications").path("APP_G03");
        Long nonExistentJobId = data.path("nonExistentJobId").asLong(404L);
        when(jobRepository.findById(nonExistentJobId)).thenReturn(Optional.empty());

        applicationService.getJobApplications(nonExistentJobId, null, recruiterUser);
    }

    @Test(description = "APP-G04 / UTCID04: Lọc danh sách ứng viên theo trạng thái SCREENING cụ thể")
    public void test_APP_G04_UTCID04_getJobApplications_FilterByScreeningStatus_Success() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("getJobApplications").path("APP_G04");
        ApplicationStatus filterStatus = ApplicationStatus.valueOf(data.path("filterStatus").asText("SCREENING"));

        Candidate cand = Candidate.builder().candidateId(101L).user(candidateUser).build();
        Application screeningApp = Application.builder().applicationId(10L).candidate(cand).job(sampleJob).status(filterStatus).build();

        when(jobRepository.findById(1L)).thenReturn(Optional.of(sampleJob));
        when(applicationRepository.findByJob_JobIdAndStatus(1L, filterStatus)).thenReturn(Collections.singletonList(screeningApp));
        when(aiJobMatchRepository.findByJob_JobIdOrderByMatchingScoreDesc(1L)).thenReturn(Collections.emptyList());

        List<ApplicationResponse> responses = applicationService.getJobApplications(1L, filterStatus, recruiterUser);

        Assert.assertNotNull(responses);
        Assert.assertEquals(responses.size(), 1);
        Assert.assertEquals(responses.get(0).getStatus(), filterStatus);
        verify(applicationRepository, times(1)).findByJob_JobIdAndStatus(1L, filterStatus);
    }

    @Test(description = "APP-G05 / UTCID05: Filter SCREENING trả 0 hồ sơ (biên kích thước 0 đối chứng size=1 APP-G04)")
    public void test_APP_G05_UTCID05_getJobApplications_FilterScreeningEmptyList_ReturnsEmpty() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("getJobApplications").path("APP_G05");
        ApplicationStatus filterStatus = ApplicationStatus.valueOf(data.path("filterStatus").asText("SCREENING"));

        when(jobRepository.findById(1L)).thenReturn(Optional.of(sampleJob));
        when(applicationRepository.findByJob_JobIdAndStatus(1L, filterStatus)).thenReturn(Collections.emptyList());

        List<ApplicationResponse> responses = applicationService.getJobApplications(1L, filterStatus, recruiterUser);

        Assert.assertNotNull(responses);
        Assert.assertTrue(responses.isEmpty());
        verify(applicationRepository, times(1)).findByJob_JobIdAndStatus(1L, filterStatus);
    }

    @Test(description = "APP-G06 / UTCID06: Tái sử dụng điểm AI từ cache DB, không gọi tính toán mới")
    public void test_APP_G06_UTCID06_getJobApplications_CachedAiScore_NoNewAiCall_Success() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("getJobApplications").path("APP_G06");
        float cachedScore = (float) data.path("cachedAiScore").asDouble(88.5);

        Candidate cand = Candidate.builder().candidateId(101L).user(candidateUser).build();
        Application app = Application.builder().applicationId(1L).candidate(cand).job(sampleJob).status(ApplicationStatus.APPLIED).build();
        AiJobMatch cachedMatch = AiJobMatch.builder().candidate(cand).matchingScore(cachedScore).build();

        when(jobRepository.findById(1L)).thenReturn(Optional.of(sampleJob));
        when(applicationRepository.findByJob_JobId(1L)).thenReturn(Collections.singletonList(app));
        when(aiJobMatchRepository.findByJob_JobIdOrderByMatchingScoreDesc(1L)).thenReturn(Collections.singletonList(cachedMatch));

        List<ApplicationResponse> responses = applicationService.getJobApplications(1L, null, recruiterUser);

        Assert.assertNotNull(responses);
        Assert.assertEquals(responses.size(), 1);
        Assert.assertEquals(responses.get(0).getMatchingScore(), cachedScore, 0.01f);
        verify(aiJobMatchService, never()).calculateAndSaveMatch(any(), any(), any());
    }

    // ==========================================================================
    // FUNCTION 3: updateApplicationStatus(Long, UpdateApplicationStatusRequest, User) — 6 TEST CASES (APP-U01 to APP-U12)
    // ==========================================================================

    @Test(description = "APP-U01 / UTCID01: APPLIED -> INTERVIEWING, giờ phỏng vấn trên ngưỡng 30 phút (now + 31 phút)")
    public void test_APP_U01_UTCID01_updateApplicationStatus_InterviewTimeAbove30Min_Success() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("updateStatus").path("APP_U01");
        Application app = Application.builder()
                .applicationId(1L)
                .job(sampleJob)
                .candidate(sampleCandidate)
                .status(ApplicationStatus.APPLIED)
                .build();

        LocalDateTime validTime = LocalDateTime.now().plusMinutes(data.path("interviewMinutesOffset").asInt(31));
        String notes = String.format("Hẹn phỏng vấn vào ngày %s lúc %s",
                validTime.toLocalDate(),
                validTime.toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm")));

        UpdateApplicationStatusRequest request = new UpdateApplicationStatusRequest();
        request.setStatus(ApplicationStatus.valueOf(data.path("targetStatus").asText("INTERVIEWING")));
        request.setNotes(notes);

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        ApplicationResponse response = applicationService.updateApplicationStatus(1L, request, recruiterUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getStatus(), ApplicationStatus.INTERVIEWING);
        verify(applicationRepository, times(1)).save(app);
        verify(pipelineLogRepository, atLeastOnce()).save(any(RecruitmentPipelineLog.class));
    }

    @Test(
        description = "APP-U02 / UTCID02: Cập nhật thất bại do Recruiter không có quyền trên tin đăng (SecurityException)",
        expectedExceptions = SecurityException.class,
        expectedExceptionsMessageRegExp = ".*Unauthorized to modify this application.*"
    )
    public void test_APP_U02_UTCID02_updateApplicationStatus_UnauthorizedRecruiter_ThrowsSecurityException() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("updateStatus").path("APP_U02");
        Long otherRecruiterId = data.path("otherRecruiterId").asLong(999L);
        Application app = Application.builder().applicationId(1L).job(sampleJob).build();
        User stranger = User.builder().userId(otherRecruiterId).role(UserRole.RECRUITER).build();

        UpdateApplicationStatusRequest request = new UpdateApplicationStatusRequest();
        request.setStatus(ApplicationStatus.valueOf(data.path("targetStatus").asText("REJECTED")));

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
        when(recruiterRepository.findById(otherRecruiterId)).thenReturn(Optional.empty());

        applicationService.updateApplicationStatus(1L, request, stranger);
    }

    @Test(
        description = "APP-U03 / UTCID03: Cập nhật thất bại do Application ID không tồn tại (404)",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Application not found.*"
    )
    public void test_APP_U03_UTCID03_updateApplicationStatus_ApplicationNotFound_ThrowsIllegalArgumentException() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("updateStatus").path("APP_U03");
        Long nonExistentId = data.path("nonExistentApplicationId").asLong(404L);
        UpdateApplicationStatusRequest request = new UpdateApplicationStatusRequest();
        request.setStatus(ApplicationStatus.valueOf(data.path("targetStatus").asText("SCREENING")));

        when(applicationRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        applicationService.updateApplicationStatus(nonExistentId, request, recruiterUser);
    }

    @Test(
        description = "APP-U08 / UTCID04: Từ chối chuyển HIRED khi chỉ tiêu tuyển dụng vacanciesCount đã đủ (2/2)",
        expectedExceptions = BadRequestException.class,
        expectedExceptionsMessageRegExp = ".*đã tuyển đủ chỉ tiêu.*"
    )
    public void test_APP_U08_UTCID04_updateApplicationStatus_HiredQuotaFull_ThrowsBadRequestException() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("updateStatus").path("APP_U08");
        Application app = Application.builder()
                .applicationId(1L)
                .job(sampleJob) // vacanciesCount = 2
                .status(ApplicationStatus.OFFERED)
                .build();

        UpdateApplicationStatusRequest request = new UpdateApplicationStatusRequest();
        request.setStatus(ApplicationStatus.valueOf(data.path("targetStatus").asText("HIRED")));

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
        when(applicationRepository.countByJob_JobIdAndStatus(1L, ApplicationStatus.HIRED)).thenReturn(data.path("currentHired").asLong(2L));

        applicationService.updateApplicationStatus(1L, request, recruiterUser);
    }

    @Test(description = "APP-U09 / UTCID05: Chuyển HIRED thành công cho vị trí cuối cùng và tự động đóng tin (Job CLOSED)")
    public void test_APP_U09_UTCID05_updateApplicationStatus_HiredQuotaLastSpot_ClosesJob_Success() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("updateStatus").path("APP_U09");
        Application app = Application.builder()
                .applicationId(1L)
                .job(sampleJob) // vacanciesCount = 2, status = PUBLISHED
                .candidate(sampleCandidate)
                .status(ApplicationStatus.OFFERED)
                .build();

        UpdateApplicationStatusRequest request = new UpdateApplicationStatusRequest();
        request.setStatus(ApplicationStatus.valueOf(data.path("targetStatus").asText("HIRED")));

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
        // Trước khi chuyển: đã có 1 người HIRED
        when(applicationRepository.countByJob_JobIdAndStatus(1L, ApplicationStatus.HIRED))
                .thenReturn(data.path("currentHiredBefore").asLong(1L))
                .thenReturn(data.path("currentHiredAfter").asLong(2L));
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        ApplicationResponse response = applicationService.updateApplicationStatus(1L, request, recruiterUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getStatus(), ApplicationStatus.HIRED);
        verify(jobRepository, atLeastOnce()).save(argThat(j -> j.getStatus() == JobStatus.CLOSED));
    }

    @Test(
        description = "APP-U12 / UTCID06: Từ chối xếp lịch phỏng vấn trước mốc tối thiểu 30 phút tính từ thời điểm hiện tại (now + 29m)",
        expectedExceptions = BadRequestException.class,
        expectedExceptionsMessageRegExp = ".*Thời gian phỏng vấn không hợp lệ.*Lịch hẹn phỏng vấn phải sau thời điểm hiện tại ít nhất 30 phút.*"
    )
    public void test_APP_U12_UTCID06_updateApplicationStatus_InterviewTimeUnder30Min_ThrowsBadRequestException() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("updateStatus").path("APP_U12");
        Application app = Application.builder()
                .applicationId(1L)
                .job(sampleJob)
                .candidate(sampleCandidate)
                .status(ApplicationStatus.SCREENING)
                .build();

        // Lịch hẹn chỉ cách hiện tại 29 phút (vi phạm ràng buộc >= 30 phút đối chứng APP-U01 31 phút)
        LocalDateTime invalidTime = LocalDateTime.now().plusMinutes(data.path("interviewMinutesOffset").asInt(29));
        String notes = String.format("Hẹn phỏng vấn vào ngày %s lúc %s",
                invalidTime.toLocalDate(),
                invalidTime.toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm")));

        UpdateApplicationStatusRequest request = new UpdateApplicationStatusRequest();
        request.setStatus(ApplicationStatus.INTERVIEWING);
        request.setNotes(notes);

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));

        applicationService.updateApplicationStatus(1L, request, recruiterUser);
    }

    // ==========================================================================
    // EXTENDED TESTS (KNOWN GAPS COVERAGE): applyToJob reapply, cooldown, suspended company, fallback CV
    // ==========================================================================

    @Test(description = "APP-EXT-01: Cho phép ứng viên nộp lại hồ sơ sau khi đã tự nguyện rút đơn (WITHDRAWN_BY_CANDIDATE)")
    public void test_APP_EXT01_applyToJob_WithdrawnReapply_Success() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("extended").path("APP_EXT01");
        Application withdrawnApp = Application.builder()
                .applicationId(888L)
                .job(sampleJob)
                .candidate(sampleCandidate)
                .status(ApplicationStatus.REJECTED)
                .rejectionReason(data.path("rejectionReason").asText("WITHDRAWN_BY_CANDIDATE: Ứng viên xin rút đơn"))
                .build();

        ApplyRequest request = new ApplyRequest();
        request.setJobId(1L);
        request.setCvId(501L);
        request.setCoverLetter(data.path("coverLetter").asText("Thư nộp lại đơn mới sau khi rút đơn"));

        when(jobRepository.findById(1L)).thenReturn(Optional.of(sampleJob));
        when(candidateRepository.findById(101L)).thenReturn(Optional.of(sampleCandidate));
        when(cvRepository.findById(501L)).thenReturn(Optional.of(sampleCv));
        when(applicationRepository.findByJob_JobIdAndCandidate_CandidateId(1L, 101L)).thenReturn(Optional.of(withdrawnApp));
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        ApplicationResponse response = applicationService.applyToJob(request, candidateUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getStatus(), ApplicationStatus.APPLIED);
        verify(applicationRepository, times(1)).save(any(Application.class));
        verify(pipelineLogRepository, times(1)).save(any(RecruitmentPipelineLog.class));
    }

    @Test(description = "APP-EXT-02: Cho phép ứng viên nộp lại hồ sơ sau thời gian giãn cách 30 ngày kể từ khi bị từ chối")
    public void test_APP_EXT02_applyToJob_RejectedCooldown30DaysPassed_AllowsReapply_Success() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("extended").path("APP_EXT02");
        Application oldRejectedApp = Application.builder()
                .applicationId(889L)
                .job(sampleJob)
                .candidate(sampleCandidate)
                .status(ApplicationStatus.REJECTED)
                .rejectionReason(data.path("rejectionReason").asText("Chưa phù hợp đợt này"))
                .updatedAt(LocalDateTime.now().minusDays(data.path("daysAgo").asInt(35))) // Đã qua 35 ngày (> 30 ngày)
                .build();

        ApplyRequest request = new ApplyRequest();
        request.setJobId(1L);
        request.setCvId(501L);
        request.setCoverLetter(data.path("coverLetter").asText("Nộp lại sau 35 ngày bồi dưỡng kiến thức"));

        when(jobRepository.findById(1L)).thenReturn(Optional.of(sampleJob));
        when(candidateRepository.findById(101L)).thenReturn(Optional.of(sampleCandidate));
        when(cvRepository.findById(501L)).thenReturn(Optional.of(sampleCv));
        when(applicationRepository.findByJob_JobIdAndCandidate_CandidateId(1L, 101L)).thenReturn(Optional.of(oldRejectedApp));
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        ApplicationResponse response = applicationService.applyToJob(request, candidateUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getStatus(), ApplicationStatus.APPLIED);
        verify(applicationRepository, times(1)).save(any(Application.class));
    }

    @Test(
        description = "APP-EXT-03: Từ chối nộp lại hồ sơ khi thời gian giãn cách chưa đủ 30 ngày kể từ khi bị từ chối",
        expectedExceptions = BadRequestException.class,
        expectedExceptionsMessageRegExp = ".*từng bị từ chối.*thời gian giãn cách 30 ngày.*"
    )
    public void test_APP_EXT03_applyToJob_RejectedCooldownUnder30Days_ThrowsBadRequestException() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("extended").path("APP_EXT03");
        Application recentRejectedApp = Application.builder()
                .applicationId(890L)
                .job(sampleJob)
                .candidate(sampleCandidate)
                .status(ApplicationStatus.REJECTED)
                .rejectionReason(data.path("rejectionReason").asText("Chưa đạt phỏng vấn"))
                .updatedAt(LocalDateTime.now().minusDays(data.path("daysAgo").asInt(10))) // Mới 10 ngày (< 30 ngày)
                .build();

        ApplyRequest request = new ApplyRequest();
        request.setJobId(1L);
        request.setCvId(501L);

        when(jobRepository.findById(1L)).thenReturn(Optional.of(sampleJob));
        when(candidateRepository.findById(101L)).thenReturn(Optional.of(sampleCandidate));
        when(cvRepository.findById(501L)).thenReturn(Optional.of(sampleCv));
        when(applicationRepository.findByJob_JobIdAndCandidate_CandidateId(1L, 101L)).thenReturn(Optional.of(recentRejectedApp));

        applicationService.applyToJob(request, candidateUser);
    }

    @Test(
        description = "APP-EXT-04: Từ chối nộp đơn khi doanh nghiệp của tin tuyển dụng đang bị tạm khóa (SUSPENDED)",
        expectedExceptions = BadRequestException.class,
        expectedExceptionsMessageRegExp = ".*Doanh nghiệp này chưa hoàn tất thẩm định.*hoặc đang bị tạm ngưng hoạt động.*"
    )
    public void test_APP_EXT04_applyToJob_CompanySuspended_ThrowsBadRequestException() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("extended").path("APP_EXT04");
        Company suspendedCompany = Company.builder()
                .companyId(20L)
                .companyName(data.path("companyName").asText("Violating Corp"))
                .status(CompanyStatus.valueOf(data.path("companyStatus").asText("SUSPENDED")))
                .build();

        Job jobWithSuspendedCompany = Job.builder()
                .jobId(2L)
                .status(JobStatus.PUBLISHED)
                .approvalStatus(JobApprovalStatus.APPROVED)
                .company(suspendedCompany)
                .deadlineDate(LocalDate.now().plusDays(5))
                .build();

        ApplyRequest request = new ApplyRequest();
        request.setJobId(2L);

        when(jobRepository.findById(2L)).thenReturn(Optional.of(jobWithSuspendedCompany));

        applicationService.applyToJob(request, candidateUser);
    }

    @Test(description = "APP-EXT-05: Tự động fallback sang CV mặc định khi ứng viên gửi cvId không thuộc quyền sở hữu của mình")
    public void test_APP_EXT05_applyToJob_CvNotOwnedByCandidate_FallsBackToDefaultCv_Success() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("extended").path("APP_EXT05");
        long strangerCvId = data.path("strangerCvId").asLong(999L);
        long strangerCandidateId = data.path("strangerCandidateId").asLong(999L);
        long defaultCvId = data.path("defaultCvId").asLong(501L);
        sampleCv.setCvId(defaultCvId);

        Cv strangerCv = Cv.builder()
                .cvId(strangerCvId)
                .candidateId(strangerCandidateId) // Thuộc người khác
                .fileName("Stranger CV")
                .build();

        ApplyRequest request = new ApplyRequest();
        request.setJobId(1L);
        request.setCvId(strangerCvId); // Gửi nhầm CV người khác

        when(jobRepository.findById(1L)).thenReturn(Optional.of(sampleJob));
        when(candidateRepository.findById(101L)).thenReturn(Optional.of(sampleCandidate));
        when(cvRepository.findById(strangerCvId)).thenReturn(Optional.of(strangerCv));
        when(cvRepository.findByCandidateIdAndIsDefaultTrue(101L)).thenReturn(Optional.of(sampleCv));
        when(applicationRepository.findByJob_JobIdAndCandidate_CandidateId(1L, 101L)).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> {
            Application a = inv.getArgument(0);
            a.setApplicationId(1005L);
            return a;
        });

        ApplicationResponse response = applicationService.applyToJob(request, candidateUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getStatus(), ApplicationStatus.APPLIED);
        verify(applicationRepository, times(1)).save(any(Application.class));
    }
}

