package pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import utils.DriverFactory;

/**
 * RegisterPage: Page Object cho trang Đăng ký HireMate AI (http://localhost:5173/#/register).
 * Định vị Họ tên, Email, Mật khẩu, Xác nhận mật khẩu, Chọn vai trò (Role), Nút Đăng ký.
 */
public class RegisterPage extends BasePage {

    public static final String REGISTER_URL = DriverFactory.BASE_URL + "/#/register";

    // ==================== 1. LOCATORS TRANG ĐĂNG KÝ ====================
    private final By fullNameInput = By.cssSelector("input[name='register_candidate_fullname'], input#fullName");
    private final By emailInput = By.cssSelector("input[name='register_candidate_email'], input#email");
    private final By phoneInput = By.cssSelector("input[name='register_candidate_phone'], input#phone");
    private final By headlineInput = By.cssSelector("input[name='headline'], input#headline");
    private final By passwordInput = By.cssSelector("input[name='register_user_password'], input#password");
    private final By confirmPasswordInput = By.cssSelector("input[name='register_user_confirm_password'], input#confirmPassword");

    // Chọn vai trò (Role)
    private final By roleSelectDropdown = By.cssSelector("select#roleSelect, select[name='role']");
    private final By candidateRoleButton = By.cssSelector("button[data-role='CANDIDATE']");
    private final By recruiterRoleButton = By.cssSelector("button[data-role='RECRUITER']");

    // Checkbox điều khoản & Nút Đăng ký
    private final By termsCheckbox = By.cssSelector("input#terms, input[type='checkbox']");
    private final By registerButton = By.cssSelector("button#registerBtn, button[type='submit']");

    // Thông báo lỗi & Thông báo thành công
    private final By errorMessage = By.cssSelector("#registerError:not(.hidden), div.bg-rose-50:not(.hidden)");
    private final By successMessage = By.cssSelector("#registerSuccess:not(.hidden), div.bg-emerald-50:not(.hidden)");

    public RegisterPage(WebDriver driver) {
        super(driver);
    }

    // ==================== 2. CÁC HÀM THAO TÁC ====================

    /**
     * Mở trang Đăng ký HireMate AI.
     */
    public void open() {
        driver.get(DriverFactory.BASE_URL + "/?t=" + System.nanoTime() + "#/register");
        waitForVisibility(fullNameInput);
    }

    /**
     * Chọn vai trò đăng ký ("CANDIDATE" hoặc "RECRUITER").
     */
    public void selectRole(String role) {
        if (role == null || role.isBlank()) {
            return;
        }
        String normalizedRole = role.trim().toUpperCase();
        try {
            WebElement selectElem = waitForVisibility(roleSelectDropdown);
            new Select(selectElem).selectByValue(normalizedRole);
            if ("RECRUITER".equals(normalizedRole)) {
                click(recruiterRoleButton);
            } else {
                click(candidateRoleButton);
            }
        } catch (Exception ignored) {
        }
    }

    /**
     * Nhập Họ và tên.
     */
    public void enterFullName(String fullName) {
        sendKeys(fullNameInput, fullName);
    }

    /**
     * Nhập Email đăng ký.
     */
    public void enterEmail(String email) {
        sendKeys(emailInput, email);
    }

    /**
     * Nhập Mật khẩu.
     */
    public void enterPassword(String password) {
        sendKeys(passwordInput, password);
    }

    /**
     * Nhập Xác nhận mật khẩu.
     */
    public void enterConfirmPassword(String confirmPassword) {
        sendKeys(confirmPasswordInput, confirmPassword);
    }

    /**
     * Nhấn nút Đăng ký.
     */
    public void clickRegister() {
        click(registerButton);
    }

    /**
     * Thực hiện điền form đăng ký tài khoản ứng viên và nhấn nút Đăng ký.
     */
    public void registerCandidate(String fullName, String email, String password, String confirmPassword) {
        selectRole("CANDIDATE");
        enterFullName(fullName);
        enterEmail(email);
        enterPassword(password);
        enterConfirmPassword(confirmPassword);
        clickRegister();
    }

    /**
     * Kiểm tra thông báo đăng ký thành công.
     */
    public boolean isRegistrationSuccessful() {
        return isDisplayed(successMessage);
    }

    /**
     * Kiểm tra thông báo lỗi có hiển thị hay không.
     */
    public boolean isErrorMessageDisplayed() {
        return isDisplayed(errorMessage);
    }

    /**
     * Lấy nội dung thông báo lỗi trên giao diện.
     */
    public String getErrorMessageText() {
        if (isDisplayed(errorMessage)) {
            return getText(errorMessage);
        }
        return "";
    }
}
