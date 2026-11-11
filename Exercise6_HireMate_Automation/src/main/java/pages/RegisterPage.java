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
    private final By passwordInput = By.cssSelector("input[name='register_user_password'], input#password");
    private final By confirmPasswordInput = By.cssSelector("input[name='register_user_confirm_password'], input#confirmPassword");

    // Chọn vai trò (Role)
    private final By roleSelectDropdown = By.cssSelector("select#roleSelect, select[name='role']");
    private final By candidateRoleButton = By.cssSelector("button[data-role='CANDIDATE']");
    private final By recruiterRoleButton = By.cssSelector("button[data-role='RECRUITER']");

    // Nút Đăng ký
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
        pause(400);
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
        pause(300);
    }

    public void enterFullName(String fullName) {
        sendKeys(fullNameInput, fullName);
    }

    public void enterEmail(String email) {
        sendKeys(emailInput, email);
    }

    public void enterPassword(String password) {
        sendKeys(passwordInput, password);
    }

    public void enterConfirmPassword(String confirmPassword) {
        sendKeys(confirmPasswordInput, confirmPassword);
    }

    public void clickRegister() {
        click(registerButton);
        pause(600);
    }

    public void registerCandidate(String fullName, String email, String password, String confirmPassword) {
        selectRole("CANDIDATE");
        enterFullName(fullName);
        enterEmail(email);
        enterPassword(password);
        enterConfirmPassword(confirmPassword);
        clickRegister();
    }

    public void registerWithFullData(String role, String fullName, String email, String password, String confirmPassword) {
        selectRole(role);
        enterFullName(fullName);
        enterEmail(email);
        enterPassword(password);
        enterConfirmPassword(confirmPassword);
        clickRegister();
    }

    public boolean isRegistrationSuccessful() {
        return isDisplayed(successMessage);
    }

    public boolean isErrorMessageDisplayed() {
        return isDisplayed(errorMessage);
    }

    public String getErrorMessageText() {
        if (isDisplayed(errorMessage)) {
            return getText(errorMessage);
        }
        return "";
    }
}
