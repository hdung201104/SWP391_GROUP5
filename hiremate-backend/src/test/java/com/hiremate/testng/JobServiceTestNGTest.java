package com.hiremate.testng;

import com.hiremate.dto.request.JobCreateRequest;
import com.hiremate.dto.response.JobResponse;
import com.hiremate.entity.*;
import com.hiremate.enums.EmploymentType;
import com.hiremate.enums.JobStatus;
import com.hiremate.enums.NotificationType;
import com.hiremate.enums.SkillImportance;
import com.hiremate.enums.UserRole;
import com.hiremate.enums.UserStatus;
import com.hiremate.repository.ApplicationRepository;
import com.hiremate.repository.JobRepository;
import com.hiremate.repository.JobSkillRepository;
import com.hiremate.repository.RecruiterRepository;
import com.hiremate.repository.SkillRepository;
import com.hiremate.service.NotificationService;
import com.hiremate.service.impl.JobServiceImpl;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * ============================================================================
 * TEST SUITE: KIỂM THỬ CHỨC NĂNG ĐĂNG BÀI & QUẢN LÝ TIN TUYỂN DỤNG (JOB SERVICE)
 * Sử dụng TestNG Framework chuẩn đề tài FPT SWP391
 * Bao gồm các tính năng & kỹ thuật TestNG tiêu biểu:
 *  - 1. Nhóm kiểm thử AssertX (assertEquals, assertNotNull, assertTrue, assertEqualsNoOrder)
 *  - 2. Kiểm thử đăng tin tuyển dụng thành công kèm Skills (MANDATORY 70% & PREFERRED 30%)
 *  - 3. Bắt ngoại lệ phân quyền SecurityException (Nhà tuyển dụng khác không sửa được tin của nhau)
 *  - 4. Data-Driven Testing (DDT) với @DataProvider tìm kiếm theo nhiều tiêu chí (Keyword, Location)
 *  - 5. Ràng buộc Dependency (dependsOnMethods) - Đăng bài xong mới test xem chi tiết & tăng lượt view
 *  - 6. Kiểm thử vòng đời bài đăng: PUBLISHED -> CLOSED (Đóng tin tuyển dụng)
 *  - 7. Bắt ngoại lệ có chủ đích expectedExceptions (Recruiter / Job không tồn tại)
 * ============================================================================
 */
public class JobServiceTestNGTest {

    private JobRepository jobRepository;
    private JobSkillRepository jobSkillRepository;
    private SkillRepository skillRepository;
    private RecruiterRepository recruiterRepository;
    private NotificationService notificationService;
    private ApplicationRepository applicationRepository;

    private JobServiceImpl jobService;

    private User sampleRecruiterUser;
    private Recruiter sampleRecruiter;
    private Company sampleCompany;
    private Job sampleJob;

    @BeforeMethod
    public void setUp() {
        jobRepository = mock(JobRepository.class);
        jobSkillRepository = mock(JobSkillRepository.class);
        skillRepository = mock(SkillRepository.class);
        recruiterRepository = mock(RecruiterRepository.class);
        applicationRepository = mock(ApplicationRepository.class);
        notificationService = mock(NotificationService.class);

        jobService = new JobServiceImpl(
                jobRepository,
                jobSkillRepository,
                skillRepository,
                recruiterRepository,
                applicationRepository,
                notificationService
        );

        // Khởi tạo Recruiter User mẫu
        sampleRecruiterUser = User.builder()
                .userId(201L)
                .email("hr.techlead@fpt.com")
                .fullName("Tran Van Recruiter")
                .role(UserRole.RECRUITER)
                .status(UserStatus.ACTIVE)
                .isEmailVerified(true)
                .build();

        sampleCompany = Company.builder()
                .companyId(10L)
                .companyName("FPT Software")
                .logoUrl("https://supabase.co/storage/fpt_logo.png")
                .build();

        sampleRecruiter = Recruiter.builder()
                .recruiterId(201L)
                .user(sampleRecruiterUser)
                .company(sampleCompany)
                .department("Talent Acquisition")
                .position("Senior HR Specialist")
                .build();

        sampleJob = Job.builder()
                .jobId(501L)
                .recruiter(sampleRecruiter)
                .company(sampleCompany)
                .title("Senior Java Spring Boot Engineer")
                .description("Phát triển các microservices hiệu năng cao.")
                .requirements("Có từ 3 năm kinh nghiệm Java 17/21, Spring Boot.")
                .benefits("Lương tháng 13, bảo hiểm sức khỏe cao cấp.")
                .salaryMin(new BigDecimal("25000000"))
                .salaryMax(new BigDecimal("45000000"))
                .location("Da Nang, Vietnam")
                .employmentType(EmploymentType.FULL_TIME)
                .vacanciesCount(3)
                .totalViews(10)
                .status(JobStatus.PUBLISHED)
                .deadlineDate(LocalDate.now().plusMonths(1))
                .build();
    }

