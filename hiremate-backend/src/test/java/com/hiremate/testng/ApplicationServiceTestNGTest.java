package com.hiremate.testng;

import com.hiremate.dto.request.ApplyRequest;
import com.hiremate.dto.request.UpdateApplicationStatusRequest;
import com.hiremate.dto.response.ApplicationResponse;
import com.hiremate.entity.*;
import com.hiremate.enums.ApplicationStatus;
import com.hiremate.enums.NotificationType;
import com.hiremate.enums.UserRole;
import com.hiremate.enums.UserStatus;
import com.hiremate.repository.*;
import com.hiremate.service.AiJobMatchService;
import com.hiremate.service.NotificationService;
import com.hiremate.service.impl.ApplicationServiceImpl;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * ============================================================================
 * TEST SUITE: KIỂM THỬ NỘP HỒ SƠ & QUẢN LÝ ĐƠN ỨNG TUYỂN (APPLICATION SERVICE)
 * Sử dụng TestNG Framework chuẩn đề tài FPT SWP391
 * Bao gồm các tính năng & kỹ thuật TestNG tiêu biểu:
 *  - 1. Nhóm kiểm thử AssertX (assertEquals, assertNotNull, assertTrue, so sánh xếp hạng điểm)
 *  - 2. Kiểm thử quy trình nộp đơn đầy đủ: Lưu đơn, Ghi audit pipeline log, Kích hoạt AI match, Gửi thông báo
 *  - 3. Ràng buộc nghiệp vụ: Single Application Rule (Không cho nộp 2 lần vào 1 job)
 *  - 4. Kiểm thử xếp hạng ứng viên theo AI Matching Score giảm dần (UC-28: View Rank Candidates)
 *  - 5. Data-Driven Testing (DDT) với @DataProvider chuyển trạng thái pipeline (SCREENING, INTERVIEWING, OFFERED, REJECTED)
 *  - 6. Bắt ngoại lệ phân quyền SecurityException (Nhà tuyển dụng khác không xem được đơn)
 *  - 7. Ràng buộc Dependency (dependsOnMethods) - Nộp đơn xong mới lấy lịch sử ứng tuyển
 *  - 8. Bắt ngoại lệ có chủ đích expectedExceptions (Đơn không tồn tại)
 * ============================================================================
 */
public class ApplicationServiceTestNGTest {

    private ApplicationRepository applicationRepository;
    private JobRepository jobRepository;
    private CvRepository cvRepository;
    private RecruitmentPipelineLogRepository pipelineLogRepository;
    private AiJobMatchRepository aiJobMatchRepository;
    private CandidateRepository candidateRepository;
    private UserRepository userRepository;
    private NotificationService notificationService;
    private AiJobMatchService aiJobMatchService;
    private com.hiremate.service.EmailService emailService;

    private ApplicationServiceImpl applicationService;

    private User sampleCandidateUser;
    private Candidate sampleCandidate;
    private User sampleRecruiterUser;
    private Recruiter sampleRecruiter;
    private Company sampleCompany;
    private Job sampleJob;
    private Cv sampleCv;
    private Application sampleApp;

