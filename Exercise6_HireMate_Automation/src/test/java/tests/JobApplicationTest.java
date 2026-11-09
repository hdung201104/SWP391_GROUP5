package tests;

import org.junit.jupiter.api.*;
import pages.JobApplicationPage;
import pages.LoginPage;

/**
 * JobApplicationTest: Kiểm thử tự động chức năng Quản lý Việc làm & Ứng tuyển (Application & Job Management)
 * trên nền tảng HireMate AI (http://localhost:5173):
 * - Test 1 (Demo B - Happy Path): Ứng viên đăng nhập -> Chọn tin tuyển dụng -> Chọn CV -> Nộp đơn thành công.
 * - Test 2 (Demo C - Negative Business Rule): Chặn nộp 2 lần vào cùng 1 công việc (Single Application Rule).
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class JobApplicationTest extends BaseTest {

    private static final String TARGET_JOB_TITLE = "Senior Java Backend Engineer";
    private static final String CANDIDATE_CV = "CV_NguyenVanA_JavaBackend.pdf";
    private static final String COVER_LETTER =
            "Kính gửi Hội đồng Tuyển dụng FPT Software, tôi có hơn 3 năm kinh nghiệm phát triển Java Spring Boot, "
                    + "Microservices và PostgreSQL. Rất mong có cơ hội đóng góp vào dự án của quý công ty.";

    private LoginPage loginPage;
    private JobApplicationPage page;

    @BeforeEach
    public void setUp() {
        loginPage = new LoginPage(driver);
        page = new JobApplicationPage(driver);
    }

    @Test
    @Order(1)
    @DisplayName("Demo B (Test 1): Job Application Happy Path - Ứng viên đăng nhập, chọn việc làm, chọn CV và nộp đơn thành công")
    public void testJobApplication_HappyPath() throws InterruptedException {
        // 1. Mở trang đăng nhập, làm mới trạng thái ứng tuyển và đăng nhập với tài khoản Ứng viên
        loginPage.open();
        page.resetAppliedJobsState();
        Thread.sleep(1000);

        loginPage.loginWithRole("CANDIDATE", "candidate@hiremate.ai", "Candidate@123");
        Assertions.assertTrue(
                loginPage.isRedirectedAfterLogin(),
                "Ứng viên phải đăng nhập thành công và chuyển hướng sang trang Dashboard"
        );
        Thread.sleep(1000);

        // 2. Chuyển sang trang danh sách việc làm (#/jobs)
        page.openJobList();

        // 3. Chọn công việc "Senior Java Backend Engineer"
        page.selectJob(TARGET_JOB_TITLE);

        // 4. Chọn CV "CV_NguyenVanA_JavaBackend.pdf", nhập Cover Letter và xác nhận nộp đơn
        page.applyWithCv(CANDIDATE_CV, COVER_LETTER);

        // 5 & 6. Assert banner thông báo thành công xuất hiện và chứa nội dung "thành công"
        Assertions.assertTrue(
                page.isApplySuccessDisplayed(),
                "Banner thông báo ứng tuyển thành công (#applySuccess) phải hiển thị"
        );
        Assertions.assertTrue(
                page.getSuccessMessageText().contains("thành công"),
                "Nội dung thông báo phải chứa từ 'thành công', thực tế: " + page.getSuccessMessageText()
        );
        Assertions.assertTrue(
                page.isJobAlreadyApplied(TARGET_JOB_TITLE),
                "Trạng thái trên thẻ công việc phải được cập nhật thành 'Đã ứng tuyển'"
        );
    }

    @Test
    @Order(2)
    @DisplayName("Demo C (Test 2): Negative Business Rule - Chặn ứng viên nộp hồ sơ 2 lần vào cùng 1 công việc (Single Application Rule)")
    public void testJobApplication_DuplicateApply_Prevented() throws InterruptedException {
        // Nếu chạy độc lập riêng lẻ (qua file Chay_Demo_C_Duplicate_Application.bat),
        // tự động đăng nhập và hoàn tất lần nộp đầu tiên trước khi kiểm thử chặn nộp lần 2.
        String currentUrl = driver.getCurrentUrl();
        if (currentUrl == null || !currentUrl.contains("#/jobs") || !page.isJobAlreadyApplied(TARGET_JOB_TITLE)) {
            loginPage.open();
            page.resetAppliedJobsState();
            loginPage.loginWithRole("CANDIDATE", "candidate@hiremate.ai", "Candidate@123");
            Assertions.assertTrue(loginPage.isRedirectedAfterLogin());
            page.openJobList();
            page.selectJob(TARGET_JOB_TITLE);
            page.applyWithCv(CANDIDATE_CV, COVER_LETTER);
            Assertions.assertTrue(page.isApplySuccessDisplayed());
        }

        // 1. Tiếp tục thao tác ứng tuyển lại lần thứ 2 vào đúng công việc "Senior Java Backend Engineer"
        page.openJobList();
        page.selectJob(TARGET_JOB_TITLE);
        page.applyWithCv(CANDIDATE_CV, "Thử nộp lại hồ sơ lần thứ 2 vào cùng vị trí tuyển dụng.");
        Thread.sleep(1000);

        // 2 & 3. Assert hệ thống chặn nộp trùng và hiển thị cảnh báo màu đỏ (#applyError)
        Assertions.assertTrue(
                page.isDuplicateApplyErrorDisplayed(),
                "Hệ thống phải hiển thị banner cảnh báo đỏ (#applyError) khi nộp đơn lần 2 vào cùng 1 công việc"
        );
        String errorMsg = page.getDuplicateErrorMessage();
        Assertions.assertTrue(
                errorMsg.contains("đã nộp") || errorMsg.contains("1 lần"),
                "Thông báo lỗi phải chứa 'đã nộp' hoặc '1 lần', thực tế: " + errorMsg
        );
    }
}

