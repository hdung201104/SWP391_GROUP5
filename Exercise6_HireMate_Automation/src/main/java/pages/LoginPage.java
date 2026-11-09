package pages;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import utils.DriverFactory;

/**
 * LoginPage: Page Object cho trang Đăng nhập HireMate AI (http://localhost:5173/#/login).
 * Định vị ô Email, Mật khẩu, Nút Đăng nhập, Thông báo lỗi và các phương thức thao tác.
 */
public class LoginPage extends BasePage {

    public static final String LOGIN_URL = DriverFactory.BASE_URL + "/#/login";

    // ==================== 1. LOCATORS TRANG ĐĂNG NHẬP ====================
    private final By emailInput = By.cssSelector("input[name='login_user_email'], input#email");
    private final By passwordInput = By.cssSelector("input[name='login_user_password'], input#password");
    private final By loginButton = By.cssSelector("button#loginBtn, button[type='submit']");
    private final By errorMessage = By.cssSelector("#loginError:not(.hidden), div.bg-rose-50:not(.hidden)");
    private final By successMessage = By.cssSelector("#welcomeBanner, #loginSuccess:not(.hidden), div.bg-emerald-50:not(.hidden)");

    // Các tab chuyển vai trò (Role Switcher) trên trang Login
    private final By candidateRoleTab = By.cssSelector("button[data-role='CANDIDATE']");
    private final By recruiterRoleTab = By.cssSelector("button[data-role='RECRUITER']");
    private final By adminRoleTab = By.cssSelector("button[data-role='ADMIN']");

    public LoginPage(WebDriver driver) {
        super(driver);
    }

    // ==================== 2. CÁC HÀM THAO TÁC ====================

    /**
     * Mở trang Đăng nhập HireMate AI và làm mới trạng thái phiên đăng nhập.
     */
    public void open() {
        driver.get(DriverFactory.BASE_URL + "/?t=" + System.nanoTime() + "#/login");
        waitForVisibility(emailInput);
    }

    /**
     * Chọn tab Vai trò đăng nhập ("CANDIDATE", "RECRUITER", "ADMIN").
     */
    public void selectRoleTab(String role) {
        if (role == null || role.isBlank()) {
            return;
        }
        String r = role.trim().toUpperCase();
        if ("RECRUITER".equals(r)) {
            click(recruiterRoleTab);
        } else if ("ADMIN".equals(r)) {
            click(adminRoleTab);
        } else {
            click(candidateRoleTab);
        }
    }

    /**
     * Nhập địa chỉ Email.
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
     * Nhấn nút Đăng nhập.
     */
    public void clickLogin() {
        click(loginButton);
    }

    /**
     * Thực hiện quy trình đăng nhập với Email và Mật khẩu.
     */
    public void login(String email, String password) {
        enterEmail(email);
        enterPassword(password);
        clickLogin();
    }

    /**
     * Thực hiện quy trình đăng nhập theo Vai trò, Email và Mật khẩu.
     */
    public void loginWithRole(String role, String email, String password) {
        selectRoleTab(role);
        enterEmail(email);
        enterPassword(password);
        clickLogin();
    }

    /**
     * Kiểm tra thông báo lỗi (hoặc yêu cầu nhập) có xuất hiện hay không.
     */
    public boolean isErrorMessageDisplayed() {
        return isDisplayed(errorMessage);
    }

    /**
     * Lấy nội dung thông báo lỗi trên giao diện hoặc thông điệp HTML5 validation khi bỏ trống trường.
     */
    public String getValidationOrErrorMessage() {
        if (isDisplayed(errorMessage)) {
            return getText(errorMessage);
        }
        try {
            JavascriptExecutor js = (JavascriptExecutor) driver;
            WebElement emailElem = waitForPresence(emailInput);
            String emailValMsg = (String) js.executeScript("return arguments[0].validationMessage;", emailElem);
            if (emailValMsg != null && !emailValMsg.isBlank()) {
                return emailValMsg;
            }
        } catch (Exception ignored) {
        }
        return "";
    }

    /**
     * Kiểm tra đăng nhập thành công và chuyển trang sang Dashboard.
     */
    public boolean isRedirectedAfterLogin() {
        try {
            return wait.until(d -> {
                String currentUrl = d.getCurrentUrl().toLowerCase();
                return currentUrl.contains("dashboard") || isDisplayed(successMessage);
            });
        } catch (Exception e) {
            return false;
        }
    }
}