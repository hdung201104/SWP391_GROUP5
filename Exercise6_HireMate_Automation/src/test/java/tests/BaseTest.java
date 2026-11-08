package tests;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.openqa.selenium.WebDriver;
import utils.DriverFactory;

/**
 * BaseTest: Quản lý vòng đời khởi tạo và đóng trình duyệt (@BeforeAll, @AfterAll)
 * cho các bài kiểm thử tự động trên website HireMate AI.
 */
public class BaseTest {

    protected static WebDriver driver;

    @BeforeAll
    public static void setUpClass() {
        driver = DriverFactory.createDriver();
    }

    @AfterAll
    public static void tearDownClass() {
        if (driver != null) {
            driver.quit();
        }
    }
}

