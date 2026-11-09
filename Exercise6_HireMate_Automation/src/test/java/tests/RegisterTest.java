package tests;

import org.junit.jupiter.api.*;
import org.openqa.selenium.WebDriver;
import pages.RegisterPage;
import utils.DriverFactory;

import static org.junit.jupiter.api.Assertions.*;

/**
 * RegisterTest: Kiểm thử tự động chức năng Đăng ký tài khoản trên website HireMate AI (http://localhost:5173).
 * - Test 1: Đăng ký tài khoản ứng viên mới thành công.
 * - Test 2: Đăng ký với email đã tồn tại -> Assert báo lỗi trùng email.
 * - Test 3: Đăng ký với mật khẩu xác nhận không khớp -> Assert báo lỗi mismatch.
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class RegisterTest extends BaseTest {

    private RegisterPage registerPage;

    @BeforeEach
    public void setUp() {
        registerPage = new RegisterPage(driver);
        registerPage.open();
    }

    @Test
    @Order(1)
    @DisplayName("Test 1: Đăng ký tài khoản ứng viên mới thành công")
    public void testRegisterNewCandidateSuccess() {
        String uniqueEmail = "candidate_" + System.currentTimeMillis() + "@hiremate.ai";

        registerPage.registerCandidate(
                "Nguyễn Văn Ứng Viên",
                uniqueEmail,
                "Candidate@2026",
                "Candidate@2026"
        );

        assertTrue(
                registerPage.isRegistrationSuccessful(),
                "Phải hiển thị thông báo đăng ký tài khoản ứng viên mới thành công"
        );
    }

    @Test
    @Order(2)
    @DisplayName("Test 2: Đăng ký với email đã tồn tại -> Assert báo lỗi trùng email")
    public void testRegisterWithExistingEmail() {
        registerPage.registerCandidate(
                "Nguyễn Văn Trùng Email",
                "candidate@hiremate.ai",
                "Candidate@2026",
                "Candidate@2026"
        );

        assertTrue(
                registerPage.isErrorMessageDisplayed(),
                "Phải hiển thị thông báo lỗi khi đăng ký bằng email đã tồn tại"
        );
        String errorMsg = registerPage.getErrorMessageText().toLowerCase();
        assertTrue(
                errorMsg.contains("đã được đăng ký") || errorMsg.contains("tồn tại") || errorMsg.contains("already exists"),
                "Nội dung lỗi phải thông báo trùng email, thực tế: " + errorMsg
        );
    }

    @Test
    @Order(3)
    @DisplayName("Test 3: Đăng ký với mật khẩu xác nhận không khớp -> Assert báo lỗi mismatch")
    public void testRegisterWithPasswordMismatch() {
        String uniqueEmail = "mismatch_" + System.currentTimeMillis() + "@hiremate.ai";

        registerPage.registerCandidate(
                "Lê Thị Kiểm Thử",
                uniqueEmail,
                "Password@123",
                "DifferentPassword@999"
        );

        assertTrue(
                registerPage.isErrorMessageDisplayed(),
                "Phải hiển thị thông báo lỗi khi mật khẩu và xác nhận mật khẩu không khớp"
        );
        String errorMsg = registerPage.getErrorMessageText().toLowerCase();
        assertTrue(
                errorMsg.contains("không khớp") || errorMsg.contains("mismatch"),
                "Nội dung lỗi phải báo mật khẩu xác nhận không khớp, thực tế: " + errorMsg
        );
    }
}