    /**
     * TEST CASE 1: Đăng tin tuyển dụng thành công với đầy đủ kỹ năng bắt buộc & ưu tiên
     * Kỹ thuật: AssertX, Mockito verify lưu Skill & thông báo Notification
     */
    @Test(priority = 1, description = "TC01: Đăng tin tuyển dụng thành công với kỹ năng và gửi thông báo")
    public void testCreateJobSuccess() {
        // Arrange
        JobCreateRequest request = JobCreateRequest.builder()
                .title("Senior Java Spring Boot Engineer")
                .description("Phát triển microservices.")
                .requirements("Java 21, Spring Boot 3.")
                .benefits("Lương hấp dẫn.")
                .salaryMin(new BigDecimal("25000000"))
                .salaryMax(new BigDecimal("45000000"))
                .location("Da Nang, Vietnam")
                .employmentType(EmploymentType.FULL_TIME)
                .vacanciesCount(3)
                .deadlineDate(LocalDate.now().plusDays(30))
                .mandatorySkillIds(Arrays.asList(1L, 2L)) // Java, Spring Boot
                .preferredSkillIds(Collections.singletonList(3L)) // PostgreSQL
                .build();

        when(recruiterRepository.findById(201L)).thenReturn(Optional.of(sampleRecruiter));
        when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> {
            Job saved = invocation.getArgument(0);
            saved.setJobId(501L);
            return saved;
        });

        // Act
        JobResponse response = jobService.createJob(request, sampleRecruiterUser);

        // Assert (Nhóm AssertX)
        Assert.assertNotNull(response, "JobResponse không được null");
        Assert.assertEquals(response.getJobId(), Long.valueOf(501L), "JobId trả về phải là 501");
        Assert.assertEquals(response.getTitle(), "Senior Java Spring Boot Engineer");
        Assert.assertEquals(response.getCompanyName(), "FPT Software");
        Assert.assertEquals(response.getStatus(), JobStatus.PUBLISHED);
        Assert.assertEquals(response.getVacanciesCount(), Integer.valueOf(3));

        // Verify nghiệp vụ: lưu kỹ năng bắt buộc và kỹ năng ưu tiên
        verify(jobSkillRepository, times(2)).save(argThat(skill ->
                skill.getImportance() == SkillImportance.MANDATORY && skill.getWeight() == 1.0f));
        verify(jobSkillRepository, times(1)).save(argThat(skill ->
                skill.getImportance() == SkillImportance.PREFERRED && skill.getWeight() == 0.5f));

