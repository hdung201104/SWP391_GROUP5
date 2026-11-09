package pages;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import utils.DriverFactory;

import java.util.List;

/**
 * JobApplicationPage: Page Object cho chức năng Quản lý Việc làm & Ứng tuyển (http://localhost:5173/#/jobs).
 * Tuân thủ mô hình Page Object Model (POM) với đầy đủ Locators và Actions.
 */
public class JobApplicationPage extends BasePage {

    public static final String JOBS_URL = DriverFactory.BASE_URL + "/#/jobs";

    // ==================== 1. LOCATORS TRANG VIỆC LÀM & ỨNG TUYỂN ====================
    private final By jobCards = By.cssSelector(".job-card");
    private final By applyJobButton = By.cssSelector("button.btn-apply-job");
    private final By applyModal = By.id("applyModal");
    private final By cvSelect = By.id("cvSelect");
    private final By coverLetterInput = By.id("coverLetter");
    private final By confirmApplyButton = By.id("btnConfirmApply");
    private final By applySuccessBanner = By.cssSelector("#applySuccess:not(.hidden)");
    private final By applyErrorBanner = By.cssSelector("#applyError:not(.hidden)");
    private final By applicationStatus = By.cssSelector(".application-status");

    public JobApplicationPage(WebDriver driver) {
        super(driver);
    }

    // ==================== 2. CÁC HÀM THAO TÁC (ACTIONS) ====================

    /**
     * Điều hướng tới trang Danh sách việc làm (http://localhost:5173/#/jobs).
     */
    public void openJobList() {
        driver.get(JOBS_URL);
        waitForVisibility(jobCards);
        pauseForDemo(1000);
    }

    /**
     * Xóa dữ liệu lịch sử ứng tuyển trong localStorage để chuẩn bị cho kịch bản Happy Path mới.
     */
    public void resetAppliedJobsState() {
        try {
            ((JavascriptExecutor) driver).executeScript("localStorage.removeItem('hiremate_applied_jobs');");
        } catch (Exception ignored) {
        }
    }

    /**
     * Tìm và click vào công việc theo tiêu đề (jobTitle) để mở Modal ứng tuyển.
     */
    public void selectJob(String jobTitle) {
        waitForVisibility(jobCards);
        List<WebElement> cards = driver.findElements(jobCards);

        for (WebElement card : cards) {
            String cardText = card.getText();
            String dataTitle = card.getAttribute("data-job-title");
            if ((dataTitle != null && dataTitle.equalsIgnoreCase(jobTitle))
                    || (cardText != null && cardText.toLowerCase().contains(jobTitle.toLowerCase()))) {
                scrollToElement(card);
                List<WebElement> buttons = card.findElements(applyJobButton);
                if (!buttons.isEmpty()) {
                    try {
                        buttons.get(0).click();
                    } catch (Exception e) {
                        jsClick(buttons.get(0));
                    }
                } else {
                    try {
                        card.click();
                    } catch (Exception e) {
                        jsClick(card);
                    }
                }
                waitForVisibility(applyModal);
                pauseForDemo(1000);
                return;
            }
        }

        // Fallback nếu không khớp chính xác tên: click nút ứng tuyển đầu tiên
        click(applyJobButton);
        waitForVisibility(applyModal);
        pauseForDemo(1000);
    }

    /**
     * Chọn CV từ dropdown, nhập Cover Letter và click nút Xác nhận nộp hồ sơ.
     */
    public void applyWithCv(String cvName, String coverLetter) {
        if (!isDisplayed(applyModal)) {
            click(applyJobButton);
            waitForVisibility(applyModal);
        }

        WebElement selectElement = waitForVisibility(cvSelect);
        Select select = new Select(selectElement);
        try {
            select.selectByVisibleText(cvName);
        } catch (Exception e) {
            try {
                select.selectByValue(cvName);
            } catch (Exception ex) {
                select.selectByIndex(0);
            }
        }

        if (coverLetter != null) {
            sendKeys(coverLetterInput, coverLetter);
        }

        pauseForDemo(1000);
        click(confirmApplyButton);
        pauseForDemo(1000);
    }

    /**
     * Chọn CV từ dropdown (sử dụng Cover Letter mặc định) và click nút Xác nhận nộp hồ sơ.
     */
    public void applyWithCv(String cvName) {
        applyWithCv(
                cvName,
                "Kính gửi Nhà tuyển dụng, tôi xin gửi hồ sơ ứng tuyển vị trí này với kinh nghiệm thực chiến phù hợp."
        );
    }

    /**
     * Kiểm tra banner thông báo nộp hồ sơ thành công (#applySuccess) có hiển thị không.
     */
    public boolean isApplySuccessDisplayed() {
        return isDisplayed(applySuccessBanner);
    }

    /**
     * Lấy nội dung thông báo ứng tuyển thành công.
     */
    public String getSuccessMessageText() {
        if (isDisplayed(applySuccessBanner)) {
            return getText(applySuccessBanner);
        }
        return "";
    }

    /**
     * Kiểm tra cảnh báo chặn nộp hồ sơ trùng lặp (#applyError) có hiển thị không.
     */
    public boolean isDuplicateApplyErrorDisplayed() {
        return isDisplayed(applyErrorBanner);
    }

    /**
     * Lấy nội dung thông báo lỗi khi nộp trùng lặp vào cùng 1 công việc.
     */
    public String getDuplicateErrorMessage() {
        if (isDisplayed(applyErrorBanner)) {
            return getText(applyErrorBanner);
        }
        return "";
    }

    /**
     * Lấy trạng thái ứng tuyển trên thẻ công việc (.application-status).
     */
    public String getApplicationStatusText() {
        if (isDisplayed(applicationStatus)) {
            return getText(applicationStatus);
        }
        return "";
    }

    /**
     * Kiểm tra công việc chỉ định đã ở trạng thái "Đã ứng tuyển" hay chưa.
     */
    public boolean isJobAlreadyApplied(String jobTitle) {
        try {
            waitForVisibility(jobCards);
            List<WebElement> cards = driver.findElements(jobCards);
            for (WebElement card : cards) {
                String dataTitle = card.getAttribute("data-job-title");
                if (dataTitle != null && dataTitle.equalsIgnoreCase(jobTitle)) {
                    WebElement statusEl = card.findElement(applicationStatus);
                    return statusEl.getText().contains("Đã ứng tuyển");
                }
            }
        } catch (Exception ignored) {
        }
        return false;
    }

    private void pauseForDemo(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}

