package com.hiremate.testng;

import com.hiremate.dto.request.JobCreateRequest;
import com.hiremate.dto.response.JobResponse;
import com.hiremate.entity.Company;
import com.hiremate.entity.Job;
import com.hiremate.entity.JobSkill;
import com.hiremate.entity.Recruiter;
import com.hiremate.entity.Skill;
import com.hiremate.entity.User;
import com.hiremate.enums.CompanyStatus;
import com.hiremate.enums.EmploymentType;
import com.hiremate.enums.JobApprovalStatus;
import com.hiremate.enums.JobStatus;
import com.hiremate.enums.UserRole;
import com.hiremate.enums.UserStatus;
import com.hiremate.repository.ApplicationRepository;
import com.hiremate.repository.CompanyRepository;
import com.hiremate.repository.JobRepository;
import com.hiremate.repository.JobSkillRepository;
import com.hiremate.repository.RecruiterRepository;
import com.hiremate.repository.SkillRepository;
import com.hiremate.service.NotificationService;
import com.hiremate.service.SystemSettingsService;
import com.hiremate.service.impl.JobServiceImpl;
import com.hiremate.testng.TestDataLoader;
import org.springframework.test.util.ReflectionTestUtils;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * ==============================================================================
 * HIREMATE AI - JOB MANAGEMENT UNIT TESTS (54 CASES SUITE: FEATURE 2)
 * Workbook: HireMate_JOB_UnitTest_Template_6Cases.xlsx
 * Exactly 6 test cases per function across 3 functions = 18 cases
 * Framework: TestNG 7.9.0 + Mockito (Isolated, no production DB)
 * ==============================================================================
 */
public class JobServiceDesignTestNGTest {

    private JobRepository jobRepository;
    private JobSkillRepository jobSkillRepository;
    private SkillRepository skillRepository;
    private RecruiterRepository recruiterRepository;
    private ApplicationRepository applicationRepository;
    private NotificationService notificationService;
    private CompanyRepository companyRepository;
    private SystemSettingsService systemSettingsService;

    private JobServiceImpl jobService;

    private User sampleRecruiterUser;
    private Recruiter sampleRecruiter;
    private Company sampleVerifiedCompany;

    @BeforeMethod
    public void setUp() {
        jobRepository = mock(JobRepository.class);
        jobSkillRepository = mock(JobSkillRepository.class);
        skillRepository = mock(SkillRepository.class);
        recruiterRepository = mock(RecruiterRepository.class);
        applicationRepository = mock(ApplicationRepository.class);
        notificationService = mock(NotificationService.class);
        companyRepository = mock(CompanyRepository.class);
        systemSettingsService = mock(SystemSettingsService.class);

        jobService = new JobServiceImpl(
                jobRepository,
                jobSkillRepository,
                skillRepository,
                recruiterRepository,
                applicationRepository,
                notificationService
        );

        ReflectionTestUtils.setField(jobService, "companyRepository", companyRepository);
        ReflectionTestUtils.setField(jobService, "systemSettingsService", systemSettingsService);

        sampleRecruiterUser = User.builder()
                .userId(301L)
                .email("recruiter@fpt.com")
                .fullName("Tran Van HR")
                .role(UserRole.RECRUITER)
                .status(UserStatus.ACTIVE)
                .build();

        sampleVerifiedCompany = Company.builder()
                .companyId(10L)
                .companyName("FPT Software")
                .status(CompanyStatus.VERIFIED)
                .build();

        sampleRecruiter = Recruiter.builder()
                .recruiterId(301L)
                .user(sampleRecruiterUser)
                .company(sampleVerifiedCompany)
                .build();
    }

    private JobCreateRequest buildJobReq(String title, Integer vacancies, BigDecimal minSal, BigDecimal maxSal, LocalDate deadline) {
        JobCreateRequest req = new JobCreateRequest();
        req.setTitle(title);
        req.setDescription("Mô tả công việc mẫu chuẩn kỹ thuật");
        req.setRequirements("Yêu cầu ứng viên thành thạo Java và Spring Boot");
        req.setBenefits("Chế độ bảo hiểm và đãi ngộ hấp dẫn");
        req.setLocation("Da Nang");
        req.setEmploymentType(EmploymentType.FULL_TIME);
        req.setVacanciesCount(vacancies);
        req.setSalaryMin(minSal);
        req.setSalaryMax(maxSal);
        req.setDeadlineDate(deadline);
        req.setStatus(JobStatus.PUBLISHED);
        return req;
    }

