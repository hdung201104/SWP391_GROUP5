package com.hiremate.testng;

import com.hiremate.dto.request.ApplyRequest;
import com.hiremate.dto.request.UpdateApplicationStatusRequest;
import com.hiremate.dto.response.AiJobMatchResponse;
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
import com.hiremate.enums.NotificationType;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * ==============================================================================
 * HIREMATE AI - APPLICATION SERVICE BRANCH COVERAGE UNIT TESTS (24 CASES SUITE)
 * Formula: Branch Coverage Tối Đa = (3 Tests Exception Điểm Nóng) + (5 Tests Deep-Path Đảo Cờ TRUE/FALSE)
 * Exactly 8 test cases per function across 3 functions = 24 cases total.
 * Targets:
 *   1. applyToJob(ApplyRequest, User) -> 8 cases (APP-A01 to APP-A08)
 *   2. getJobApplications(Long, ApplicationStatus, User) -> 8 cases (APP-G01 to APP-G08)
 *   3. updateApplicationStatus(Long, UpdateApplicationStatusRequest, User) -> 8 cases (APP-U01 to APP-U08)
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
                .deadlineDate(LocalDate.now().plusDays(10))
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
    // FUNCTION 1: applyToJob(ApplyRequest, User) — 8 TEST CASES (APP-A01 to APP-A08)
    // Formula: 3 Exception Hotspots + 5 Deep-Path Flag Flipping
    // ==========================================================================

    @Test(
        description = "APP-A01 (Exception 1): Nộp đơn thất bại khi Job ID không tồn tại trong hệ thống (404 Not Found)",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Job not found.*"
    )
    public void test_APP_A01_applyToJob_JobNotFound_ThrowsIllegalArgumentException() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("applyToJob").path("APP_A01");
        Long nonExistentJobId = data.path("nonExistentJobId").asLong(999L);

        ApplyRequest request = new ApplyRequest();
        request.setJobId(nonExistentJobId);

        when(jobRepository.findById(nonExistentJobId)).thenReturn(Optional.empty());

        applicationService.applyToJob(request, candidateUser);
    }

    @Test(
        description = "APP-A02 (Exception 2): Nộp đơn thất bại khi tin chưa được phê duyệt (status=DRAFT / approvalStatus=PENDING)",
        expectedExceptions = BadRequestException.class,
        expectedExceptionsMessageRegExp = ".*Tin tuyển dụng này hiện đã đóng hoặc không còn nhận hồ sơ.*"
    )
    public void test_APP_A02_applyToJob_JobDraftOrPending_ThrowsBadRequestException() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("applyToJob").path("APP_A02");
        Job draftJob = Job.builder()
                .jobId(1L)
                .status(JobStatus.valueOf(data.path("jobStatus").asText("DRAFT")))
                .approvalStatus(JobApprovalStatus.valueOf(data.path("approvalStatus").asText("PENDING")))
                .build();

        ApplyRequest request = new ApplyRequest();
        request.setJobId(1L);

        when(jobRepository.findById(1L)).thenReturn(Optional.of(draftJob));

        applicationService.applyToJob(request, candidateUser);
    }

    @Test(
        description = "APP-A03 (Exception 3): Nộp đơn thất bại khi doanh nghiệp của tin tuyển dụng đang bị tạm đình chỉ (SUSPENDED)",
        expectedExceptions = BadRequestException.class,
        expectedExceptionsMessageRegExp = ".*Doanh nghiệp này chưa hoàn tất thẩm định.*hoặc đang bị tạm ngưng hoạt động.*"
    )
    public void test_APP_A03_applyToJob_CompanySuspendedOrBanned_ThrowsBadRequestException() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("applyToJob").path("APP_A03");
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

    @Test(description = "APP-A04 (Deep-Path 1): Ứng tuyển lần đầu hợp lệ với CV chỉ định, thời hạn còn hiệu lực, thông báo đầy đủ cho Recruiter")
    public void test_APP_A04_applyToJob_DeepPath_FirstTimeValid_ExplicitCv_NotifiesRecruiter_Success() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("applyToJob").path("APP_A04");
        ApplyRequest request = new ApplyRequest();
        request.setJobId(1L);
        request.setCvId(501L);
        request.setCoverLetter(data.path("coverLetter").asText("Hồ sơ ứng tuyển chính thức"));

        when(jobRepository.findById(1L)).thenReturn(Optional.of(sampleJob));
        when(candidateRepository.findById(101L)).thenReturn(Optional.of(sampleCandidate));
        when(cvRepository.findById(501L)).thenReturn(Optional.of(sampleCv));
        when(applicationRepository.findByJob_JobIdAndCandidate_CandidateId(1L, 101L)).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> {
            Application a = inv.getArgument(0);
            a.setApplicationId(1001L);
            return a;
        });

        ApplicationResponse response = applicationService.applyToJob(request, candidateUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getStatus(), ApplicationStatus.APPLIED);
        verify(applicationRepository, times(1)).save(any(Application.class));
        verify(pipelineLogRepository, times(1)).save(any(RecruitmentPipelineLog.class));
        verify(aiJobMatchService, times(1)).calculateAndSaveMatch(sampleCandidate, sampleJob, sampleCv);
        verify(notificationService, times(2)).createNotification(any(), any(), any(), any(), any(), any());
    }

    @Test(description = "APP-A05 (Deep-Path 2): Tự động fallback CV mặc định khi CV không thuộc sở hữu, tin không có hạn chót và không có Recruiter")
    public void test_APP_A05_applyToJob_DeepPath_FallbackDefaultCv_NoRecruiter_DeadlineNull_AiWarningHandled() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("applyToJob").path("APP_A05");
        long strangerCvId = data.path("strangerCvId").asLong(999L);
        long strangerCandidateId = data.path("strangerCandidateId").asLong(888L);
        long defaultCvId = data.path("defaultCvId").asLong(501L);
        sampleCv.setCvId(defaultCvId);

        Cv strangerCv = Cv.builder()
                .cvId(strangerCvId)
                .candidateId(strangerCandidateId)
                .fileName("Stranger CV")
                .build();

        Job jobWithoutRecruiter = Job.builder()
                .jobId(3L)
                .title("Remote Specialist")
                .status(JobStatus.PUBLISHED)
                .approvalStatus(JobApprovalStatus.APPROVED)
                .company(sampleVerifiedCompany)
                .deadlineDate(null) // Không có deadline
                .recruiter(null)    // Không có recruiter
                .build();

        ApplyRequest request = new ApplyRequest();
        request.setJobId(3L);
        request.setCvId(strangerCvId);

        when(jobRepository.findById(3L)).thenReturn(Optional.of(jobWithoutRecruiter));
        when(candidateRepository.findById(101L)).thenReturn(Optional.of(sampleCandidate));
        when(cvRepository.findById(strangerCvId)).thenReturn(Optional.of(strangerCv));
        when(cvRepository.findByCandidateIdAndIsDefaultTrue(101L)).thenReturn(Optional.of(sampleCv));
        when(applicationRepository.findByJob_JobIdAndCandidate_CandidateId(3L, 101L)).thenReturn(Optional.empty());
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> {
            Application a = inv.getArgument(0);
            a.setApplicationId(1005L);
            return a;
        });
        doThrow(new RuntimeException("AI server timeout non-blocking")).when(aiJobMatchService)
                .calculateAndSaveMatch(any(), any(), any());

        ApplicationResponse response = applicationService.applyToJob(request, candidateUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getStatus(), ApplicationStatus.APPLIED);
        verify(applicationRepository, times(1)).save(any(Application.class));
        verify(notificationService, times(1)).createNotification(eq(101L), any(), any(), any(), any(), any());
    }

    @Test(description = "APP-A06 (Deep-Path 3): Cho phép ứng viên nộp lại đơn với CV mới sau khi đã chủ động rút đơn (WITHDRAWN_BY_CANDIDATE)")
    public void test_APP_A06_applyToJob_DeepPath_WithdrawnReapply_CvUpdated_Success() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("applyToJob").path("APP_A06");
        Application withdrawnApp = Application.builder()
                .applicationId(888L)
                .job(sampleJob)
                .candidate(sampleCandidate)
                .status(ApplicationStatus.REJECTED)
                .rejectionReason(data.path("rejectionReason").asText("WITHDRAWN_BY_CANDIDATE: Ứng viên tự rút đơn"))
                .build();

        ApplyRequest request = new ApplyRequest();
        request.setJobId(1L);
        request.setCvId(501L);
        request.setCoverLetter(data.path("coverLetter").asText("Nộp lại đơn ứng tuyển sau khi tự rút đơn"));

        when(jobRepository.findById(1L)).thenReturn(Optional.of(sampleJob));
        when(candidateRepository.findById(101L)).thenReturn(Optional.of(sampleCandidate));
        when(cvRepository.findById(501L)).thenReturn(Optional.of(sampleCv));
        when(applicationRepository.findByJob_JobIdAndCandidate_CandidateId(1L, 101L)).thenReturn(Optional.of(withdrawnApp));
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        ApplicationResponse response = applicationService.applyToJob(request, candidateUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getStatus(), ApplicationStatus.APPLIED);
        Assert.assertNull(withdrawnApp.getRejectionReason());
        verify(pipelineLogRepository, times(1)).save(any(RecruitmentPipelineLog.class));
        verify(notificationService, atLeastOnce()).createNotification(any(), any(), any(), any(), any(), any());
    }

    @Test(description = "APP-A07 (Deep-Path 4): Cho phép ứng viên nộp lại đơn sau thời gian giãn cách 30 ngày (daysSince >= 30)")
    public void test_APP_A07_applyToJob_DeepPath_RejectedCooldown30DaysPassed_AllowsReapply_Success() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("applyToJob").path("APP_A07");
        Application oldRejectedApp = Application.builder()
                .applicationId(889L)
                .job(sampleJob)
                .candidate(sampleCandidate)
                .status(ApplicationStatus.REJECTED)
                .rejectionReason(data.path("rejectionReason").asText("Chưa phù hợp đợt trước"))
                .updatedAt(LocalDateTime.now().minusDays(data.path("daysAgo").asInt(35)))
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
        description = "APP-A08 (Deep-Path 5): Chặn nộp đơn trùng lặp khi ứng viên đã có hồ sơ đang được xử lý (trạng thái APPLIED)",
        expectedExceptions = BadRequestException.class,
        expectedExceptionsMessageRegExp = ".*hồ sơ ứng tuyển cho vị trí này.*"
    )
    public void test_APP_A08_applyToJob_DeepPath_ActiveDuplicateApplication_ThrowsBadRequestException() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("applyToJob").path("APP_A08");
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
    // FUNCTION 2: getJobApplications(Long, ApplicationStatus, User) — 8 TEST CASES
    // Formula: 3 Exception/Boundary Hotspots + 5 Deep-Path Flag Flipping
    // ==========================================================================

    @Test(
        description = "APP-G01 (Exception 1): Tìm kiếm danh sách ứng viên thất bại do Job ID không tồn tại (404 Not Found)",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Job not found.*"
    )
    public void test_APP_G01_getJobApplications_JobNotFound_ThrowsIllegalArgumentException() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("getJobApplications").path("APP_G01");
        Long nonExistentJobId = data.path("nonExistentJobId").asLong(404L);
        when(jobRepository.findById(nonExistentJobId)).thenReturn(Optional.empty());

        applicationService.getJobApplications(nonExistentJobId, null, recruiterUser);
    }

    @Test(
        description = "APP-G02 (Exception 2): Recruiter khác công ty bị từ chối truy cập danh sách ứng viên (SecurityException)",
        expectedExceptions = SecurityException.class,
        expectedExceptionsMessageRegExp = ".*Unauthorized access to this job's candidates.*"
    )
    public void test_APP_G02_getJobApplications_UnauthorizedRecruiter_ThrowsSecurityException() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("getJobApplications").path("APP_G02");
        Long jobId = data.path("jobId").asLong(1L);
        Long otherRecruiterId = data.path("otherRecruiterId").asLong(999L);
        User stranger = User.builder().userId(otherRecruiterId).role(UserRole.RECRUITER).build();

        when(jobRepository.findById(jobId)).thenReturn(Optional.of(sampleJob));
        when(recruiterRepository.findById(otherRecruiterId)).thenReturn(Optional.empty());

        applicationService.getJobApplications(jobId, null, stranger);
    }

    @Test(description = "APP-G03 (Boundary 3): Tin tuyển dụng chưa có ứng viên nào nộp hồ sơ -> trả về danh sách rỗng an toàn")
    public void test_APP_G03_getJobApplications_EmptyList_ReturnsEmptyList() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("getJobApplications").path("APP_G03");
        Long jobId = data.path("jobId").asLong(1L);

        when(jobRepository.findById(jobId)).thenReturn(Optional.of(sampleJob));
        when(applicationRepository.findByJob_JobId(jobId)).thenReturn(Collections.emptyList());

        List<ApplicationResponse> responses = applicationService.getJobApplications(jobId, null, recruiterUser);

        Assert.assertNotNull(responses);
        Assert.assertTrue(responses.isEmpty());
    }

    @Test(description = "APP-G04 (Deep-Path 1): Recruiter chính chủ lấy toàn bộ hồ sơ (status=null), dữ liệu AI batch pre-fetch được sắp xếp giảm dần")
    public void test_APP_G04_getJobApplications_DeepPath_NoStatusFilter_BatchAiMatches_SortedDesc() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("getJobApplications").path("APP_G04");
        Long jobId = data.path("jobId").asLong(1L);
        float score1 = (float) data.path("score1").asDouble(70.0);
        float score2 = (float) data.path("score2").asDouble(95.0);

        Candidate cand1 = Candidate.builder().candidateId(101L).user(User.builder().userId(101L).fullName("Cand 1").build()).build();
        Candidate cand2 = Candidate.builder().candidateId(102L).user(User.builder().userId(102L).fullName("Cand 2").build()).build();

        Application app1 = Application.builder().applicationId(1L).candidate(cand1).job(sampleJob).status(ApplicationStatus.APPLIED).build();
        Application app2 = Application.builder().applicationId(2L).candidate(cand2).job(sampleJob).status(ApplicationStatus.APPLIED).build();

        AiJobMatch match1 = AiJobMatch.builder().candidate(cand1).matchingScore(score1).build();
        AiJobMatch match2 = AiJobMatch.builder().candidate(cand2).matchingScore(score2).build();

        when(jobRepository.findById(jobId)).thenReturn(Optional.of(sampleJob));
        when(applicationRepository.findByJob_JobId(jobId)).thenReturn(Arrays.asList(app1, app2));
        when(aiJobMatchRepository.findByJob_JobIdOrderByMatchingScoreDesc(jobId)).thenReturn(Arrays.asList(match2, match1));

        List<ApplicationResponse> responses = applicationService.getJobApplications(jobId, null, recruiterUser);

        Assert.assertNotNull(responses);
        Assert.assertEquals(responses.size(), 2);
        Assert.assertEquals(responses.get(0).getMatchingScore(), score2, 0.01f);
        Assert.assertEquals(responses.get(1).getMatchingScore(), score1, 0.01f);
    }

    @Test(description = "APP-G05 (Deep-Path 2): Lọc danh sách ứng viên theo trạng thái SCREENING cụ thể (status != null)")
    public void test_APP_G05_getJobApplications_DeepPath_WithStatusFilter_Screening_Success() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("getJobApplications").path("APP_G05");
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

    @Test(description = "APP-G06 (Deep-Path 3): Điểm AI chưa có trong batch cache -> tự động gọi tính toán On-The-Fly và cập nhật điểm số")
    public void test_APP_G06_getJobApplications_DeepPath_MissingAiScore_AutoComputedOnTheFly() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("getJobApplications").path("APP_G06");
        Long jobId = data.path("jobId").asLong(1L);
        float computedScore = (float) data.path("computedScore").asDouble(85.5);

        Candidate cand = Candidate.builder().candidateId(101L).user(candidateUser).build();
        Application app = Application.builder().applicationId(1L).candidate(cand).job(sampleJob).cv(sampleCv).status(ApplicationStatus.APPLIED).build();

        when(jobRepository.findById(jobId)).thenReturn(Optional.of(sampleJob));
        when(applicationRepository.findByJob_JobId(jobId)).thenReturn(Collections.singletonList(app));
        when(aiJobMatchRepository.findByJob_JobIdOrderByMatchingScoreDesc(jobId)).thenReturn(Collections.emptyList());

        AiJobMatchResponse mockMatchResponse = AiJobMatchResponse.builder()
                .matchingScore(computedScore)
                .build();
        when(aiJobMatchService.calculateAndSaveMatch(cand, sampleJob, sampleCv)).thenReturn(mockMatchResponse);

        List<ApplicationResponse> responses = applicationService.getJobApplications(jobId, null, recruiterUser);

        Assert.assertNotNull(responses);
        Assert.assertEquals(responses.size(), 1);
        Assert.assertEquals(responses.get(0).getMatchingScore(), computedScore, 0.01f);
        verify(aiJobMatchService, times(1)).calculateAndSaveMatch(cand, sampleJob, sampleCv);
    }

    @Test(description = "APP-G07 (Deep-Path 4): Tài khoản ADMIN được miễn kiểm tra phân quyền Recruiter và xem toàn bộ ứng viên")
    public void test_APP_G07_getJobApplications_DeepPath_AdminUser_BypassesAuthorization() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("getJobApplications").path("APP_G07");
        Long jobId = data.path("jobId").asLong(1L);
        User adminUser = User.builder().userId(data.path("adminId").asLong(99L)).role(UserRole.ADMIN).build();

        when(jobRepository.findById(jobId)).thenReturn(Optional.of(sampleJob));
        when(applicationRepository.findByJob_JobId(jobId)).thenReturn(Collections.emptyList());

        List<ApplicationResponse> responses = applicationService.getJobApplications(jobId, null, adminUser);

        Assert.assertNotNull(responses);
        Assert.assertTrue(responses.isEmpty());
    }

    @Test(description = "APP-G08 (Deep-Path 5): Ngoại lệ từ Repository AI hoặc Service tính điểm được xử lý nuốt lỗi an toàn, không gián đoạn xem danh sách")
    public void test_APP_G08_getJobApplications_DeepPath_AiExceptionsHandledGracefully() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("getJobApplications").path("APP_G08");
        Long jobId = data.path("jobId").asLong(1L);

        Candidate cand = Candidate.builder().candidateId(101L).user(candidateUser).build();
        Application app = Application.builder().applicationId(1L).candidate(cand).job(sampleJob).cv(sampleCv).status(ApplicationStatus.APPLIED).build();

        when(jobRepository.findById(jobId)).thenReturn(Optional.of(sampleJob));
        when(applicationRepository.findByJob_JobId(jobId)).thenReturn(Collections.singletonList(app));
        when(aiJobMatchRepository.findByJob_JobIdOrderByMatchingScoreDesc(jobId)).thenThrow(new RuntimeException("DB match error"));
        when(aiJobMatchService.calculateAndSaveMatch(any(), any(), any())).thenThrow(new RuntimeException("AI compute failed"));

        List<ApplicationResponse> responses = applicationService.getJobApplications(jobId, null, recruiterUser);

        Assert.assertNotNull(responses);
        Assert.assertEquals(responses.size(), 1);
        Assert.assertNull(responses.get(0).getMatchingScore());
    }

    // ==========================================================================
    // FUNCTION 3: updateApplicationStatus(Long, UpdateApplicationStatusRequest, User) — 8 TEST CASES
    // Formula: 3 Exception Hotspots + 5 Deep-Path Flag Flipping
    // ==========================================================================

    @Test(
        description = "APP-U01 (Exception 1): Cập nhật trạng thái thất bại do Application ID không tồn tại (404 Not Found)",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Application not found.*"
    )
    public void test_APP_U01_updateApplicationStatus_ApplicationNotFound_ThrowsIllegalArgumentException() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("updateStatus").path("APP_U01");
        Long nonExistentId = data.path("nonExistentApplicationId").asLong(404L);
        UpdateApplicationStatusRequest request = new UpdateApplicationStatusRequest();
        request.setStatus(ApplicationStatus.valueOf(data.path("targetStatus").asText("SCREENING")));

        when(applicationRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        applicationService.updateApplicationStatus(nonExistentId, request, recruiterUser);
    }

    @Test(
        description = "APP-U02 (Exception 2): Recruiter không sở hữu và khác công ty bị từ chối cập nhật trạng thái hồ sơ",
        expectedExceptions = SecurityException.class,
        expectedExceptionsMessageRegExp = ".*Unauthorized to modify this application.*"
    )
    public void test_APP_U02_updateApplicationStatus_UnauthorizedRecruiter_ThrowsSecurityException() {
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
        description = "APP-U03 (Exception 3): Từ chối chuyển HIRED khi trần chỉ tiêu tuyển dụng vacanciesCount đã đạt mức tối đa (2/2)",
        expectedExceptions = BadRequestException.class,
        expectedExceptionsMessageRegExp = ".*đã tuyển đủ chỉ tiêu.*"
    )
    public void test_APP_U03_updateApplicationStatus_HiredQuotaFull_ThrowsBadRequestException() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("updateStatus").path("APP_U03");
        Application app = Application.builder()
                .applicationId(1L)
                .job(sampleJob)
                .status(ApplicationStatus.OFFERED)
                .build();

        UpdateApplicationStatusRequest request = new UpdateApplicationStatusRequest();
        request.setStatus(ApplicationStatus.valueOf(data.path("targetStatus").asText("HIRED")));

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
        when(applicationRepository.countByJob_JobIdAndStatus(1L, ApplicationStatus.HIRED)).thenReturn(data.path("currentHired").asLong(2L));

        applicationService.updateApplicationStatus(1L, request, recruiterUser);
    }

    @Test(description = "APP-U04 (Deep-Path 1): Phê duyệt HIRED chỉ tiêu cuối cùng -> Tự động chuyển Job sang CLOSED và gửi thông báo hệ thống cho Recruiter")
    public void test_APP_U04_updateApplicationStatus_DeepPath_HiredReachingQuota_AutoClosesJob_NotifiesRecruiter() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("updateStatus").path("APP_U04");
        Application app = Application.builder()
                .applicationId(1L)
                .job(sampleJob)
                .candidate(sampleCandidate)
                .status(ApplicationStatus.OFFERED)
                .build();

        UpdateApplicationStatusRequest request = new UpdateApplicationStatusRequest();
        request.setStatus(ApplicationStatus.valueOf(data.path("targetStatus").asText("HIRED")));

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
        when(applicationRepository.countByJob_JobIdAndStatus(1L, ApplicationStatus.HIRED))
                .thenReturn(data.path("currentHiredBefore").asLong(1L))
                .thenReturn(data.path("currentHiredAfter").asLong(2L));
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        ApplicationResponse response = applicationService.updateApplicationStatus(1L, request, recruiterUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getStatus(), ApplicationStatus.HIRED);
        verify(jobRepository, atLeastOnce()).save(argThat(j -> j.getStatus() == JobStatus.CLOSED));
        verify(notificationService, atLeastOnce()).createNotification(
                eq(sampleRecruiter.getRecruiterId()),
                eq(NotificationType.SYSTEM_ALERT),
                anyString(),
                anyString(),
                any(),
                any()
        );
    }

    @Test(description = "APP-U05 (Deep-Path 2): Chuyển tắt từ APPLIED -> INTERVIEWING với lịch hẹn hợp lệ (> 30 phút) -> tự động log SHORTLISTED và thông báo email")
    public void test_APP_U05_updateApplicationStatus_DeepPath_StageLeap_AppliedToInterviewing_SavesScheduleAndNotes() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("updateStatus").path("APP_U05");
        Application app = Application.builder()
                .applicationId(1L)
                .job(sampleJob)
                .candidate(sampleCandidate)
                .status(ApplicationStatus.APPLIED)
                .build();

        LocalDateTime validTime = LocalDateTime.now().plusMinutes(data.path("interviewMinutesOffset").asInt(35));
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
        Assert.assertEquals(app.getEvaluationNotes(), notes);
        verify(pipelineLogRepository, times(2)).save(any(RecruitmentPipelineLog.class)); // 1 for auto SHORTLISTED + 1 for INTERVIEWING
        verify(notificationService, times(1)).createNotification(eq(101L), any(), any(), any(), any(), any());
        verify(emailService, times(1)).sendApplicationStatusEmail(any(), any(), any(), any(), eq(ApplicationStatus.INTERVIEWING), any());
    }

    @Test(description = "APP-U06 (Deep-Path 3): Từ chối hồ sơ (REJECTED) kèm nhận xét đánh giá -> lưu rejectionReason và gửi email giải trình cho ứng viên")
    public void test_APP_U06_updateApplicationStatus_DeepPath_RejectionWithFeedback_SavesRejectionReason_NotifiesCandidate() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("updateStatus").path("APP_U06");
        String rejectionNote = data.path("notes").asText("Kỹ năng thực hành chưa đáp ứng yêu cầu dự án");

        Application app = Application.builder()
                .applicationId(1L)
                .job(sampleJob)
                .candidate(sampleCandidate)
                .status(ApplicationStatus.SCREENING)
                .build();

        UpdateApplicationStatusRequest request = new UpdateApplicationStatusRequest();
        request.setStatus(ApplicationStatus.valueOf(data.path("targetStatus").asText("REJECTED")));
        request.setNotes(rejectionNote);

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        ApplicationResponse response = applicationService.updateApplicationStatus(1L, request, recruiterUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getStatus(), ApplicationStatus.REJECTED);
        Assert.assertEquals(app.getRejectionReason(), rejectionNote);
        verify(notificationService, times(1)).createNotification(eq(101L), any(), any(), any(), any(), any());
        verify(emailService, times(1)).sendApplicationStatusEmail(any(), any(), any(), any(), eq(ApplicationStatus.REJECTED), eq(rejectionNote));
    }

    @Test(description = "APP-U07 (Deep-Path 4): Ghi chú nội bộ HR (bắt đầu bằng [{{) hoặc giữ nguyên trạng thái -> cập nhật đánh giá nhưng không gửi thông báo/email làm lộ nội dung")
    public void test_APP_U07_updateApplicationStatus_DeepPath_InternalNoteOnly_SuppressesCandidateNotification() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("updateStatus").path("APP_U07");
        String internalNote = data.path("internalNotes").asText("[{\"author\":\"HR Lead\",\"comment\":\"Đã đánh giá CV vòng 1, chờ phỏng vấn kỹ thuật\"}]");

        Application app = Application.builder()
                .applicationId(1L)
                .job(sampleJob)
                .candidate(sampleCandidate)
                .status(ApplicationStatus.SCREENING)
                .build();

        UpdateApplicationStatusRequest request = new UpdateApplicationStatusRequest();
        request.setStatus(ApplicationStatus.valueOf(data.path("targetStatus").asText("SCREENING")));
        request.setNotes(internalNote);

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        ApplicationResponse response = applicationService.updateApplicationStatus(1L, request, recruiterUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getStatus(), ApplicationStatus.SCREENING);
        Assert.assertEquals(app.getEvaluationNotes(), internalNote);
        verify(notificationService, never()).createNotification(eq(101L), any(), any(), any(), any(), any());
        verify(emailService, never()).sendApplicationStatusEmail(any(), any(), any(), any(), any(), any());
    }

    @Test(description = "APP-U08 (Deep-Path 5): Khôi phục chỉ tiêu khi ADMIN chuyển ứng viên từ HIRED về OFFERED trên tin CLOSED -> tự động mở lại tin thành PUBLISHED")
    public void test_APP_U08_updateApplicationStatus_DeepPath_CandidateUnHired_ReopensClosedJobIfVacanciesOpen() {
        var data = TestDataLoader.loadJsonNode("testdata/application-testdata.json").path("updateStatus").path("APP_U08");
        User adminUser = User.builder().userId(99L).role(UserRole.ADMIN).build();

        Job closedJob = Job.builder()
                .jobId(1L)
                .title("Fullstack Developer")
                .status(JobStatus.CLOSED)
                .approvalStatus(JobApprovalStatus.APPROVED)
                .deadlineDate(LocalDate.now().plusDays(5))
                .vacanciesCount(data.path("vacancies").asInt(2))
                .recruiter(sampleRecruiter)
                .company(sampleVerifiedCompany)
                .build();

        Application hiredApp = Application.builder()
                .applicationId(1L)
                .job(closedJob)
                .candidate(sampleCandidate)
                .status(ApplicationStatus.HIRED)
                .build();

        UpdateApplicationStatusRequest request = new UpdateApplicationStatusRequest();
        request.setStatus(ApplicationStatus.valueOf(data.path("targetStatus").asText("OFFERED")));
        request.setNotes("Chuyển lại về đàm phán Offer");

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(hiredApp));
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));
        when(applicationRepository.countByJob_JobIdAndStatus(1L, ApplicationStatus.HIRED))
                .thenReturn(data.path("hiredCountRemaining").asLong(1L));

        ApplicationResponse response = applicationService.updateApplicationStatus(1L, request, adminUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getStatus(), ApplicationStatus.OFFERED);
        verify(jobRepository, atLeastOnce()).save(argThat(j -> j.getStatus() == JobStatus.PUBLISHED));
        verify(notificationService, atLeastOnce()).createNotification(
                eq(sampleRecruiter.getRecruiterId()),
                eq(NotificationType.SYSTEM_ALERT),
                anyString(),
                anyString(),
                any(),
                any()
        );
    }
}