        // Verify gửi thông báo cho nhà tuyển dụng
        verify(notificationService, times(1)).createNotification(
                eq(201L),
                eq(NotificationType.SYSTEM_ALERT),
                anyString(),
                anyString(),
                eq(501L),
                eq("jobs")
        );
    }

    /**
     * TEST CASE 2: Bắt lỗi khi tài khoản không phải là Recruiter (Hồ sơ Recruiter không tồn tại)
     * Kỹ thuật: expectedExceptions của TestNG
     */
    @Test(priority = 2, expectedExceptions = IllegalStateException.class,
          expectedExceptionsMessageRegExp = ".*Recruiter profile not found for user.*",
          description = "TC02: Bắt lỗi khi người dùng chưa có hồ sơ Recruiter")
    public void testCreateJobRecruiterNotFound() {
        // Arrange
        JobCreateRequest request = JobCreateRequest.builder()
                .title("Software Engineer")
                .build();
        when(recruiterRepository.findById(201L)).thenReturn(Optional.empty());

        // Act (Ném IllegalStateException)
        jobService.createJob(request, sampleRecruiterUser);
    }

    /**
     * TEST CASE 3: Cập nhật tin tuyển dụng thành công bởi chính chủ sở hữu
     * Kỹ thuật: AssertX, verify cập nhật fields
     */
    @Test(priority = 3, description = "TC03: Cập nhật tin tuyển dụng thành công bởi đúng Recruiter sở hữu")
    public void testUpdateJobSuccess() {
        // Arrange
        JobCreateRequest updateRequest = JobCreateRequest.builder()
                .title("Lead Java Architect")
                .description("Thiết kế kiến trúc hệ thống lớn.")
                .requirements("Java 21, Microservices, Kubernetes.")
                .benefits("Cổ phần ESOP.")
                .salaryMin(new BigDecimal("40000000"))
                .salaryMax(new BigDecimal("70000000"))
                .location("Da Nang, Vietnam")
                .employmentType(EmploymentType.FULL_TIME)
                .vacanciesCount(1)
                .build();

        when(jobRepository.findById(501L)).thenReturn(Optional.of(sampleJob));
        when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        JobResponse response = jobService.updateJob(501L, updateRequest, sampleRecruiterUser);

        // Assert
        Assert.assertNotNull(response);
        Assert.assertEquals(response.getTitle(), "Lead Java Architect");
        Assert.assertEquals(response.getSalaryMin(), new BigDecimal("40000000"));
        Assert.assertEquals(response.getSalaryMax(), new BigDecimal("70000000"));
        Assert.assertEquals(response.getVacanciesCount(), Integer.valueOf(1));
        verify(jobRepository, times(1)).save(sampleJob);
    }

    /**
     * TEST CASE 4: Bắt lỗi bảo mật khi Recruiter khác cố tình sửa bài đăng của người khác
     * Kỹ thuật: expectedExceptions = SecurityException.class
     */
    @Test(priority = 4, expectedExceptions = SecurityException.class,
          expectedExceptionsMessageRegExp = "You are not authorized to update this job",
          description = "TC04: Bắt lỗi phân quyền khi sửa tin tuyển dụng của người khác")
    public void testUpdateJobUnauthorizedRecruiter() {
        // Arrange: Người dùng khác có userId = 999L
        User hackerRecruiter = User.builder()
                .userId(999L)
                .email("intruder@competitor.com")
                .role(UserRole.RECRUITER)
                .build();

        when(jobRepository.findById(501L)).thenReturn(Optional.of(sampleJob));

        JobCreateRequest request = JobCreateRequest.builder()
                .title("Tampered Job Title")
                .build();

        // Act (Ném SecurityException)
        jobService.updateJob(501L, request, hackerRecruiter);
    }

    /**
     * DataProvider cung cấp các kịch bản tìm kiếm tin tuyển dụng đa dạng
     */
    @DataProvider(name = "jobSearchParams")
    public Object[][] provideJobSearchParams() {
        return new Object[][]{
                {null, null, "Tìm tất cả tin đang PUBLISHED"},
                {"Java", null, "Tìm kiếm theo từ khóa 'Java'"},
                {null, "Da Nang", "Tìm kiếm theo địa điểm 'Da Nang'"},
                {"Spring Boot", "Da Nang", "Tìm kiếm kết hợp cả từ khóa và địa điểm"}
        };
    }

    /**
     * TEST CASE 5: Data-Driven Testing (DDT) tìm kiếm việc làm
     * Kỹ thuật: @DataProvider của TestNG
     */
    @Test(priority = 5, dataProvider = "jobSearchParams",
          description = "TC05: Data-Driven Testing tìm kiếm bài đăng tuyển dụng theo nhiều tiêu chí")
    public void testSearchJobsWithDataProvider(String keyword, String location, String testDescription) {
        // Arrange
        if (keyword == null && location == null) {
            when(jobRepository.findByStatus(JobStatus.PUBLISHED))
                    .thenReturn(Collections.singletonList(sampleJob));
        } else {
            when(jobRepository.searchJobs(any(), any()))
                    .thenReturn(Collections.singletonList(sampleJob));
        }

        // Act
        List<JobResponse> results = jobService.getPublishedJobs(keyword, location);

        // Assert
        Assert.assertNotNull(results, "Kết quả tìm kiếm không được null cho: " + testDescription);
        Assert.assertEquals(results.size(), 1, "Phải tìm thấy 1 kết quả bài đăng");
        Assert.assertEquals(results.get(0).getTitle(), "Senior Java Spring Boot Engineer");
    }

    /**
     * TEST CASE 6: Ràng buộc Dependency (dependsOnMethods)
     * Test xem chi tiết bài đăng và tự động tăng số lượt xem (Total Views)
     */
    @Test(priority = 6, dependsOnMethods = {"testCreateJobSuccess"},
          description = "TC06: Lấy chi tiết bài đăng và kiểm tra tự động tăng lượt xem (totalViews)")
    public void testGetJobByIdAndIncrementViews() {
        // Arrange
        sampleJob.setTotalViews(10);
        when(jobRepository.findById(501L)).thenReturn(Optional.of(sampleJob));
        when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        JobResponse response = jobService.getJobById(501L);

        // Assert
        Assert.assertNotNull(response);
        Assert.assertEquals(response.getTotalViews(), Integer.valueOf(11),
                "Số lượt xem phải tăng từ 10 lên 11");
        verify(jobRepository, times(1)).save(sampleJob);
    }

    /**
     * TEST CASE 7: Đóng tin tuyển dụng (Close Job) thành công
     * Kỹ thuật: Chuyển trạng thái PUBLISHED -> CLOSED
     */
    @Test(priority = 7, description = "TC07: Đóng tin tuyển dụng thành công")
    public void testCloseJobSuccess() {
        // Arrange
        when(jobRepository.findById(501L)).thenReturn(Optional.of(sampleJob));
        when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        jobService.closeJob(501L, sampleRecruiterUser);

        // Assert
        Assert.assertEquals(sampleJob.getStatus(), JobStatus.CLOSED,
                "Trạng thái bài đăng phải được chuyển sang CLOSED");
        verify(jobRepository, times(1)).save(sampleJob);
    }

    /**
     * TEST CASE 8: Bắt lỗi khi thao tác trên JobId không tồn tại
     * Kỹ thuật: expectedExceptions = IllegalArgumentException.class
     */
    @Test(priority = 8, expectedExceptions = IllegalArgumentException.class,
          expectedExceptionsMessageRegExp = "Job not found: 9999",
          description = "TC08: Bắt lỗi khi truy xuất bài đăng không tồn tại")
    public void testGetJobByIdNotFound() {
        when(jobRepository.findById(9999L)).thenReturn(Optional.empty());

        // Act (Ném IllegalArgumentException)
        jobService.getJobById(9999L);
    }
}
