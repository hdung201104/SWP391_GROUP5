package tests;

import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvFileSource;
import pages.LoginPage;
import utils.TestReportManager;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LoginTest: Kiểm thử tự động chức năng Đăng nhập trên website HireMate AI.
 * Dữ liệu được quản lý và tách rời ra file external: src/test/resources/login-data.csv
 * - Test 1: Đăng nhập thành công với tài khoản đúng -> Assert chuyển trang.
 * - Test 2 (Demo A): Đăng nhập thất bại do sai mật khẩu -> Assert thông báo lỗi.
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
        long start = System.currentTimeMillis();
        boolean pass = false;
        String actualResult = "";
        String errorMsg = null;

        try {
            loginPage.loginWithRole("CANDIDATE", "candidate@hiremate.ai", "Candidate@123");
            assertTrue(
                    loginPage.isRedirectedAfterLogin(),
                    "Sau khi đăng nhập thành công, hệ thống phải chuyển trang sang Dashboard"
            );
            pass = true;
            actualResult = "Đăng nhập thành công, chuyển hướng trang Dashboard, lưu Token";
        } catch (Throwable t) {
            actualResult = "Thất bại: " + t.getMessage();
            errorMsg = t.getMessage();
            throw t;
        } finally {
            TestReportManager.record(
                    "TC_LOG_001",
                    "Authentication",
                    "Đăng nhập thành công với tài khoản đúng (Candidate)",
                    "candidate@hiremate.ai / Candidate@123",
                    "Chuyển hướng sang Dashboard thành công",
                    actualResult,
                    System.currentTimeMillis() - start,
                    pass,
                    errorMsg
            );
        }
    }

    @Test
    @Order(2)
    @DisplayName("Demo A (Test 2): Đăng nhập thất bại do sai mật khẩu -> Assert thông báo lỗi")
    public void testLoginFailedWithWrongPassword() {
        long start = System.currentTimeMillis();
        boolean pass = false;
        String actualResult = "";
        String errorMsg = null;

        try {
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
            pass = true;
            actualResult = "Hiển thị thông báo lỗi đỏ: 'Email hoặc mật khẩu không chính xác', từ chối đăng nhập";
        } catch (Throwable t) {
            actualResult = "Thất bại: " + t.getMessage();
            errorMsg = t.getMessage();
            throw t;
        } finally {
            TestReportManager.record(
                    "TC_LOG_002",
                    "Authentication",
                    "Đăng nhập thất bại do sai mật khẩu (Demo A)",
                    "candidate@hiremate.ai / SaiMatKhau@999",
                    "Hệ thống từ chối đăng nhập và hiển thị thông báo lỗi đỏ",
                    actualResult,
                    System.currentTimeMillis() - start,
                    pass,
                    errorMsg
            );
        }
    }

    @Test
    @Order(3)
    @DisplayName("Test 3: Đăng nhập thất bại do bỏ trống trường -> Assert thông báo yêu cầu nhập")
    public void testLoginFailedWithEmptyFields() {
        long start = System.currentTimeMillis();
        boolean pass = false;
        String actualResult = "";
        String errorMsg = null;

        try {
            loginPage.login("", "");
            assertTrue(
                    loginPage.isErrorMessageDisplayed(),
                    "Phải hiển thị thông báo yêu cầu nhập khi bỏ trống Email và Mật khẩu"
            );
            pass = true;
            actualResult = "Hiển thị thông báo yêu cầu nhập đầy đủ email và mật khẩu";
        } catch (Throwable t) {
            actualResult = "Thất bại: " + t.getMessage();
            errorMsg = t.getMessage();
            throw t;
        } finally {
            TestReportManager.record(
                    "TC_LOG_003",
                    "Authentication",
                    "Đăng nhập thất bại do bỏ trống trường bắt buộc",
                    "Email: (empty) | Pass: (empty)",
                    "Hiển thị thông báo yêu cầu nhập đầy đủ trường bắt buộc",
                    actualResult,
                    System.currentTimeMillis() - start,
                    pass,
                    errorMsg
            );
        }
    }

    @ParameterizedTest(name = "Data-Driven CSV: #{index} ({0})")
    @Order(4)
    @CsvFileSource(resources = "/login-data.csv", numLinesToSkip = 1)
    @DisplayName("Test 4: Kiểm thử tự động nhiều tài khoản đọc từ file external login-data.csv (@CsvFileSource)")
    public void testLoginWithCsvData(
            String email,
            String password,
            String role,
            boolean expectedSuccess,
            String expectedMessage
    ) {
        long start = System.currentTimeMillis();
        boolean pass = false;
        String actualResult = "";
        String errorMsg = null;

        String actualEmail = email == null ? "" : email.trim();
        String actualPassword = password == null ? "" : password.trim();
        String actualRole = role == null ? "CANDIDATE" : role.trim();

        try {
            loginPage.loginWithRole(actualRole, actualEmail, actualPassword);

            if (expectedSuccess) {
                assertTrue(
                        loginPage.isRedirectedAfterLogin(),
                        "Đăng nhập thành công phải chuyển hướng sang trang Dashboard"
                );
                actualResult = "Đăng nhập thành công, chuyển hướng trang Dashboard";
            } else {
                assertTrue(
                        loginPage.isErrorMessageDisplayed(),
                        "Trường hợp kiểm thử âm bản phải hiển thị thông báo lỗi"
                );
                String err = loginPage.getValidationOrErrorMessage().toLowerCase();
                assertTrue(
                        err.contains(expectedMessage.toLowerCase()),
                        "Thông báo lỗi thực tế ('" + err + "') phải chứa: '" + expectedMessage + "'"
                );
                actualResult = "Hiển thị thông báo lỗi đúng kỳ vọng: " + loginPage.getValidationOrErrorMessage();
            }
            pass = true;
        } catch (Throwable t) {
            actualResult = "Thất bại: " + t.getMessage();
            errorMsg = t.getMessage();
            throw t;
        } finally {
            TestReportManager.record(
                    "TC_LOG_CSV_" + (actualEmail.isEmpty() ? "EMPTY" : actualEmail.replace("@", "_")),
                    "Authentication",
                    "Đăng nhập tự động từ CSV: " + (actualEmail.isEmpty() ? "(email rỗng)" : actualEmail),
                    "Email=" + actualEmail + " | Pass=" + (actualPassword.isEmpty() ? "(rỗng)" : "******") + " | Role=" + actualRole,
                    expectedSuccess ? "Đăng nhập thành công" : "Báo lỗi: " + expectedMessage,
                    actualResult,
                    System.currentTimeMillis() - start,
                    pass,
                    errorMsg
            );
        }
    }
}
