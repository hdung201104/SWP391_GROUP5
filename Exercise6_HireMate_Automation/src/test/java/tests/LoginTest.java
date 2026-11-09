package tests;

import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvFileSource;
import org.openqa.selenium.WebDriver;
import pages.LoginPage;
import utils.DriverFactory;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LoginTest: Kiểm thử tự động chức năng Đăng nhập trên website HireMate AI (http://localhost:5173).
 * - Test 1: Đăng nhập thành công với tài khoản đúng -> Assert chuyển trang.
 * - Test 2: Đăng nhập thất bại do sai mật khẩu -> Assert thông báo lỗi.
 * - Test 3: Đăng nhập thất bại do bỏ trống trường -> Assert thông báo yêu cầu nhập.
 * - Test 4: Đọc dữ liệu từ file CSV (@CsvFileSource) chạy kiểm thử tự động nhiều tài khoản.
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class LoginTest extends BaseTest {

    private LoginPage loginPage;

    @BeforeEach
    public void setUp() {
        loginPage = new LoginPage(driver);
        loginPage.open();
    }

    @Test
    @Order(1)
    @DisplayName("Test 1: Đăng nhập thành công với tài khoản đúng -> Assert chuyển trang")
    public void testLoginSuccessWithValidCredentials() {
        loginPage.loginWithRole("CANDIDATE", "candidate@hiremate.ai", "Candidate@123");

        assertTrue(
                loginPage.isRedirectedAfterLogin(),
                "Sau khi đăng nhập thành công, hệ thống phải chuyển trang sang Dashboard"
        );
    }

    @Test
    @Order(2)
    @DisplayName("Test 2: Đăng nhập thất bại do sai mật khẩu -> Assert thông báo lỗi")
    public void testLoginFailedWithWrongPassword() {
        loginPage.loginWithRole("CANDIDATE", "candidate@hiremate.ai", "SaiMatKhau@999");

        assertTrue(
                loginPage.isErrorMessageDisplayed(),
                "Phải hiển thị thông báo lỗi khi nhập sai mật khẩu"
        );
        String errorText = loginPage.getValidationOrErrorMessage().toLowerCase();
        assertTrue(
                errorText.contains("không chính xác") || errorText.contains("lỗi") || errorText.contains("sai"),
                "Nội dung thông báo lỗi không khớp: " + errorText
        );
    }

    @Test
    @Order(3)
    @DisplayName("Test 3: Đăng nhập thất bại do bỏ trống trường -> Assert thông báo yêu cầu nhập")
    public void testLoginFailedWithEmptyFields() {
        loginPage.login("", "");

        assertTrue(
                loginPage.isErrorMessageDisplayed(),
                "Phải hiển thị thông báo yêu cầu nhập khi bỏ trống Email và Mật khẩu"
        );
        String validationMessage = loginPage.getValidationOrErrorMessage();
        assertFalse(
                validationMessage.isBlank(),
                "Thông báo yêu cầu nhập trường bắt buộc không được rỗng"
        );
    }

    @ParameterizedTest(name = "Test 4 (CSV #{index}): email={0}, role={2}, expectedSuccess={3}")
    @Order(4)
    @CsvFileSource(resources = "/login-data.csv", numLinesToSkip = 1)
    @DisplayName("Test 4: Kiểm thử tự động nhiều tài khoản từ file login-data.csv (@CsvFileSource)")
    public void testLoginWithCsvData(
            String email,
            String password,
            String role,
            boolean expectedSuccess,
            String expectedMessage
    ) {
        loginPage.loginWithRole(role, email, password);

        if (expectedSuccess) {
            assertTrue(
                    loginPage.isRedirectedAfterLogin(),
                    "Tài khoản hợp lệ (" + email + ") phải đăng nhập thành công và chuyển trang"
            );
        } else {
            assertTrue(
                    loginPage.isErrorMessageDisplayed(),
                    "Tài khoản không hợp lệ (" + email + ") phải hiển thị thông báo lỗi"
            );
            String actualError = loginPage.getValidationOrErrorMessage().toLowerCase();
            assertTrue(
                    actualError.contains(expectedMessage.toLowerCase()),
                    "Thông báo lỗi thực tế ('" + actualError + "') phải chứa '" + expectedMessage + "'"
            );
        }
    }
}
