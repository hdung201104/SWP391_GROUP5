package tests;

import org.junit.jupiter.api.*;
import pages.JobApplicationPage;
import pages.LoginPage;
import utils.TestReportManager;

/**
 * JobApplicationTest: Kiểm thử tự động chức năng Quản lý Việc làm & Ứng tuyển (Application Management)
 * Dữ liệu kiểm thử được tách rời ra external CSV: src/test/resources/job-application-data.csv
 * Kiểm thử 5 kịch bản toàn diện:
 * - Test 1 (Demo B - Happy Path): Nộp đơn vị trí Senior Java Backend Engineer thành công.
 * - Test 2 (Demo C - Negative Rule): Chặn nộp 2 lần vào cùng 1 công việc (Single Application Rule).
 * - Test 3: Ứng tuyển vị trí Frontend React Developer với CV Fullstack.
 * - Test 4: Ứng tuyển vị trí AI & Machine Learning Engineer với CV AI Engineer.
 * - Test 5: Mở modal ứng tuyển sau đó bấm Hủy/Đóng -> Modal đóng lại, không nộp đơn nhầm.
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class JobApplicationTest extends BaseTest {

    private static final String TARGET_JOB_TITLE = "Senior Java Backend Engineer";
    private static final String CANDIDATE_CV = "CV_NguyenVanA_JavaBackend.pdf";
    private static final String COVER_LETTER =
            "Kính gửi Hội đồng Tuyển dụng FPT Software, tôi có hơn 3 năm kinh nghiệm phát triển Java Spring Boot.";

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
        long start = System.currentTimeMillis();
        boolean pass = false;
        String actualResult = "";
        String errorMsg = null;

        try {
            // 1. Mở trang đăng nhập, làm mới trạng thái và đăng nhập tài khoản Ứng viên
            loginPage.open();
            page.resetAppliedJobsState();
            Thread.sleep(500);

            loginPage.loginWithRole("CANDIDATE", "candidate@hiremate.ai", "Candidate@123");
            Assertions.assertTrue(
                    loginPage.isRedirectedAfterLogin(),
                    "Ứng viên phải đăng nhập thành công và chuyển hướng sang Dashboard"
            );
            Thread.sleep(400);

            // 2. Chuyển sang trang danh sách việc làm (#/jobs)
            page.openJobList();

            // 3. Chọn công việc "Senior Java Backend Engineer"
            page.selectJob(TARGET_JOB_TITLE);

            // 4. Chọn CV "CV_NguyenVanA_JavaBackend.pdf", nhập Cover Letter và nộp đơn
            page.applyWithCv(CANDIDATE_CV, COVER_LETTER);

            // 5 & 6. Assert thông báo thành công và trạng thái
            Assertions.assertTrue(
                    page.isApplySuccessDisplayed(),
                    "Banner thông báo ứng tuyển thành công (#applySuccess) phải hiển thị"
            );
            Assertions.assertTrue(
                    page.getSuccessMessageText().contains("thành công"),
                    "Nội dung thông báo phải chứa từ 'thành công'"
            );
            Assertions.assertTrue(
                    page.isJobAlreadyApplied(TARGET_JOB_TITLE),
                    "Trạng thái trên thẻ công việc phải đổi thành 'Đã ứng tuyển'"
            );

            pass = true;
            actualResult = "Ứng tuyển thành công, banner xanh xuất hiện, trạng thái đổi 'Đã ứng tuyển'";
        } catch (Throwable t) {
            actualResult = "Thất bại: " + t.getMessage();
            errorMsg = t.getMessage();
            throw t;
        } finally {
            TestReportManager.record(
                    "TC_APP_001",
                    "Application Management",
                    "Ứng viên nộp đơn ứng tuyển thành công (Demo B - Happy Path)",
                    "Job=" + TARGET_JOB_TITLE + " | CV=" + CANDIDATE_CV,
                    "Hiển thị banner xanh 'Ứng tuyển thành công' và trạng thái 'Đã ứng tuyển'",
                    actualResult,
                    System.currentTimeMillis() - start,
                    pass,
                    errorMsg
            );
        }
    }

    @Test
    @Order(2)
    @DisplayName("Demo C (Test 2): Negative Business Rule - Chặn nộp hồ sơ 2 lần vào cùng 1 công việc (Single Application Rule)")
    public void testJobApplication_DuplicateApply_Prevented() throws InterruptedException {
        long start = System.currentTimeMillis();
        boolean pass = false;
        String actualResult = "";
        String errorMsg = null;

        try {
            String currentUrl = driver.getCurrentUrl();
            if (currentUrl == null || !currentUrl.contains("#/jobs") || !page.isJobAlreadyApplied(TARGET_JOB_TITLE)) {
                loginPage.open();
                page.resetAppliedJobsState();
                loginPage.loginWithRole("CANDIDATE", "candidate@hiremate.ai", "Candidate@123");
                page.openJobList();
                page.selectJob(TARGET_JOB_TITLE);
                page.applyWithCv(CANDIDATE_CV, COVER_LETTER);
            }

            // Thao tác nộp đơn lại lần thứ 2 vào đúng công việc đó
            page.openJobList();
            page.selectJob(TARGET_JOB_TITLE);
            page.applyWithCv(CANDIDATE_CV, "Thử nộp lại lần 2 vào cùng vị trí.");
            Thread.sleep(400);

            // Assert hệ thống chặn nộp trùng và hiển thị cảnh báo đỏ (#applyError)
            Assertions.assertTrue(
                    page.isDuplicateApplyErrorDisplayed(),
                    "Hệ thống phải hiển thị banner cảnh báo đỏ (#applyError) khi nộp lần 2"
            );
            String duplicateMsg = page.getDuplicateErrorMessage();
            Assertions.assertTrue(
                    duplicateMsg.contains("đã nộp") || duplicateMsg.contains("1 lần"),
                    "Thông báo lỗi phải chứa 'đã nộp' hoặc '1 lần', thực tế: " + duplicateMsg
            );

            pass = true;
            actualResult = "Chặn nộp trùng lặp thành công, banner cảnh báo đỏ xuất hiện bảo vệ Single Application Rule";
        } catch (Throwable t) {
            actualResult = "Thất bại: " + t.getMessage();
            errorMsg = t.getMessage();
            throw t;
        } finally {
            TestReportManager.record(
                    "TC_APP_002",
                    "Application Management",
                    "Chặn nộp hồ sơ 2 lần vào cùng 1 job (Demo C - Single Application Rule)",
                    "Job=" + TARGET_JOB_TITLE + " (đã nộp trước đó)",
                    "Hệ thống chặn lại, hiện cảnh báo đỏ 'Chỉ cho phép ứng tuyển 1 lần'",
                    actualResult,
                    System.currentTimeMillis() - start,
                    pass,
                    errorMsg
            );
        }
    }

    @Test
    @Order(3)
    @DisplayName("Test 3: Ứng tuyển vào vị trí Frontend React Developer")
    public void testJobApplicationForFrontendDeveloper() throws InterruptedException {
        long start = System.currentTimeMillis();
        boolean pass = false;
        String actualResult = "";
        String errorMsg = null;
        String jobTitle = "Frontend React Developer";

        try {
            page.openJobList();
            page.selectJob(jobTitle);
            page.applyWithCv("CV_NguyenVanA_Fullstack.pdf", "Kính gửi VNG Corporation, tôi nộp CV vị trí Frontend React.");

            Assertions.assertTrue(page.isApplySuccessDisplayed());
            Assertions.assertTrue(page.getSuccessMessageText().contains("thành công"));

            pass = true;
            actualResult = "Nộp đơn thành công cho " + jobTitle + ", banner xanh hiển thị";
        } catch (Throwable t) {
            actualResult = "Thất bại: " + t.getMessage();
            errorMsg = t.getMessage();
            throw t;
        } finally {
            TestReportManager.record(
                    "TC_APP_003",
                    "Application Management",
                    "Ứng tuyển vị trí Frontend Developer",
                    "Job=" + jobTitle + " | CV=CV_NguyenVanA_Fullstack.pdf",
                    "Hiển thị banner xanh thông báo nộp đơn thành công",
                    actualResult,
                    System.currentTimeMillis() - start,
                    pass,
                    errorMsg
            );
        }
    }

    @Test
    @Order(4)
    @DisplayName("Test 4: Ứng tuyển vào vị trí AI Engineer")
    public void testJobApplicationForAIEngineer() throws InterruptedException {
        long start = System.currentTimeMillis();
        boolean pass = false;
        String actualResult = "";
        String errorMsg = null;
        String jobTitle = "AI Engineer";

        try {
            page.openJobList();
            page.selectJob(jobTitle);
            page.applyWithCv("CV_NguyenVanA_AIEngineer.pdf", "Kính gửi Viettel AI Lab, tôi xin ứng tuyển vị trí Kỹ sư AI.");

            Assertions.assertTrue(page.isApplySuccessDisplayed());
            Assertions.assertTrue(page.getSuccessMessageText().contains("thành công"));

            pass = true;
            actualResult = "Nộp đơn thành công cho " + jobTitle + ", banner xanh hiển thị";
        } catch (Throwable t) {
            actualResult = "Thất bại: " + t.getMessage();
            errorMsg = t.getMessage();
            throw t;
        } finally {
            TestReportManager.record(
                    "TC_APP_004",
                    "Application Management",
                    "Ứng tuyển vị trí AI Engineer",
                    "Job=" + jobTitle + " | CV=CV_NguyenVanA_AIEngineer.pdf",
                    "Hiển thị banner xanh thông báo nộp đơn thành công",
                    actualResult,
                    System.currentTimeMillis() - start,
                    pass,
                    errorMsg
            );
        }
    }

    @Test
    @Order(5)
    @DisplayName("Test 5: Mở modal nộp đơn sau đó bấm Đóng/Hủy -> Modal đóng, không nộp đơn")
    public void testApplyModalCancelAndClose() throws InterruptedException {
        long start = System.currentTimeMillis();
        boolean pass = false;
        String actualResult = "";
        String errorMsg = null;

        try {
            page.openJobList();
            page.openApplyModal();
            Assertions.assertTrue(page.isModalDisplayed(), "Modal ứng tuyển phải mở lên");

            page.closeModal();
            Assertions.assertFalse(page.isModalDisplayed(), "Modal ứng tuyển phải đóng lại sau khi nhấn nút Đóng/Hủy");

            pass = true;
            actualResult = "Modal mở lên và đóng lại chuẩn xác khi nhấn Đóng/Hủy, không phát sinh đơn nộp ngoài ý muốn";
        } catch (Throwable t) {
            actualResult = "Thất bại: " + t.getMessage();
            errorMsg = t.getMessage();
            throw t;
        } finally {
            TestReportManager.record(
                    "TC_APP_005",
                    "Application Management",
                    "Đóng/Hủy popup ứng tuyển an toàn (Modal Cancel)",
                    "Action=Click #btnCloseModal",
                    "Modal đóng an toàn, không gửi request ứng tuyển",
                    actualResult,
                    System.currentTimeMillis() - start,
                    pass,
                    errorMsg
            );
        }
    }
}
