package utils;

import org.openqa.selenium.PageLoadStrategy;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.edge.EdgeOptions;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * DriverFactory: Khởi tạo và cấu hình WebDriver (Chrome/Edge, timeouts, maximize).
 */
public class DriverFactory {

    private static final int IMPLICIT_WAIT_SECONDS = 5;
    private static final int PAGE_LOAD_TIMEOUT_SECONDS = 45;
    private static final int SCRIPT_TIMEOUT_SECONDS = 30;

    /**
     * Khởi tạo WebDriver mặc định (ưu tiên lấy từ biến hệ thống -Dbrowser,
     * mặc định thử Chrome và tự động chuyển sang Edge nếu máy chưa cài Chrome).
     */
    public static WebDriver createDriver() {
        String browser = System.getProperty("browser", "auto").trim().toLowerCase();
        return createDriver(browser);
    }

    /**
     * Khởi tạo WebDriver theo loại trình duyệt chỉ định ("chrome", "edge", hoặc "auto").
     */
    public static WebDriver createDriver(String browserType) {
        boolean headless = Boolean.parseBoolean(System.getProperty("headless", "false"));
        WebDriver driver;

        String target = (browserType == null) ? "auto" : browserType.trim().toLowerCase();

        if ("edge".equals(target)) {
            driver = createEdgeDriver(headless);
        } else if ("chrome".equals(target)) {
            try {
                driver = createChromeDriver(headless);
            } catch (Exception e) {
                System.out.println("[DriverFactory] Chrome không khả dụng, tự động chuyển sang Microsoft Edge...");
                driver = createEdgeDriver(headless);
            }
        } else {
            try {
                driver = createChromeDriver(headless);
            } catch (Exception e) {
                System.out.println("[DriverFactory] Chrome không khả dụng, sử dụng Microsoft Edge WebDriver...");
                driver = createEdgeDriver(headless);
            }
        }

        configureDriver(driver);
        return driver;
    }

    private static WebDriver createChromeDriver(boolean headless) {
        ChromeOptions options = new ChromeOptions();
        options.setPageLoadStrategy(PageLoadStrategy.EAGER);

        Map<String, Object> prefs = new HashMap<>();
        prefs.put("credentials_enable_service", false);
        prefs.put("profile.password_manager_enabled", false);
        prefs.put("profile.password_manager_leak_detection", false);
        options.setExperimentalOption("prefs", prefs);

        options.addArguments("--incognito");
        options.addArguments("--disable-notifications");
        options.addArguments("--disable-popup-blocking");
        options.addArguments("--disable-save-password-bubble");
        options.addArguments("--disable-features=PasswordLeakDetection");
        options.addArguments("--remote-allow-origins=*");
        options.addArguments("--window-size=1920,1080");
        if (headless) {
            options.addArguments("--headless=new");
        }
        return new ChromeDriver(options);
    }

    private static WebDriver createEdgeDriver(boolean headless) {
        EdgeOptions options = new EdgeOptions();
        options.setPageLoadStrategy(PageLoadStrategy.EAGER);

        Map<String, Object> prefs = new HashMap<>();
        prefs.put("credentials_enable_service", false);
        prefs.put("profile.password_manager_enabled", false);
        prefs.put("profile.password_manager_leak_detection", false);
        options.setExperimentalOption("prefs", prefs);

        options.addArguments("--inprivate");
        options.addArguments("--disable-notifications");
        options.addArguments("--disable-popup-blocking");
        options.addArguments("--disable-save-password-bubble");
        options.addArguments("--disable-features=PasswordLeakDetection");
        options.addArguments("--remote-allow-origins=*");
        options.addArguments("--window-size=1920,1080");
        if (headless) {
            options.addArguments("--headless=new");
        }
        return new EdgeDriver(options);
    }

    private static void configureDriver(WebDriver driver) {
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(IMPLICIT_WAIT_SECONDS));
        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(PAGE_LOAD_TIMEOUT_SECONDS));
        driver.manage().timeouts().scriptTimeout(Duration.ofSeconds(SCRIPT_TIMEOUT_SECONDS));
        try {
            driver.manage().window().maximize();
        } catch (Exception ignored) {
        }
    }
}
