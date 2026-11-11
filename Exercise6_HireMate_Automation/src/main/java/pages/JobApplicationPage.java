package pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.Select;
import utils.DriverFactory;

import java.util.List;

/**
 * JobApplicationPage: Page Object cho tính năng Việc làm & Ứng tuyển HireMate AI (http://localhost:5173/#/jobs).
 * Định vị các phần tử: danh sách thẻ việc làm (.job-card), nút ứng tuyển (.btn-apply-job),
 * popup modal nộp CV (#applyModal), dropdown chọn CV, textarea cover letter,
 * nút đóng modal (#btnCloseModal), banner thành công (#applySuccess) và cảnh báo trùng lặp (#applyError).
 */
public class JobApplicationPage extends BasePage {

    public static final String JOBS_URL = DriverFactory.BASE_URL + "/#/jobs";

    // ==================== 1. LOCATORS ====================
    private final By jobCards = By.cssSelector(".job-card");
    private final By applyJobButton = By.cssSelector(".btn-apply-job");
    private final By applyModal = By.id("applyModal");
    private final By cvSelect = By.id("cvSelect");
    private final By coverLetterInput = By.id("coverLetter");
    private final By confirmApplyButton = By.id("btnConfirmApply");
    private final By closeModalButton = By.cssSelector("#btnCloseModal, .btn-secondary");
    private final By applySuccessBanner = By.id("applySuccess");
    private final By applyErrorBanner = By.id("applyError");
    private final By applicationStatus = By.cssSelector(".application-status");

    public JobApplicationPage(WebDriver driver) {
        super(driver);
    }

    // ==================== 2. CÁC HÀM THAO TÁC ====================

    /**
     * Mở trực tiếp trang Danh sách Việc làm HireMate AI.
     */
    public void openJobList() {
        driver.get(DriverFactory.BASE_URL + "/?t=" + System.nanoTime() + "#/jobs");
        waitForVisibility(jobCards);
        pause(300);
    }

    /**
     * Xóa danh sách các job đã ứng tuyển trong localStorage để reset trạng thái sạch sẽ trước khi test.
     */
    public void resetAppliedJobsState() {
        ((org.openqa.selenium.JavascriptExecutor) driver).executeScript(
                "localStorage.removeItem('appliedJobs');"
        );
        pause(200);
    }

    /**
     * Tìm và click vào công việc theo tiêu đề (jobTitle) để mở Modal ứng tuyển.
     */
    public void selectJob(String jobTitle) {
        waitForVisibility(jobCards);
        List<WebElement> cards = driver.findElements(jobCards);
        boolean found = false;

        for (WebElement card : cards) {
            String title = card.getAttribute("data-job-title");
            if (title != null && title.equalsIgnoreCase(jobTitle)) {
                scrollToElement(card);
                pause(200);
                WebElement applyBtn = card.findElement(applyJobButton);
                try {
                    applyBtn.click();
                } catch (Exception e) {
                    jsClick(applyBtn);
                }
                found = true;
                break;
            }
        }

        if (!found && !cards.isEmpty()) {
            WebElement firstCard = cards.get(0);
            scrollToElement(firstCard);
            WebElement applyBtn = firstCard.findElement(applyJobButton);
            try {
                applyBtn.click();
            } catch (Exception e) {
                jsClick(applyBtn);
            }
        }

        waitForVisibility(applyModal);
        pause(300);
    }

    /**
     * Mở Modal ứng tuyển của công việc đầu tiên trên danh sách.
     */
    public void openApplyModal() {
        waitForVisibility(applyJobButton);
        click(applyJobButton);
        waitForVisibility(applyModal);
        pause(300);
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

        pause(300);
        click(confirmApplyButton);
        pause(400);
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
     * Đóng modal ứng tuyển bằng nút Đóng / Hủy bỏ.
     */
    public void closeModal() {
        waitForVisibility(closeModalButton);
        click(closeModalButton);
        pause(300);
    }

    /**
     * Kiểm tra Modal ứng tuyển có đang hiển thị hay không.
     */
    public boolean isModalDisplayed() {
        try {
            WebElement modal = driver.findElement(applyModal);
            String classAttr = modal.getAttribute("class");
            return classAttr == null || !classAttr.contains("hidden");
        } catch (Exception e) {
            return false;
        }
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
}
