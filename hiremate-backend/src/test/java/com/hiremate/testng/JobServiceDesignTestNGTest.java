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
        Assert.assertEquals(response.getTitle(), data.path("title").asText("Updated Senior Java Developer"));
        Assert.assertEquals(response.getVacanciesCount(), Integer.valueOf(data.path("vacanciesCount").asInt(1)));
        verify(jobRepository, times(1)).save(existingJob);
    }

    @Test(
        description = "JOB-U02 / UTCID02: Cập nhật thất bại do Recruiter không được phân quyền sở hữu tin",
        expectedExceptions = SecurityException.class,
        expectedExceptionsMessageRegExp = ".*Bạn chỉ có quyền chỉnh sửa tin tuyển dụng.*"
    )
    public void test_JOB_U02_UTCID02_updateJob_UnauthorizedRecruiter_ThrowsSecurityException() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("updateJob").path("JOB_U02");
        Job existingJob = Job.builder()
                .jobId(501L)
                .recruiter(sampleRecruiter)
                .company(sampleVerifiedCompany)
                .build();

        Long strangerId = data.path("otherRecruiterId").asLong(999L);
        User strangerUser = User.builder()
                .userId(strangerId)
                .role(UserRole.RECRUITER)
                .build();

        JobCreateRequest updateReq = buildJobReq("Hacked Title", data.path("vacanciesCount").asInt(2), new BigDecimal("10.0"), new BigDecimal("20.0"), LocalDate.now().plusDays(7));

        when(jobRepository.findById(501L)).thenReturn(Optional.of(existingJob));

        jobService.updateJob(501L, updateReq, strangerUser);
    }

    @Test(
        description = "JOB-U03 / UTCID03: Cập nhật thất bại do Job ID không tồn tại trong hệ thống (404)",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Job not found.*"
    )
    public void test_JOB_U03_UTCID03_updateJob_JobNotFound_ThrowsIllegalArgumentException() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("updateJob").path("JOB_U03");
        Long nonExistentId = data.path("nonExistentJobId").asLong(9999L);
        JobCreateRequest updateReq = buildJobReq("New Title", 2, new BigDecimal("10.0"), new BigDecimal("20.0"), LocalDate.now().plusDays(7));

        when(jobRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        jobService.updateJob(nonExistentId, updateReq, sampleRecruiterUser);
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
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("updateJob").path("JOB_U07");
        Company pendingCompany = Company.builder()
                .companyId(12L)
                .companyName(data.path("companyName").asText("StartUp Company"))
                .status(CompanyStatus.valueOf(data.path("companyStatus").asText("PENDING")))
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

        JobCreateRequest updateReq = buildJobReq(
                data.path("title").asText("Updated Title"),
                data.path("vacanciesCount").asInt(2),
                new BigDecimal(data.path("salaryMin").asText("15.0")),
                new BigDecimal(data.path("salaryMax").asText("25.0")),
                LocalDate.now().plusDays(data.path("deadlineDaysOffset").asInt(10))
        );
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
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("updateJob").path("JOB_U09");
        Job existingJob = Job.builder()
                .jobId(501L)
                .title("Draft Title")
                .recruiter(sampleRecruiter)
                .company(sampleVerifiedCompany)
                .status(JobStatus.DRAFT)
                .approvalStatus(JobApprovalStatus.APPROVED)
                .deadlineDate(LocalDate.now().plusDays(15))
                .build();

        JobCreateRequest updateReq = buildJobReq(
                data.path("title").asText("Published Title"),
                data.path("vacanciesCount").asInt(2),
                new BigDecimal(data.path("salaryMin").asText("15.0")),
                new BigDecimal(data.path("salaryMax").asText("25.0")),
                LocalDate.now().plusDays(data.path("deadlineDaysOffset").asInt(15))
        );
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
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("searchJob").path("JOB_S01");
        Job job1 = Job.builder().jobId(1L).title("Job 1").status(JobStatus.PUBLISHED).company(sampleVerifiedCompany).build();
        Job job2 = Job.builder().jobId(2L).title("Job 2").status(JobStatus.PUBLISHED).company(sampleVerifiedCompany).build();

        when(jobRepository.findByStatus(JobStatus.PUBLISHED)).thenReturn(Arrays.asList(job1, job2));

        String keyword = data.path("keyword").isNull() ? null : data.path("keyword").asText();
        String location = data.path("location").isNull() ? null : data.path("location").asText();
        List<JobResponse> results = jobService.getPublishedJobs(keyword, location);

        Assert.assertNotNull(results);
        Assert.assertEquals(results.size(), data.path("expectedCount").asInt(2));
        verify(jobRepository, times(1)).findByStatus(JobStatus.PUBLISHED);
    }

    @Test(description = "JOB-S02 / UTCID02: Chỉ tìm kiếm theo từ khóa (keyword='Java', location=null)")
    public void test_JOB_S02_UTCID02_getPublishedJobs_KeywordOnly_ReturnsMatching() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("searchJob").path("JOB_S02");
        String keyword = data.path("keyword").asText("Java");
        String expectedTitle = data.path("expectedTitle").asText("Senior Java Developer");

        Job jobJava = Job.builder().jobId(1L).title(expectedTitle).status(JobStatus.PUBLISHED).company(sampleVerifiedCompany).build();

        when(jobRepository.searchJobs(keyword, null)).thenReturn(Collections.singletonList(jobJava));

        List<JobResponse> results = jobService.getPublishedJobs(keyword, null);

        Assert.assertNotNull(results);
        Assert.assertEquals(results.size(), 1);
        Assert.assertEquals(results.get(0).getTitle(), expectedTitle);
        verify(jobRepository, times(1)).searchJobs(keyword, null);
    }

    @Test(description = "JOB-S03 / UTCID03: Chỉ tìm kiếm theo địa điểm (keyword=null, location='Da Nang')")
    public void test_JOB_S03_UTCID03_getPublishedJobs_LocationOnly_ReturnsMatching() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("searchJob").path("JOB_S03");
        String location = data.path("location").asText("Da Nang");
        String expectedTitle = data.path("expectedTitle").asText("Backend Developer");

        Job jobDn = Job.builder().jobId(2L).title(expectedTitle).location(location).status(JobStatus.PUBLISHED).company(sampleVerifiedCompany).build();

        when(jobRepository.searchJobs(null, location)).thenReturn(Collections.singletonList(jobDn));

        List<JobResponse> results = jobService.getPublishedJobs(null, location);

        Assert.assertNotNull(results);
        Assert.assertEquals(results.size(), 1);
        Assert.assertEquals(results.get(0).getLocation(), location);
        verify(jobRepository, times(1)).searchJobs(null, location);
    }

    @Test(description = "JOB-S04 / UTCID04: Tìm kiếm kết hợp cả từ khóa và địa điểm (keyword='Java', location='Da Nang')")
    public void test_JOB_S04_UTCID04_getPublishedJobs_BothFilters_ReturnsMatching() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("searchJob").path("JOB_S04");
        String keyword = data.path("keyword").asText("Java");
        String location = data.path("location").asText("Da Nang");
        String expectedTitle = data.path("expectedTitle").asText("Java Lead");

        Job jobCombined = Job.builder().jobId(3L).title(expectedTitle).location(location).status(JobStatus.PUBLISHED).company(sampleVerifiedCompany).build();

        when(jobRepository.searchJobs(keyword, location)).thenReturn(Collections.singletonList(jobCombined));

        List<JobResponse> results = jobService.getPublishedJobs(keyword, location);

        Assert.assertNotNull(results);
        Assert.assertEquals(results.size(), 1);
        verify(jobRepository, times(1)).searchJobs(keyword, location);
    }

    @Test(description = "JOB-S05 / UTCID05: Từ khóa tìm kiếm chỉ chứa khoảng trắng (keyword='   ', location=null) được coi như không lọc")
    public void test_JOB_S05_UTCID05_getPublishedJobs_BlankKeyword_TreatedAsNoFilter() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("searchJob").path("JOB_S05");
        String keyword = data.path("keyword").asText("   ");
        Job job1 = Job.builder().jobId(1L).title("Job 1").status(JobStatus.PUBLISHED).company(sampleVerifiedCompany).build();

        when(jobRepository.findByStatus(JobStatus.PUBLISHED)).thenReturn(Collections.singletonList(job1));

        List<JobResponse> results = jobService.getPublishedJobs(keyword, null);

        Assert.assertNotNull(results);
        Assert.assertEquals(results.size(), data.path("expectedCount").asInt(1));
        verify(jobRepository, times(1)).findByStatus(JobStatus.PUBLISHED);
    }

    @Test(description = "JOB-S09 / UTCID06: Từ khóa không tồn tại trả về danh sách rỗng, không phát sinh ngoại lệ")
    public void test_JOB_S09_UTCID06_getPublishedJobs_NotFound_ReturnsEmptyList() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("searchJob").path("JOB_S09");
        String keyword = data.path("keyword").asText("zznotfound");

        when(jobRepository.searchJobs(keyword, null)).thenReturn(Collections.emptyList());

        List<JobResponse> results = jobService.getPublishedJobs(keyword, null);

        Assert.assertNotNull(results);
        Assert.assertTrue(results.isEmpty());
        verify(jobRepository, times(1)).searchJobs(keyword, null);
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

    // ==========================================================================
    // COVERAGE EXPANSION TESTS (TARGET >= 90% BRANCH & LINE COVERAGE FOR 3 FUNCTIONS)
    // ==========================================================================

    @Test(description = "JOB-COV-C01: createJob với custom branchName, category, currency và notification cho tin PENDING")
    public void test_JOB_COV_C01_createJob_PendingApproval_CustomBranchAndCategory() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("extended").path("JOB_COV_C01");
        JobCreateRequest req = buildJobReq(
                data.path("title").asText("Backend Go Developer"),
                data.path("vacanciesCount").asInt(2),
                new BigDecimal(data.path("salaryMin").asText("15.0")),
                new BigDecimal(data.path("salaryMax").asText("25.0")),
                LocalDate.now().plusDays(data.path("deadlineDaysOffset").asInt(10)));
        req.setBranchName(data.path("branchName").asText("Chi nhánh Đà Nẵng"));
        req.setCategory(data.path("category").asText("Software Engineering"));
        req.setSalaryCurrency(data.path("currency").asText("USD"));

        // Cấu hình settings bật moderateNewJobs = true, tắt autoPublishVerified = false -> ra PENDING
        com.hiremate.dto.response.AdminSettingsDTO settings = new com.hiremate.dto.response.AdminSettingsDTO();
        settings.setRequireGpkdToPost(true);
        settings.setModerateNewJobs(true);
        settings.setAutoPublishVerified(false);
        when(systemSettingsService.getSettings()).thenReturn(settings);

        when(recruiterRepository.findById(301L)).thenReturn(Optional.of(sampleRecruiter));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> {
            Job j = inv.getArgument(0);
            j.setJobId(701L);
            return j;
        });

        JobResponse response = jobService.createJob(req, sampleRecruiterUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getStatus(), JobStatus.DRAFT);
        Assert.assertEquals(response.getApprovalStatus(), JobApprovalStatus.PENDING);
        Assert.assertEquals(response.getBranchName(), data.path("branchName").asText("Chi nhánh Đà Nẵng"));
        Assert.assertEquals(response.getSalaryCurrency(), "USD");
        verify(notificationService, atLeastOnce()).notifyAdmins(any(), any(), any(), any(), any());
    }

    @Test(description = "JOB-COV-C02: createJob khi recruiter.company = null, tự động fallback lấy từ companyRepository")
    public void test_JOB_COV_C02_createJob_CompanyNull_FallbackViaCompanyRepository() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("extended").path("JOB_COV_C02");
        Recruiter recruiterWithoutComp = Recruiter.builder()
                .recruiterId(301L)
                .user(sampleRecruiterUser)
                .company(null)
                .build();

        Company foundComp = Company.builder()
                .companyId(data.path("companyId").asLong(801L))
                .companyName(data.path("companyName").asText("VinAI Research"))
                .status(CompanyStatus.VERIFIED)
                .build();

        when(recruiterRepository.findById(301L)).thenReturn(Optional.of(recruiterWithoutComp));
        when(companyRepository.findByRecruiterId(301L)).thenReturn(Optional.of(foundComp));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> {
            Job j = inv.getArgument(0);
            j.setJobId(702L);
            return j;
        });

        JobCreateRequest req = buildJobReq(
                data.path("title").asText("DevOps Engineer"),
                data.path("vacanciesCount").asInt(1),
                new BigDecimal(data.path("salaryMin").asText("20.0")),
                new BigDecimal(data.path("salaryMax").asText("30.0")),
                LocalDate.now().plusDays(data.path("deadlineDaysOffset").asInt(10)));

        JobResponse response = jobService.createJob(req, sampleRecruiterUser);

        Assert.assertNotNull(response);
        verify(recruiterRepository, times(1)).save(recruiterWithoutComp);
        Assert.assertEquals(recruiterWithoutComp.getCompany().getCompanyId(), Long.valueOf(801L));
    }

    @Test(description = "JOB-COV-C03: createJob với Admin đăng tin và tắt chế độ kiểm duyệt (moderateNewJobs = false)")
    public void test_JOB_COV_C03_createJob_AdminUser_ModerateJobsFalse() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("extended").path("JOB_COV_C03");
        User adminUser = User.builder()
                .userId(1L)
                .email("admin@hiremate.ai")
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .build();

        Recruiter adminRecruiter = Recruiter.builder()
                .recruiterId(1L)
                .user(adminUser)
                .company(sampleVerifiedCompany)
                .build();

        com.hiremate.dto.response.AdminSettingsDTO settings = new com.hiremate.dto.response.AdminSettingsDTO();
        settings.setRequireGpkdToPost(false);
        settings.setModerateNewJobs(false);
        settings.setAutoPublishVerified(false);
        when(systemSettingsService.getSettings()).thenReturn(settings);

        when(recruiterRepository.findById(1L)).thenReturn(Optional.of(adminRecruiter));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> {
            Job j = inv.getArgument(0);
            j.setJobId(703L);
            return j;
        });

        JobCreateRequest req = buildJobReq(
                data.path("title").asText("AI Research Scientist"),
                data.path("vacanciesCount").asInt(1),
                new BigDecimal(data.path("salaryMin").asText("30.0")),
                new BigDecimal(data.path("salaryMax").asText("50.0")),
                LocalDate.now().plusDays(data.path("deadlineDaysOffset").asInt(14)));

        JobResponse response = jobService.createJob(req, adminUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getStatus(), JobStatus.PUBLISHED);
        Assert.assertEquals(response.getApprovalStatus(), JobApprovalStatus.APPROVED);
    }

    @Test(description = "JOB-COV-U01: updateJob khi tin từng bị REJECTED -> bắt buộc chuyển về DRAFT + PENDING để duyệt lại")
    public void test_JOB_COV_U01_updateJob_PreviouslyRejected_ResetsToDraftPending() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("extended").path("JOB_COV_U01");
        Job rejectedJob = Job.builder()
                .jobId(801L)
                .title("Original Title")
                .recruiter(sampleRecruiter)
                .company(sampleVerifiedCompany)
                .status(JobStatus.DRAFT)
                .approvalStatus(JobApprovalStatus.REJECTED)
                .deadlineDate(LocalDate.now().plusDays(10))
                .build();

        JobCreateRequest updateReq = buildJobReq(
                data.path("title").asText("Rejected Job Fixed"),
                data.path("vacanciesCount").asInt(2),
                new BigDecimal(data.path("salaryMin").asText("15.0")),
                new BigDecimal(data.path("salaryMax").asText("25.0")),
                LocalDate.now().plusDays(data.path("deadlineDaysOffset").asInt(10)));
        updateReq.setStatus(JobStatus.PUBLISHED);

        when(jobRepository.findById(801L)).thenReturn(Optional.of(rejectedJob));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));

        JobResponse response = jobService.updateJob(801L, updateReq, sampleRecruiterUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(rejectedJob.getStatus(), JobStatus.DRAFT);
        Assert.assertEquals(rejectedJob.getApprovalStatus(), JobApprovalStatus.PENDING);
    }

    @Test(description = "JOB-COV-U02: updateJob khi tin CLOSED và deadline còn hạn, mở lại không truyền status -> tự về PUBLISHED")
    public void test_JOB_COV_U02_updateJob_ClosedJob_ValidDeadline_ReopensToPublished() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("extended").path("JOB_COV_U02");
        Job closedJob = Job.builder()
                .jobId(802L)
                .title("Old Closed Job")
                .recruiter(sampleRecruiter)
                .company(sampleVerifiedCompany)
                .status(JobStatus.CLOSED)
                .approvalStatus(JobApprovalStatus.APPROVED)
                .deadlineDate(LocalDate.now().plusDays(20))
                .build();

        JobCreateRequest updateReq = buildJobReq(
                data.path("title").asText("Extended Closed Job"),
                data.path("vacanciesCount").asInt(2),
                new BigDecimal(data.path("salaryMin").asText("15.0")),
                new BigDecimal(data.path("salaryMax").asText("25.0")),
                LocalDate.now().plusDays(data.path("deadlineDaysOffset").asInt(20)));
        updateReq.setStatus(null); // Không truyền status

        when(jobRepository.findById(802L)).thenReturn(Optional.of(closedJob));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));

        JobResponse response = jobService.updateJob(802L, updateReq, sampleRecruiterUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(closedJob.getStatus(), JobStatus.PUBLISHED);
    }

    @Test(description = "JOB-COV-U03: updateJob thay đổi tập kỹ năng và các trường branch, category, currency")
    public void test_JOB_COV_U03_updateJob_SkillsChanged_TriggersSkillUpdate() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("extended").path("JOB_COV_U03");
        Job existingJob = Job.builder()
                .jobId(803L)
                .title("Cloud Architect")
                .recruiter(sampleRecruiter)
                .company(sampleVerifiedCompany)
                .status(JobStatus.PUBLISHED)
                .approvalStatus(JobApprovalStatus.APPROVED)
                .deadlineDate(LocalDate.now().plusDays(30))
                .build();

        JobCreateRequest updateReq = buildJobReq(
                data.path("title").asText("Senior Cloud Architect"),
                data.path("vacanciesCount").asInt(2),
                new BigDecimal(data.path("salaryMin").asText("40.0")),
                new BigDecimal(data.path("salaryMax").asText("60.0")),
                LocalDate.now().plusDays(data.path("deadlineDaysOffset").asInt(30)));
        updateReq.setBranchName(data.path("branchName").asText("Chi nhánh HCM"));
        updateReq.setCategory(data.path("category").asText("Cloud Computing"));
        updateReq.setSalaryCurrency(data.path("currency").asText("USD"));
        updateReq.setMandatorySkills(Collections.singletonList(data.path("mandatorySkillName").asText("Kubernetes")));
        updateReq.setPreferredSkills(Collections.singletonList(data.path("preferredSkillName").asText("Terraform")));

        // Giả lập hiện tại đang có 1 kỹ năng cũ là Java
        JobSkill existingSkill = new JobSkill();
        existingSkill.setSkillId(10L);
        when(jobSkillRepository.findByJobId(803L)).thenReturn(Collections.singletonList(existingSkill));

        Skill oldSkill = new Skill();
        oldSkill.setSkillId(10L);
        oldSkill.setSkillName("Java");
        when(skillRepository.findAllById(any())).thenReturn(Collections.singletonList(oldSkill));

        when(skillRepository.findBySkillNameIgnoreCase("Kubernetes")).thenReturn(Optional.of(Skill.builder().skillId(11L).skillName("Kubernetes").build()));
        when(skillRepository.findBySkillNameIgnoreCase("Terraform")).thenReturn(Optional.of(Skill.builder().skillId(12L).skillName("Terraform").build()));

        when(jobRepository.findById(803L)).thenReturn(Optional.of(existingJob));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));

        JobResponse response = jobService.updateJob(803L, updateReq, sampleRecruiterUser);

        Assert.assertNotNull(response);
        verify(jobSkillRepository, times(1)).deleteByJobId(803L);
        verify(jobSkillRepository, atLeastOnce()).save(any(JobSkill.class));
    }

    @Test(
        description = "JOB-COV-C04: createJob thất bại khi không tìm thấy Recruiter profile (IllegalStateException)",
        expectedExceptions = IllegalStateException.class,
        expectedExceptionsMessageRegExp = ".*Recruiter profile not found for user: 99999.*"
    )
    public void test_JOB_COV_C04_createJob_RecruiterNotFound_ThrowsIllegalStateException() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("extended").path("JOB_COV_C04");
        long missingUserId = data.path("nonExistentUserId").asLong(99999L);
        User ghostUser = User.builder().userId(missingUserId).role(UserRole.RECRUITER).status(UserStatus.ACTIVE).build();

        when(recruiterRepository.findById(missingUserId)).thenReturn(Optional.empty());

        JobCreateRequest req = buildJobReq(data.path("title").asText("Recruiter Profile Missing Job"), 2, new BigDecimal("10.0"), new BigDecimal("20.0"), LocalDate.now().plusDays(5));
        jobService.createJob(req, ghostUser);
    }

    @Test(description = "JOB-COV-U04: updateJob đặt trạng thái CLOSED có chủ đích (request.status = CLOSED)")
    public void test_JOB_COV_U04_updateJob_SetStatusClosedExplicitly() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("extended").path("JOB_COV_U04");
        Job existingJob = Job.builder()
                .jobId(804L)
                .title("Active Job")
                .recruiter(sampleRecruiter)
                .company(sampleVerifiedCompany)
                .status(JobStatus.PUBLISHED)
                .approvalStatus(JobApprovalStatus.APPROVED)
                .deadlineDate(LocalDate.now().plusDays(10))
                .build();

        JobCreateRequest updateReq = buildJobReq(
                data.path("title").asText("Job Closed Intentionally"),
                data.path("vacanciesCount").asInt(2),
                new BigDecimal(data.path("salaryMin").asText("15.0")),
                new BigDecimal(data.path("salaryMax").asText("25.0")),
                LocalDate.now().plusDays(data.path("deadlineDaysOffset").asInt(10)));
        updateReq.setStatus(JobStatus.CLOSED);

        when(jobRepository.findById(804L)).thenReturn(Optional.of(existingJob));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));

        JobResponse response = jobService.updateJob(804L, updateReq, sampleRecruiterUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(existingJob.getStatus(), JobStatus.CLOSED);
    }

    @Test(description = "JOB-COV-U05: updateJob yêu cầu PUBLISHED nhưng tin đang PENDING kiểm duyệt -> buộc giữ DRAFT")
    public void test_JOB_COV_U05_updateJob_RequestedPublish_ButUnapproved_StaysDraft() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("extended").path("JOB_COV_U05");
        Job existingJob = Job.builder()
                .jobId(805L)
                .title("Unapproved Job")
                .recruiter(sampleRecruiter)
                .company(sampleVerifiedCompany)
                .status(JobStatus.DRAFT)
                .approvalStatus(JobApprovalStatus.PENDING)
                .deadlineDate(LocalDate.now().plusDays(10))
                .build();

        JobCreateRequest updateReq = buildJobReq(
                data.path("title").asText("Job Unapproved Status Stay Draft"),
                data.path("vacanciesCount").asInt(2),
                new BigDecimal(data.path("salaryMin").asText("15.0")),
                new BigDecimal(data.path("salaryMax").asText("25.0")),
                LocalDate.now().plusDays(data.path("deadlineDaysOffset").asInt(10)));
        updateReq.setStatus(JobStatus.PUBLISHED);

        when(jobRepository.findById(805L)).thenReturn(Optional.of(existingJob));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));

        JobResponse response = jobService.updateJob(805L, updateReq, sampleRecruiterUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(existingJob.getStatus(), JobStatus.DRAFT);
    }

    @Test(description = "JOB-COV-S01: getPublishedJobs với từ khóa rỗng/khoảng trắng và chỉ có địa điểm hợp lệ")
    public void test_JOB_COV_S01_getPublishedJobs_BlankKeyword_ValidLocation() {
        var data = TestDataLoader.loadJsonNode("testdata/job-testdata.json").path("extended").path("JOB_COV_S01");
        String location = data.path("location").asText("Ho Chi Minh");
        String expectedTitle = data.path("expectedTitle").asText("Fullstack Node Developer");

        Job jobHcm = Job.builder()
                .jobId(5L)
                .title(expectedTitle)
                .location(location)
                .status(JobStatus.PUBLISHED)
                .company(sampleVerifiedCompany)
                .build();

        when(jobRepository.searchJobs(null, location)).thenReturn(Collections.singletonList(jobHcm));

        List<JobResponse> results = jobService.getPublishedJobs("   ", location);

        Assert.assertNotNull(results);
        Assert.assertEquals(results.size(), 1);
        Assert.assertEquals(results.get(0).getLocation(), location);
        verify(jobRepository, times(1)).searchJobs(null, location);
    }
}

