package pages;

import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

/**
 * BasePage: Lớp cơ sở chứa các hàm dùng chung cho mọi Page Object
 * (click, sendKeys, scrollToElement, explicit wait).
 */
public class BasePage {

    protected WebDriver driver;
    protected WebDriverWait wait;

    public BasePage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(15));
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
    }

    /**
     * Click vào phần tử (kết hợp scroll và fallback JS click nếu bị quảng cáo che khuất).
     */
    public void click(By locator) {
        WebElement element = waitForPresence(locator);
        scrollToElement(element);
        try {
            waitForClickable(locator).click();
        } catch (ElementClickInterceptedException | TimeoutException e) {
            jsClick(element);
        }
    }

    /**
     * Click trực tiếp bằng JavaScript.
     */
    public void jsClick(By locator) {
        WebElement element = waitForPresence(locator);
        scrollToElement(element);
        jsClick(element);
    }

    public void jsClick(WebElement element) {
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", element);
    }

    /**
     * Nhập văn bản vào ô input sau khi chờ hiển thị và xóa dữ liệu cũ.
     */
    public void sendKeys(By locator, String text) {
        WebElement element = waitForVisibility(locator);
        scrollToElement(element);
        element.clear();
        element.sendKeys(text);
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

    /**
     * Ẩn các banner quảng cáo và footer cố định trên trang DemoQA để tránh che khuất nút Submit.
     */
    public void hideAdsAndFooter() {
        try {
            ((JavascriptExecutor) driver).executeScript(
                    "const ads = document.querySelectorAll('#fixedban, footer, iframe, [id^=\"google_ads\"]');" +
                    "ads.forEach(el => { if (el) el.style.display = 'none'; });"
            );
        } catch (Exception ignored) {
        }
    }
}

