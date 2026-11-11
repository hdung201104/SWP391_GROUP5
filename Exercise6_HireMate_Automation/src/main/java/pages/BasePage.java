package pages;

import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

/**
 * BasePage: Lớp cơ sở (Parent Page Object) cho toàn bộ trang của HireMate AI Automation Testing.
 * Cung cấp:
 * 1. WebDriverWait tường minh (Explicit Wait) cho tính ổn định của test.
 * 2. Nhịp dừng demo mượt mà (DEMO_PAUSE_MS = 350ms): vừa đủ chậm để người xem và thầy cô
 *    quan sát rõ từng thao tác gõ chữ, click nút, chọn dropdown và modal hiển thị.
 * 3. Tự động cuộn trang (Smooth Scroll) tới phần tử cần tương tác.
 */
public abstract class BasePage {

    protected WebDriver driver;
    protected WebDriverWait wait;

    /**
     * Thời gian dừng mẫu (miligiây) giữa các thao tác để người quan sát theo dõi được tiến trình demo.
     * Mặc định 350ms: hiển thị mượt mà, gõ chữ rõ ràng, tổng bộ test 27 test cases chạy trong ~60 giây.
     */
    public static final int DEMO_PAUSE_MS = 350;

    public BasePage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    /**
     * Dừng luồng thực thi trong khoảng thời gian chỉ định (miligiây).
     */
    public void pause(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    public void pause() {
        pause(DEMO_PAUSE_MS);
    }

    /**
     * Explicit Wait chờ phần tử hiển thị trên giao diện.
     */
    public WebElement waitForVisibility(By locator) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    /**
     * Explicit Wait chờ phần tử có thể click được.
     */
    public WebElement waitForClickable(By locator) {
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    /**
     * Explicit Wait chờ phần tử xuất hiện trong DOM.
     */
    public WebElement waitForPresence(By locator) {
        return wait.until(ExpectedConditions.presenceOfElementLocated(locator));
    }

    /**
     * Cuộn trang tới phần tử chỉ định bằng JavascriptExecutor.
     */
    public void scrollToElement(By locator) {
        WebElement element = waitForPresence(locator);
        scrollToElement(element);
    }

    public void scrollToElement(WebElement element) {
        ((JavascriptExecutor) driver).executeScript(
                "arguments[0].scrollIntoView({behavior: 'instant', block: 'center', inline: 'nearest'});",
                element
        );
        pause(100);
    }

    /**
     * Click vào phần tử (có dừng nhẹ trước và sau khi click để người xem nhìn rõ).
     */
    public void click(By locator) {
        WebElement element = waitForPresence(locator);
        scrollToElement(element);
        pause(200); // Dừng nhẹ trước khi click để người xem định vị con trỏ
        try {
            waitForClickable(locator).click();
        } catch (ElementClickInterceptedException | TimeoutException e) {
            jsClick(element);
        }
        pause(350); // Dừng sau khi click để quan sát phản hồi của trang
    }

    public void jsClick(WebElement element) {
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", element);
    }

    /**
     * Nhập văn bản vào ô input (dừng nhẹ sau khi gõ để người xem thấy rõ chữ được điền).
     */
    public void sendKeys(By locator, String text) {
        WebElement element = waitForVisibility(locator);
        scrollToElement(element);
        element.clear();
        pause(150);
        if (text != null && !text.isEmpty()) {
            element.sendKeys(text);
        }
        pause(300); // Dừng nhẹ để người xem đọc được nội dung vừa điền
    }

    /**
     * Lấy nội dung text của phần tử.
     */
    public String getText(By locator) {
        return waitForVisibility(locator).getText().trim();
    }

    /**
     * Kiểm tra phần tử có đang hiển thị hay không.
     */
    public boolean isDisplayed(By locator) {
        try {
            return waitForVisibility(locator).isDisplayed();
        } catch (TimeoutException | NoSuchElementException | StaleElementReferenceException e) {
            return false;
        }
    }
}
