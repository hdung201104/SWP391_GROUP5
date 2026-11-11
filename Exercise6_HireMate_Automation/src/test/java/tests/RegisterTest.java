package tests;

import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvFileSource;
import pages.RegisterPage;
import utils.TestReportManager;

import static org.junit.jupiter.api.Assertions.*;

/**
 * RegisterTest: Kiểm thử tự động chức năng Đăng ký tài khoản trên website HireMate AI.
 * Dữ liệu được tách rời 100% ra file external: src/test/resources/register-data.csv
 * Kiểm thử đa dạng 10 kịch bản:
 * - Đăng ký Candidate thành công (Dynamic unique email)
 * - Đăng ký Recruiter thành công (Dynamic unique email)
 * - Đăng ký Candidate AI Specialist thành công
 * - Báo lỗi trùng email Candidate đã có trong CSDL
 * - Báo lỗi trùng email Recruiter đã có trong CSDL
 * - Báo lỗi mật khẩu xác nhận không khớp (Candidate & Recruiter)
 * - Báo lỗi mật khẩu ngắn < 6 ký tự
 * - Báo lỗi bỏ trống họ tên bắt buộc
 * - Báo lỗi bỏ trống địa chỉ email bắt buộc
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class RegisterTest extends BaseTest {

    private RegisterPage registerPage;

    @BeforeEach
    public void setUp() {
        registerPage = new RegisterPage(driver);
        registerPage.open();
    }

    @ParameterizedTest(name = "Register Test #{index}: {0} - {1}")
    @Order(1)
    @CsvFileSource(resources = "/register-data.csv", numLinesToSkip = 1)
    @DisplayName("Kiểm thử tự động các trường hợp đăng ký đọc từ file external register-data.csv")
    public void testRegisterDataDriven(
            String testCaseId,
            String scenario,
            String role,
            String fullName,
            String email,
            String password,
            String confirmPassword,
            boolean expectedSuccess,
            String expectedMessage
    ) {
        long start = System.currentTimeMillis();
        boolean pass = false;
        String actualResult = "";
        String errorMsg = null;

        // Nếu email bỏ trống trong test thành công, tự động sinh email động duy nhất (Dynamic Timestamp Email)
        String actualEmail = email;
        if (expectedSuccess && (email == null || email.isBlank())) {
            actualEmail = "user_" + System.currentTimeMillis() + "@hiremate.ai";
        }
        if (fullName == null) fullName = "";
        if (actualEmail == null) actualEmail = "";
        if (password == null) password = "";
        if (confirmPassword == null) confirmPassword = "";

        try {
            registerPage.registerWithFullData(role, fullName, actualEmail, password, confirmPassword);

            if (expectedSuccess) {
                assertTrue(
                        registerPage.isRegistrationSuccessful(),
                        "Trường hợp '" + scenario + "' phải hiển thị thông báo đăng ký thành công"
                );
                actualResult = "Đăng ký thành công, thông báo hiển thị đúng kỳ vọng";
            } else {
                assertTrue(
                        registerPage.isErrorMessageDisplayed(),
                        "Trường hợp '" + scenario + "' phải hiển thị thông báo lỗi"
                );
                String errText = registerPage.getErrorMessageText().toLowerCase();
                assertTrue(
                        errText.contains(expectedMessage.toLowerCase()),
                        "Thông báo lỗi thực tế ('" + errText + "') phải chứa '" + expectedMessage + "'"
                );
                actualResult = "Hiển thị thông báo lỗi đúng: " + registerPage.getErrorMessageText();
            }
            pass = true;
        } catch (Throwable t) {
            actualResult = "Thất bại: " + t.getMessage();
            errorMsg = t.getMessage();
            throw t;
        } finally {
            TestReportManager.record(
                    testCaseId,
                    "Authentication",
                    scenario,
                    "Role=" + role + " | Name=" + fullName + " | Email=" + actualEmail,
                    expectedSuccess ? "Đăng ký thành công" : "Báo lỗi: " + expectedMessage,
                    actualResult,
                    System.currentTimeMillis() - start,
                    pass,
                    errorMsg
            );
        }
    }
}