    @BeforeMethod
    public void setUp() {
        applicationRepository = mock(ApplicationRepository.class);
        jobRepository = mock(JobRepository.class);
        cvRepository = mock(CvRepository.class);
        pipelineLogRepository = mock(RecruitmentPipelineLogRepository.class);
        aiJobMatchRepository = mock(AiJobMatchRepository.class);
        candidateRepository = mock(CandidateRepository.class);
        userRepository = mock(UserRepository.class);
        notificationService = mock(NotificationService.class);
        aiJobMatchService = mock(AiJobMatchService.class);
        emailService = mock(com.hiremate.service.EmailService.class);

        applicationService = new ApplicationServiceImpl(
                applicationRepository,
                jobRepository,
                cvRepository,
                pipelineLogRepository,
                aiJobMatchRepository,
                candidateRepository,
                userRepository,
                notificationService,
                aiJobMatchService,
                emailService
        );

        // Khởi tạo Candidate
        sampleCandidateUser = User.builder()
                .userId(101L)
                .email("candidate@hiremate.ai")
                .fullName("Nguyen Van Candidate")
                .role(UserRole.CANDIDATE)
                .status(UserStatus.ACTIVE)
                .build();

        sampleCandidate = Candidate.builder()
                .candidateId(101L)
                .user(sampleCandidateUser)
                .headline("Fullstack Java Developer")
                .experienceYears(3)
                .build();

        // Khởi tạo Recruiter
        sampleRecruiterUser = User.builder()
                .userId(201L)
                .email("recruiter@fpt.com")
                .fullName("Le Thi Recruiter")
                .role(UserRole.RECRUITER)
                .status(UserStatus.ACTIVE)
                .build();

        sampleCompany = Company.builder()
                .companyId(10L)
                .companyName("FPT Software")
                .build();

        sampleRecruiter = Recruiter.builder()
                .recruiterId(201L)
                .user(sampleRecruiterUser)
                .company(sampleCompany)
                .build();

        sampleJob = Job.builder()
                .jobId(501L)
                .recruiter(sampleRecruiter)
                .company(sampleCompany)
                .title("Java Software Engineer")
                .build();

        sampleCv = Cv.builder()
                .cvId(301L)
                .candidateId(101L)
                .fileUrl("https://supabase.co/storage/cv_nguyen_van_a.pdf")
                .isDefault(true)
                .build();

        sampleApp = Application.builder()
                .applicationId(701L)
                .job(sampleJob)
                .candidate(sampleCandidate)
                .cv(sampleCv)
                .coverLetter("Tôi rất mong muốn được cống hiến cho công ty.")
                .status(ApplicationStatus.APPLIED)
                .build();
    }

    /**
     * TEST CASE 1: Ứng viên nộp hồ sơ ứng tuyển thành công
     * Kỹ thuật: AssertX, verify lưu Application, lưu Audit Pipeline Log, kích hoạt AI matching & gửi 2 thông báo
     */
    @Test(priority = 1, description = "TC01: Ứng viên nộp đơn ứng tuyển thành công, ghi audit log và gửi thông báo")
    public void testApplyToJobSuccess() {
        // Arrange
        ApplyRequest request = ApplyRequest.builder()
                .jobId(501L)
                .cvId(301L)
                .coverLetter("Tôi rất mong muốn được cống hiến cho công ty.")
                .build();

        when(jobRepository.findById(501L)).thenReturn(Optional.of(sampleJob));
        when(candidateRepository.findById(101L)).thenReturn(Optional.of(sampleCandidate));
        when(applicationRepository.findByJob_JobIdAndCandidate_CandidateId(501L, 101L))
                .thenReturn(Optional.empty()); // Chưa nộp đơn lần nào
        when(cvRepository.findById(301L)).thenReturn(Optional.of(sampleCv));
        when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> {
            Application a = invocation.getArgument(0);
            a.setApplicationId(701L);
            return a;
        });

        // Act
        ApplicationResponse response = applicationService.applyToJob(request, sampleCandidateUser);

        // Assert (Nhóm AssertX)
        Assert.assertNotNull(response, "ApplicationResponse không được null");
        Assert.assertEquals(response.getApplicationId(), Long.valueOf(701L));
        Assert.assertEquals(response.getStatus(), ApplicationStatus.APPLIED);
        Assert.assertEquals(response.getCandidateName(), "Nguyen Van Candidate");
        Assert.assertEquals(response.getJobTitle(), "Java Software Engineer");

        // Verify ghi nhận Audit Log vào bảng recruitment_pipeline_logs
        verify(pipelineLogRepository, times(1)).save(argThat(log ->
                log.getApplicationId().equals(701L)
                        && log.getToStage() == ApplicationStatus.APPLIED
                        && log.getChangedBy().equals(101L)));