    // ==========================================================================
    // FUNCTION 1: createJob(JobCreateRequest, User) — 6 TEST CASES (JOB-C01 to JOB-C11)
    // ==========================================================================

    @Test(description = "JOB-C01 / UTCID01: Tạo tin tuyển dụng hợp lệ bởi Recruiter đã có doanh nghiệp VERIFIED (salaryMin=0)")
    public void test_JOB_C01_UTCID01_createJob_ValidVerifiedRecruiter_Success() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("createJob").path("JOB_C01");
        JobCreateRequest request = buildJobReq(
                data.path("title").asText("Senior Java Engineer"),
                data.path("vacanciesCount").asInt(2),
                new BigDecimal(data.path("salaryMin").asText("0.0")),
                new BigDecimal(data.path("salaryMax").asText("20.0")),
                LocalDate.now().plusDays(data.path("deadlineDaysOffset").asInt(7))
        );

        when(recruiterRepository.findById(301L)).thenReturn(Optional.of(sampleRecruiter));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> {
            Job j = inv.getArgument(0);
            j.setJobId(501L);
            return j;
        });

        JobResponse response = jobService.createJob(request, sampleRecruiterUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getTitle(), "Senior Java Engineer");
        Assert.assertEquals(response.getVacanciesCount(), Integer.valueOf(2));
        verify(jobRepository, times(1)).save(any(Job.class));
    }

    @Test(
        description = "JOB-C02 / UTCID02: Tạo tin thất bại do số lượng tuyển dụng vacanciesCount = 0",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Số lượng tuyển dụng phải từ 1 người trở lên.*"
    )
    public void test_JOB_C02_UTCID02_createJob_VacanciesZero_ThrowsException() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("createJob").path("JOB_C02");
        JobCreateRequest request = buildJobReq(
                data.path("title").asText("Java Dev"),
                data.path("vacanciesCount").asInt(0),
                new BigDecimal(data.path("salaryMin").asText("20.0")),
                new BigDecimal(data.path("salaryMax").asText("20.0")),
                LocalDate.now().plusDays(data.path("deadlineDaysOffset").asInt(0))
        );
        jobService.createJob(request, sampleRecruiterUser);
    }

    @Test(description = "JOB-C03 / UTCID03: Tạo tin thành công với biên số lượng tuyển dụng nhỏ nhất vacanciesCount = 1 và deadline=today")
    public void test_JOB_C03_UTCID03_createJob_VacanciesOne_Boundary_Success() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("createJob").path("JOB_C03");
        JobCreateRequest request = buildJobReq(
                data.path("title").asText("Frontend Developer"),
                data.path("vacanciesCount").asInt(1),
                new BigDecimal(data.path("salaryMin").asText("20.0")),
                new BigDecimal(data.path("salaryMax").asText("20.0")),
                LocalDate.now().plusDays(data.path("deadlineDaysOffset").asInt(0))
        );

        when(recruiterRepository.findById(301L)).thenReturn(Optional.of(sampleRecruiter));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> {
            Job j = inv.getArgument(0);
            j.setJobId(502L);
            return j;
        });

        JobResponse response = jobService.createJob(request, sampleRecruiterUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getVacanciesCount(), Integer.valueOf(1));
        verify(jobRepository, times(1)).save(any(Job.class));
    }

    @Test(
        description = "JOB-C05 / UTCID04: Tạo tin thất bại do mức lương tối thiểu là số âm (salaryMin = -1)",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Mức lương tối thiểu không được là số âm.*"
    )
    public void test_JOB_C05_UTCID04_createJob_SalaryMinNegative_ThrowsException() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("createJob").path("JOB_C05");
        JobCreateRequest request = buildJobReq(
                data.path("title").asText("Tester"),
                data.path("vacanciesCount").asInt(2),
                new BigDecimal(data.path("salaryMin").asText("-1.0")),
                new BigDecimal(data.path("salaryMax").asText("20.0")),
                LocalDate.now().plusDays(data.path("deadlineDaysOffset").asInt(7))
        );
        jobService.createJob(request, sampleRecruiterUser);
    }

    @Test(
        description = "JOB-C09 / UTCID05: Tạo tin thất bại do mức lương tối đa nhỏ hơn mức lương tối thiểu (max < min)",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Mức lương tối đa không được nhỏ hơn mức lương tối thiểu.*"
    )
    public void test_JOB_C09_UTCID05_createJob_SalaryMaxLessThanSalaryMin_ThrowsException() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("createJob").path("JOB_C09");
        JobCreateRequest request = buildJobReq(
                data.path("title").asText("DevOps"),
                data.path("vacanciesCount").asInt(1),
                new BigDecimal(data.path("salaryMin").asText("20.0")),
                new BigDecimal(data.path("salaryMax").asText("19.0")),
                LocalDate.now().plusDays(data.path("deadlineDaysOffset").asInt(0))
        );
        jobService.createJob(request, sampleRecruiterUser);
    }

    @Test(
        description = "JOB-C11 / UTCID06: Tạo tin thất bại do hạn chót nộp hồ sơ ở quá khứ (deadlineDate = today - 1)",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Hạn chót nộp hồ sơ không được là ngày trong quá khứ.*"
    )
    public void test_JOB_C11_UTCID06_createJob_DeadlineYesterday_ThrowsException() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("createJob").path("JOB_C11");
        JobCreateRequest request = buildJobReq(
                data.path("title").asText("Product Owner"),
                data.path("vacanciesCount").asInt(1),
                new BigDecimal(data.path("salaryMin").asText("20.0")),
                new BigDecimal(data.path("salaryMax").asText("20.0")),
                LocalDate.now().plusDays(data.path("deadlineDaysOffset").asInt(-1))
        );
        jobService.createJob(request, sampleRecruiterUser);
    }

    // ==========================================================================
    // FUNCTION 2: updateJob(Long, JobCreateRequest, User) — 6 TEST CASES (JOB-U01 to JOB-U09)
    // ==========================================================================

    @Test(description = "JOB-U01 / UTCID01: Owner cập nhật vacancies tại biên hợp lệ (=1) và tiêu đề tin tuyển dụng thành công")
    public void test_JOB_U01_UTCID01_updateJob_Owner_UpdateTitle_Success() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("updateJob").path("JOB_U01");
        Job existingJob = Job.builder()
                .jobId(501L)
                .title("Old Developer Title")
                .recruiter(sampleRecruiter)
                .company(sampleVerifiedCompany)
                .status(JobStatus.PUBLISHED)
                .approvalStatus(JobApprovalStatus.APPROVED)
                .vacanciesCount(2)
                .deadlineDate(LocalDate.now().plusDays(10))
                .build();

        JobCreateRequest updateReq = buildJobReq(
                data.path("title").asText("Lead Developer"),
                data.path("vacanciesCount").asInt(1),
                new BigDecimal(data.path("salaryMin").asText("20.0")),
                new BigDecimal(data.path("salaryMax").asText("35.0")),
                LocalDate.now().plusDays(data.path("deadlineDaysOffset").asInt(10))
        );

        when(jobRepository.findById(501L)).thenReturn(Optional.of(existingJob));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));

        JobResponse response = jobService.updateJob(501L, updateReq, sampleRecruiterUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getTitle(), "Lead Developer");
        Assert.assertEquals(response.getVacanciesCount(), Integer.valueOf(1));
        verify(jobRepository, times(1)).save(existingJob);
    }

    @Test(
        description = "JOB-U02 / UTCID02: Cập nhật thất bại do Recruiter không được phân quyền sở hữu tin",
        expectedExceptions = SecurityException.class,
        expectedExceptionsMessageRegExp = ".*Bạn chỉ có quyền chỉnh sửa tin tuyển dụng.*"
    )
    public void test_JOB_U02_UTCID02_updateJob_UnauthorizedRecruiter_ThrowsSecurityException() {
        Job existingJob = Job.builder()
                .jobId(501L)
                .recruiter(sampleRecruiter)
                .company(sampleVerifiedCompany)
                .build();

        User strangerUser = User.builder()
                .userId(999L)
                .role(UserRole.RECRUITER)
                .build();

        JobCreateRequest updateReq = buildJobReq("Hacked Title", 2, new BigDecimal("10.0"), new BigDecimal("20.0"), LocalDate.now().plusDays(7));

        when(jobRepository.findById(501L)).thenReturn(Optional.of(existingJob));

        jobService.updateJob(501L, updateReq, strangerUser);
    }

    @Test(
        description = "JOB-U03 / UTCID03: Cập nhật thất bại do Job ID không tồn tại trong hệ thống (404)",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Job not found.*"
    )
    public void test_JOB_U03_UTCID03_updateJob_JobNotFound_ThrowsIllegalArgumentException() {
        JobCreateRequest updateReq = buildJobReq("New Title", 2, new BigDecimal("10.0"), new BigDecimal("20.0"), LocalDate.now().plusDays(7));

        when(jobRepository.findById(404L)).thenReturn(Optional.empty());

        jobService.updateJob(404L, updateReq, sampleRecruiterUser);
    }

    @Test(
        description = "JOB-U04 / UTCID04: Cập nhật thất bại do số lượng tuyển dụng = 0 (bị chặn tại validator trước khi tìm job)",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Số lượng tuyển dụng phải từ 1 người trở lên.*"
    )
    public void test_JOB_U04_UTCID04_updateJob_VacanciesZero_ThrowsIllegalArgumentException() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("updateJob").path("JOB_U04");
        JobCreateRequest updateReq = buildJobReq(
                data.path("title").asText("Lead Developer"),
                data.path("vacanciesCount").asInt(0),
                new BigDecimal(data.path("salaryMin").asText("20.0")),
                new BigDecimal(data.path("salaryMax").asText("35.0")),
                LocalDate.now().plusDays(data.path("deadlineDaysOffset").asInt(10))
        );

        jobService.updateJob(501L, updateReq, sampleRecruiterUser);
        verify(jobRepository, never()).findById(any());
    }

    @Test(description = "JOB-U07 / UTCID05: Doanh nghiệp PENDING khi update yêu cầu PUBLISHED sẽ tự chuyển về DRAFT và PENDING kiểm duyệt")
    public void test_JOB_U07_UTCID05_updateJob_PendingCompany_SwitchesToDraftAndPending() {
        Company pendingCompany = Company.builder()
                .companyId(12L)
                .companyName("StartUp Company")
                .status(CompanyStatus.PENDING)
                .build();

        Recruiter pendingRecruiter = Recruiter.builder()
                .recruiterId(301L)
                .user(sampleRecruiterUser)
                .company(pendingCompany)
                .build();

        Job existingJob = Job.builder()
                .jobId(501L)
                .title("Initial Title")
                .recruiter(pendingRecruiter)
                .company(pendingCompany)
                .status(JobStatus.DRAFT)
                .approvalStatus(JobApprovalStatus.PENDING)
                .build();

        JobCreateRequest updateReq = buildJobReq("Updated Title", 2, new BigDecimal("15.0"), new BigDecimal("25.0"), LocalDate.now().plusDays(10));
        updateReq.setStatus(JobStatus.PUBLISHED);

        when(jobRepository.findById(501L)).thenReturn(Optional.of(existingJob));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));

        JobResponse response = jobService.updateJob(501L, updateReq, sampleRecruiterUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(existingJob.getStatus(), JobStatus.DRAFT);
        Assert.assertEquals(existingJob.getApprovalStatus(), JobApprovalStatus.PENDING);
    }

    @Test(description = "JOB-U09 / UTCID06: Đăng công khai tin hợp lệ khi Doanh nghiệp VERIFIED và đã được duyệt APPROVED")
    public void test_JOB_U09_UTCID06_updateJob_PublishJob_Success() {
        Job existingJob = Job.builder()
                .jobId(501L)
                .title("Draft Title")
                .recruiter(sampleRecruiter)
                .company(sampleVerifiedCompany)
                .status(JobStatus.DRAFT)
                .approvalStatus(JobApprovalStatus.APPROVED)
                .deadlineDate(LocalDate.now().plusDays(15))
                .build();

        JobCreateRequest updateReq = buildJobReq("Published Title", 2, new BigDecimal("15.0"), new BigDecimal("25.0"), LocalDate.now().plusDays(15));
        updateReq.setStatus(JobStatus.PUBLISHED);

        when(jobRepository.findById(501L)).thenReturn(Optional.of(existingJob));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));

        JobResponse response = jobService.updateJob(501L, updateReq, sampleRecruiterUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(existingJob.getStatus(), JobStatus.PUBLISHED);
        verify(jobRepository, times(1)).save(existingJob);
    }

    // ==========================================================================
    // FUNCTION 3: getPublishedJobs(String, String) — 6 TEST CASES (JOB-S01 to JOB-S09)
    // ==========================================================================

    @Test(description = "JOB-S01 / UTCID01: Không có bộ lọc tìm kiếm (keyword=null, location=null), lấy toàn bộ tin PUBLISHED")
    public void test_JOB_S01_UTCID01_getPublishedJobs_NoFilter_ReturnsPublished() {
        Job job1 = Job.builder().jobId(1L).title("Job 1").status(JobStatus.PUBLISHED).company(sampleVerifiedCompany).build();
        Job job2 = Job.builder().jobId(2L).title("Job 2").status(JobStatus.PUBLISHED).company(sampleVerifiedCompany).build();

        when(jobRepository.findByStatus(JobStatus.PUBLISHED)).thenReturn(Arrays.asList(job1, job2));

        List<JobResponse> results = jobService.getPublishedJobs(null, null);

        Assert.assertNotNull(results);
        Assert.assertEquals(results.size(), 2);
        verify(jobRepository, times(1)).findByStatus(JobStatus.PUBLISHED);
    }

    @Test(description = "JOB-S02 / UTCID02: Chỉ tìm kiếm theo từ khóa (keyword='Java', location=null)")
    public void test_JOB_S02_UTCID02_getPublishedJobs_KeywordOnly_ReturnsMatching() {
        Job jobJava = Job.builder().jobId(1L).title("Senior Java Developer").status(JobStatus.PUBLISHED).company(sampleVerifiedCompany).build();

        when(jobRepository.searchJobs("Java", null)).thenReturn(Collections.singletonList(jobJava));

        List<JobResponse> results = jobService.getPublishedJobs("Java", null);

        Assert.assertNotNull(results);
        Assert.assertEquals(results.size(), 1);
        Assert.assertEquals(results.get(0).getTitle(), "Senior Java Developer");
        verify(jobRepository, times(1)).searchJobs("Java", null);
    }

    @Test(description = "JOB-S03 / UTCID03: Chỉ tìm kiếm theo địa điểm (keyword=null, location='Da Nang')")
    public void test_JOB_S03_UTCID03_getPublishedJobs_LocationOnly_ReturnsMatching() {
        Job jobDn = Job.builder().jobId(2L).title("Backend Developer").location("Da Nang").status(JobStatus.PUBLISHED).company(sampleVerifiedCompany).build();

        when(jobRepository.searchJobs(null, "Da Nang")).thenReturn(Collections.singletonList(jobDn));

        List<JobResponse> results = jobService.getPublishedJobs(null, "Da Nang");

        Assert.assertNotNull(results);
        Assert.assertEquals(results.size(), 1);
        Assert.assertEquals(results.get(0).getLocation(), "Da Nang");
        verify(jobRepository, times(1)).searchJobs(null, "Da Nang");
    }

    @Test(description = "JOB-S04 / UTCID04: Tìm kiếm kết hợp cả từ khóa và địa điểm (keyword='Java', location='Da Nang')")
    public void test_JOB_S04_UTCID04_getPublishedJobs_BothFilters_ReturnsMatching() {
        Job jobCombined = Job.builder().jobId(3L).title("Java Lead").location("Da Nang").status(JobStatus.PUBLISHED).company(sampleVerifiedCompany).build();

        when(jobRepository.searchJobs("Java", "Da Nang")).thenReturn(Collections.singletonList(jobCombined));

        List<JobResponse> results = jobService.getPublishedJobs("Java", "Da Nang");

        Assert.assertNotNull(results);
        Assert.assertEquals(results.size(), 1);
        verify(jobRepository, times(1)).searchJobs("Java", "Da Nang");
    }

    @Test(description = "JOB-S05 / UTCID05: Từ khóa tìm kiếm chỉ chứa khoảng trắng (keyword='   ', location=null) được coi như không lọc")
    public void test_JOB_S05_UTCID05_getPublishedJobs_BlankKeyword_TreatedAsNoFilter() {
        Job job1 = Job.builder().jobId(1L).title("Job 1").status(JobStatus.PUBLISHED).company(sampleVerifiedCompany).build();

        when(jobRepository.findByStatus(JobStatus.PUBLISHED)).thenReturn(Collections.singletonList(job1));

        List<JobResponse> results = jobService.getPublishedJobs("   ", null);

        Assert.assertNotNull(results);
        Assert.assertEquals(results.size(), 1);
        verify(jobRepository, times(1)).findByStatus(JobStatus.PUBLISHED);
    }

    @Test(description = "JOB-S09 / UTCID06: Từ khóa không tồn tại trả về danh sách rỗng, không phát sinh ngoại lệ")
    public void test_JOB_S09_UTCID06_getPublishedJobs_NotFound_ReturnsEmptyList() {
        when(jobRepository.searchJobs("zznotfound", null)).thenReturn(Collections.emptyList());

        List<JobResponse> results = jobService.getPublishedJobs("zznotfound", null);

        Assert.assertNotNull(results);
        Assert.assertTrue(results.isEmpty());
        verify(jobRepository, times(1)).searchJobs("zznotfound", null);
    }

    // ==========================================================================
    // EXTENDED TESTS (KNOWN GAPS COVERAGE): createJob guards & skill mapping
    // ==========================================================================

    @Test(
        description = "JOB-EXT-01: Từ chối tạo tin khi Recruiter chưa thiết lập công ty",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Bạn chưa thiết lập thông tin Doanh nghiệp.*"
    )
    public void test_JOB_EXT01_createJob_RecruiterHasNoCompany_ThrowsException() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("extended").path("JOB_EXT01");
        Recruiter recruiterWithoutCompany = Recruiter.builder()
                .recruiterId(301L)
                .user(sampleRecruiterUser)
                .company(null)
                .build();

        when(recruiterRepository.findById(301L)).thenReturn(Optional.of(recruiterWithoutCompany));
        when(companyRepository.findByRecruiterId(301L)).thenReturn(Optional.empty());

        JobCreateRequest req = buildJobReq(
                data.path("title").asText("Java Dev"),
                data.path("vacanciesCount").asInt(2),
                new BigDecimal(data.path("salaryMin").asText("10.0")),
                new BigDecimal(data.path("salaryMax").asText("20.0")),
                LocalDate.now().plusDays(data.path("deadlineDaysOffset").asInt(10)));
        jobService.createJob(req, sampleRecruiterUser);
    }

    @Test(
        description = "JOB-EXT-02: Từ chối tạo tin khi Doanh nghiệp đang chờ kiểm duyệt GPKD (PENDING)",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*đang trong quá trình chờ Ban Quản Trị thẩm định Giấy phép kinh doanh.*"
    )
    public void test_JOB_EXT02_createJob_CompanyPending_ThrowsException() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("extended").path("JOB_EXT02");
        Company pendingCompany = Company.builder()
                .companyId(11L)
                .companyName(data.path("companyName").asText("Pending Startup"))
                .status(CompanyStatus.valueOf(data.path("companyStatus").asText("PENDING")))
                .build();

        Recruiter recruiterPending = Recruiter.builder()
                .recruiterId(301L)
                .user(sampleRecruiterUser)
                .company(pendingCompany)
                .build();

        when(recruiterRepository.findById(301L)).thenReturn(Optional.of(recruiterPending));

        JobCreateRequest req = buildJobReq("Java Dev", 2, new BigDecimal("10.0"), new BigDecimal("20.0"), LocalDate.now().plusDays(10));
        jobService.createJob(req, sampleRecruiterUser);
    }

    @Test(
        description = "JOB-EXT-03: Từ chối tạo tin khi Doanh nghiệp bị từ chối GPKD (REJECTED)",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*đã bị từ chối phê duyệt.*"
    )
    public void test_JOB_EXT03_createJob_CompanyRejected_ThrowsException() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("extended").path("JOB_EXT03");
        Company rejectedCompany = Company.builder()
                .companyId(12L)
                .companyName(data.path("companyName").asText("Rejected Corp"))
                .status(CompanyStatus.valueOf(data.path("companyStatus").asText("REJECTED")))
                .build();

        Recruiter recruiterRejected = Recruiter.builder()
                .recruiterId(301L)
                .user(sampleRecruiterUser)
                .company(rejectedCompany)
                .build();

        when(recruiterRepository.findById(301L)).thenReturn(Optional.of(recruiterRejected));

        JobCreateRequest req = buildJobReq("Java Dev", 2, new BigDecimal("10.0"), new BigDecimal("20.0"), LocalDate.now().plusDays(10));
        jobService.createJob(req, sampleRecruiterUser);
    }

    @Test(
        description = "JOB-EXT-04: Từ chối tạo tin khi Doanh nghiệp bị khóa hoặc đình chỉ hoạt động (BANNED/SUSPENDED)",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*hiện đang bị tạm khóa hoặc đình chỉ hoạt động.*"
    )
    public void test_JOB_EXT04_createJob_CompanyBanned_ThrowsException() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("extended").path("JOB_EXT04");
        Company bannedCompany = Company.builder()
                .companyId(13L)
                .companyName(data.path("companyName").asText("Banned Corp"))
                .status(CompanyStatus.valueOf(data.path("companyStatus").asText("BANNED")))
                .build();

        Recruiter recruiterBanned = Recruiter.builder()
                .recruiterId(301L)
                .user(sampleRecruiterUser)
                .company(bannedCompany)
                .build();

        when(recruiterRepository.findById(301L)).thenReturn(Optional.of(recruiterBanned));

        JobCreateRequest req = buildJobReq("Java Dev", 2, new BigDecimal("10.0"), new BigDecimal("20.0"), LocalDate.now().plusDays(10));
        jobService.createJob(req, sampleRecruiterUser);
    }

    @Test(description = "JOB-EXT-05: Tạo tin thành công và liên kết danh sách Kỹ năng bắt buộc (Mandatory) & Ưu tiên (Preferred)")
    public void test_JOB_EXT05_createJob_WithMandatoryAndPreferredSkills_Success() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("extended").path("JOB_EXT05");
        JobCreateRequest req = buildJobReq(
                data.path("title").asText("Fullstack Java"),
                data.path("vacanciesCount").asInt(3),
                new BigDecimal(data.path("salaryMin").asText("15.0")),
                new BigDecimal(data.path("salaryMax").asText("30.0")),
                LocalDate.now().plusDays(data.path("deadlineDaysOffset").asInt(15)));

        long manId = data.path("mandatorySkillId").asLong(1L);
        long prefId = data.path("preferredSkillId").asLong(2L);
        req.setMandatorySkillIds(java.util.Collections.singletonList(manId));
        req.setPreferredSkillIds(java.util.Collections.singletonList(prefId));

        Skill skill1 = new Skill();
        skill1.setSkillId(manId);
        skill1.setSkillName(data.path("mandatorySkillName").asText("Java"));

        Skill skill2 = new Skill();
        skill2.setSkillId(prefId);
        skill2.setSkillName(data.path("preferredSkillName").asText("Docker"));

        when(recruiterRepository.findById(301L)).thenReturn(Optional.of(sampleRecruiter));
        when(skillRepository.findById(manId)).thenReturn(Optional.of(skill1));
        when(skillRepository.findById(prefId)).thenReturn(Optional.of(skill2));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> {
            Job j = inv.getArgument(0);
            j.setJobId(555L);
            return j;
        });

        JobResponse response = jobService.createJob(req, sampleRecruiterUser);

        Assert.assertNotNull(response);
        verify(jobSkillRepository, times(2)).save(any(JobSkill.class));
    }
}