        // Verify kích hoạt tính toán so khớp AI tự động (70% mandatory + 30% preferred)
        verify(aiJobMatchService, times(1)).calculateAndSaveMatch(sampleCandidate, sampleJob, sampleCv);

        // Verify gửi 2 thông báo: 1 cho Ứng viên, 1 cho Nhà tuyển dụng
        verify(notificationService, times(1)).createNotification(
                eq(101L), eq(NotificationType.APPLICATION_STATUS), anyString(), anyString(), eq(701L), eq("applications"));
        verify(notificationService, times(1)).createNotification(
                eq(201L), eq(NotificationType.APPLICATION_STATUS), anyString(), anyString(), eq(701L), eq("applications"));
    }

    /**
     * TEST CASE 2: Bắt lỗi khi ứng viên nộp đơn trùng lặp vào cùng một vị trí (Single Application Rule)
     * Kỹ thuật: expectedExceptions = IllegalStateException.class
     */
    @Test(priority = 2, expectedExceptions = IllegalStateException.class,
          expectedExceptionsMessageRegExp = ".*already submitted an application.*",
          description = "TC02: Ngăn chặn nộp hồ sơ trùng lặp vào cùng 1 bài tuyển dụng")
    public void testApplyDuplicateThrowsException() {
        // Arrange
        ApplyRequest request = ApplyRequest.builder()
                .jobId(501L)
                .build();

        when(jobRepository.findById(501L)).thenReturn(Optional.of(sampleJob));
        when(candidateRepository.findById(101L)).thenReturn(Optional.of(sampleCandidate));
        // Đã có đơn nộp từ trước
        when(applicationRepository.findByJob_JobIdAndCandidate_CandidateId(501L, 101L))
                .thenReturn(Optional.of(sampleApp));

        // Act (Ném IllegalStateException)
        applicationService.applyToJob(request, sampleCandidateUser);
    }

    /**
     * TEST CASE 3: Bắt lỗi khi tài khoản chưa tạo hồ sơ Ứng viên (Candidate profile not found)
     * Kỹ thuật: expectedExceptions = IllegalStateException.class
     */
    @Test(priority = 3, expectedExceptions = IllegalStateException.class,
          expectedExceptionsMessageRegExp = ".*Candidate profile not found for user.*",
          description = "TC03: Bắt lỗi khi người dùng chưa có hồ sơ Candidate")
    public void testApplyCandidateNotFound() {
        ApplyRequest request = ApplyRequest.builder()
                .jobId(501L)
                .build();

        when(jobRepository.findById(501L)).thenReturn(Optional.of(sampleJob));
        when(candidateRepository.findById(101L)).thenReturn(Optional.empty());

        // Act (Ném IllegalStateException)
        applicationService.applyToJob(request, sampleCandidateUser);
    }

    /**
     * TEST CASE 4: Lấy danh sách ứng viên và tự động sắp xếp theo điểm AI Matching Score giảm dần
     * Kỹ thuật: AssertX, UC-28: View Rank Candidates (95% -> 85.5% -> 72%)
     */
    @Test(priority = 4, description = "TC04: Nhà tuyển dụng lấy danh sách ứng viên sắp xếp theo AI Matching Score DESC")
    public void testGetJobApplicationsAndRankCandidatesByMatchingScore() {
        // Arrange: 3 hồ sơ với điểm so khớp AI lần lượt: App1 (85.5%), App2 (95.0%), App3 (72.0%)
        Candidate cand1 = Candidate.builder().candidateId(101L).user(User.builder().fullName("Ứng viên A").build()).build();
        Candidate cand2 = Candidate.builder().candidateId(102L).user(User.builder().fullName("Ứng viên B (Top 1)").build()).build();
        Candidate cand3 = Candidate.builder().candidateId(103L).user(User.builder().fullName("Ứng viên C").build()).build();

        Application app1 = Application.builder().applicationId(1L).job(sampleJob).candidate(cand1).status(ApplicationStatus.APPLIED).build();
        Application app2 = Application.builder().applicationId(2L).job(sampleJob).candidate(cand2).status(ApplicationStatus.APPLIED).build();
        Application app3 = Application.builder().applicationId(3L).job(sampleJob).candidate(cand3).status(ApplicationStatus.APPLIED).build();

        when(jobRepository.findById(501L)).thenReturn(Optional.of(sampleJob));
        when(applicationRepository.findByJob_JobId(501L)).thenReturn(Arrays.asList(app1, app2, app3));

        // Mock cache điểm AI matching trong ai_job_matches
        when(aiJobMatchRepository.findByCandidate_CandidateIdAndJob_JobId(101L, 501L))
                .thenReturn(Optional.of(AiJobMatch.builder().matchingScore(85.5f).build()));
        when(aiJobMatchRepository.findByCandidate_CandidateIdAndJob_JobId(102L, 501L))
                .thenReturn(Optional.of(AiJobMatch.builder().matchingScore(95.0f).build()));
        when(aiJobMatchRepository.findByCandidate_CandidateIdAndJob_JobId(103L, 501L))
                .thenReturn(Optional.of(AiJobMatch.builder().matchingScore(72.0f).build()));

        // Act
        List<ApplicationResponse> rankedList = applicationService.getJobApplications(501L, sampleRecruiterUser);

        // Assert
        Assert.assertNotNull(rankedList);
        Assert.assertEquals(rankedList.size(), 3, "Phải có đúng 3 hồ sơ ứng tuyển");

        // Kiểm tra thứ tự sắp xếp giảm dần theo matchingScore (95.0f -> 85.5f -> 72.0f)
        Assert.assertEquals(rankedList.get(0).getMatchingScore(), Float.valueOf(95.0f), "Top 1 phải là 95.0%");
        Assert.assertEquals(rankedList.get(0).getCandidateName(), "Ứng viên B (Top 1)");

        Assert.assertEquals(rankedList.get(1).getMatchingScore(), Float.valueOf(85.5f), "Top 2 phải là 85.5%");
        Assert.assertEquals(rankedList.get(2).getMatchingScore(), Float.valueOf(72.0f), "Top 3 phải là 72.0%");
    }

    /**
     * TEST CASE 5: Bắt lỗi bảo mật khi Recruiter khác cố xem danh sách ứng viên của bài đăng không phải của mình
     * Kỹ thuật: expectedExceptions = SecurityException.class
     */
    @Test(priority = 5, expectedExceptions = SecurityException.class,
          expectedExceptionsMessageRegExp = "Unauthorized access to this job's candidates.",
          description = "TC05: Ngăn chặn Recruiter khác truy cập danh sách ứng viên không thuộc quyền quản lý")
    public void testGetJobApplicationsUnauthorizedRecruiter() {
        // Arrange: Hacker Recruiter có userId = 999L
        User intruder = User.builder().userId(999L).role(UserRole.RECRUITER).build();
        when(jobRepository.findById(501L)).thenReturn(Optional.of(sampleJob));

        // Act (Ném SecurityException)
        applicationService.getJobApplications(501L, intruder);
    }

    /**
     * DataProvider cung cấp các trạng thái chuyển vòng trong pipeline tuyển dụng
     */
    @DataProvider(name = "pipelineStages")
    public Object[][] providePipelineStages() {
        return new Object[][]{
                {ApplicationStatus.SCREENING, "Hồ sơ đạt yêu cầu CV ban đầu, chuyển qua vòng Screening"},
                {ApplicationStatus.INTERVIEWING, "Mời ứng viên tham gia phỏng vấn kỹ thuật với Tech Lead"},
                {ApplicationStatus.OFFERED, "Chúc mừng! Ứng viên vượt qua các vòng và nhận thư mời Offer"},
                {ApplicationStatus.REJECTED, "Rất tiếc hồ sơ chưa phù hợp ở thời điểm hiện tại"}
        };
    }

    /**
     * TEST CASE 6: Data-Driven Testing (DDT) cập nhật trạng thái vòng tuyển dụng
     * Kỹ thuật: @DataProvider của TestNG, verify lưu trạng thái mới, ghi pipeline log và gửi thông báo
     */
    @Test(priority = 6, dataProvider = "pipelineStages",
          description = "TC06: Data-Driven Testing chuyển trạng thái pipeline và gửi thông báo cho ứng viên")
    public void testUpdateApplicationStatusWithDataProvider(ApplicationStatus targetStatus, String notes) {
        // Arrange
        UpdateApplicationStatusRequest request = UpdateApplicationStatusRequest.builder()
                .status(targetStatus)
                .notes(notes)
                .build();

        sampleApp.setStatus(ApplicationStatus.APPLIED);
        when(applicationRepository.findById(701L)).thenReturn(Optional.of(sampleApp));
        when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        ApplicationResponse response = applicationService.updateApplicationStatus(701L, request, sampleRecruiterUser);

        // Assert
        Assert.assertNotNull(response);
        Assert.assertEquals(response.getStatus(), targetStatus, "Trạng thái mới phải là: " + targetStatus);

        // Verify lưu lịch sử chuyển vòng vào bảng recruitment_pipeline_logs
        verify(pipelineLogRepository, atLeastOnce()).save(argThat(log ->
                log.getApplicationId().equals(701L)
                        && log.getFromStage() == ApplicationStatus.APPLIED
                        && log.getToStage() == targetStatus
                        && log.getNotes().equals(notes)));

        // Verify gửi thông báo cập nhật tiến độ cho ứng viên
        verify(notificationService, atLeastOnce()).createNotification(
                eq(101L),
                eq(NotificationType.APPLICATION_STATUS),
                eq("Cập nhật tiến độ ứng tuyển"),
                contains(targetStatus.name()),
                eq(701L),
                eq("applications")
        );
    }

    /**
     * TEST CASE 7: Ràng buộc Dependency (dependsOnMethods)
     * Lấy lịch sử tất cả các đơn ứng tuyển của Ứng viên (Candidate View Applications)
     */
    @Test(priority = 7, dependsOnMethods = {"testApplyToJobSuccess"},
          description = "TC07: Lấy lịch sử danh sách ứng tuyển của ứng viên")
    public void testGetCandidateApplications() {
        // Arrange
        when(applicationRepository.findByCandidate_CandidateId(101L))
                .thenReturn(Collections.singletonList(sampleApp));

        // Act
        List<ApplicationResponse> list = applicationService.getCandidateApplications(101L);

        // Assert
        Assert.assertNotNull(list);
        Assert.assertEquals(list.size(), 1);
        Assert.assertEquals(list.get(0).getApplicationId(), Long.valueOf(701L));
        Assert.assertEquals(list.get(0).getCompanyName(), "FPT Software");
        Assert.assertEquals(list.get(0).getJobTitle(), "Java Software Engineer");
    }

    /**
     * TEST CASE 8: Bắt lỗi khi cập nhật trạng thái đơn ứng tuyển không tồn tại
     * Kỹ thuật: expectedExceptions = IllegalArgumentException.class
     */
    @Test(priority = 8, expectedExceptions = IllegalArgumentException.class,
          expectedExceptionsMessageRegExp = "Application not found: 9999",
          description = "TC08: Bắt lỗi khi cập nhật trạng thái đơn không tồn tại")
    public void testUpdateStatusApplicationNotFound() {
        UpdateApplicationStatusRequest request = UpdateApplicationStatusRequest.builder()
                .status(ApplicationStatus.SCREENING)
                .build();
        when(applicationRepository.findById(9999L)).thenReturn(Optional.empty());

        // Act (Ném IllegalArgumentException)
        applicationService.updateApplicationStatus(9999L, request, sampleRecruiterUser);
    }

    /**
     * TEST CASE 9: Lấy lịch sử tiến trình ứng tuyển (Recruitment Pipeline Timeline) thành công
     * Kỹ thuật: AssertX, verify trả về đầy đủ các mốc chuyển vòng (APPLIED -> INTERVIEWING)
     */
    @Test(priority = 9, description = "TC09: Lấy lịch sử timeline ứng tuyển thành công cho Ứng viên hoặc NTD")
    public void testGetApplicationTimelineSuccess() {
        // Arrange: 2 log chuyển vòng
        RecruitmentPipelineLog log1 = RecruitmentPipelineLog.builder()
                .logId(1L)
                .applicationId(701L)
                .fromStage(null)
                .toStage(ApplicationStatus.APPLIED)
                .notes("Ứng viên nộp hồ sơ trực tuyến")
                .changedBy(101L)
                .createdAt(java.time.LocalDateTime.now().minusDays(3))
                .build();

        RecruitmentPipelineLog log2 = RecruitmentPipelineLog.builder()
                .logId(2L)
                .applicationId(701L)
                .fromStage(ApplicationStatus.APPLIED)
                .toStage(ApplicationStatus.INTERVIEWING)
                .notes("Mời phỏng vấn kỹ thuật")
                .changedBy(201L)
                .createdAt(java.time.LocalDateTime.now().minusDays(1))
                .build();

        when(applicationRepository.findById(701L)).thenReturn(Optional.of(sampleApp));
        when(pipelineLogRepository.findByApplicationIdOrderByCreatedAtAsc(701L))
                .thenReturn(Arrays.asList(log1, log2));
        when(userRepository.findById(101L)).thenReturn(Optional.of(sampleCandidateUser));
        when(userRepository.findById(201L)).thenReturn(Optional.of(sampleRecruiterUser));

        // Act: Ứng viên xem timeline
        List<com.hiremate.dto.response.PipelineLogResponse> timeline =
                applicationService.getApplicationTimeline(701L, sampleCandidateUser);

        // Assert
        Assert.assertNotNull(timeline);
        Assert.assertEquals(timeline.size(), 2, "Timeline phải có 2 mốc chuyển vòng");
        Assert.assertEquals(timeline.get(0).getToStage(), ApplicationStatus.APPLIED);
        Assert.assertEquals(timeline.get(0).getStageLabel(), "Nộp hồ sơ");
        Assert.assertEquals(timeline.get(0).getChangedByName(), "Nguyen Van Candidate");

        Assert.assertEquals(timeline.get(1).getToStage(), ApplicationStatus.INTERVIEWING);
        Assert.assertEquals(timeline.get(1).getStageLabel(), "Phỏng vấn");
        Assert.assertEquals(timeline.get(1).getChangedByName(), "Le Thi Recruiter");
    }

    /**
     * TEST CASE 10: Bắt lỗi bảo mật khi người lạ cố xem timeline của đơn không thuộc về mình
     * Kỹ thuật: expectedExceptions = SecurityException.class
     */
    @Test(priority = 10, expectedExceptions = SecurityException.class,
          description = "TC10: Ngăn chặn truy cập trái phép vào timeline của ứng viên khác")
    public void testGetApplicationTimelineUnauthorized() {
        // Arrange: Người lạ có userId = 888L (CANDIDATE)
        User stranger = User.builder().userId(888L).role(UserRole.CANDIDATE).build();
        when(applicationRepository.findById(701L)).thenReturn(Optional.of(sampleApp));

        // Act (Ném SecurityException)
        applicationService.getApplicationTimeline(701L, stranger);
    }
}
