package tests;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.openqa.selenium.WebDriver;
import utils.DriverFactory;
import utils.TestReportManager;

/**
 * BaseTest: Quản lý vòng đời khởi tạo và đóng trình duyệt (@BeforeAll, @AfterAll)
 * và tự động xuất Báo cáo Kết quả Kiểm thử (HTML & CSV) khi hoàn tất.
 */
public class BaseTest {

    protected static WebDriver driver;

    @BeforeAll
    public static void setUpClass() {
        driver = DriverFactory.createDriver();
    }

    @AfterAll
    public static void tearDownClass() {
        try {
            TestReportManager.exportReports();
        } catch (Exception ignored) {
        }
        if (driver != null) {
            driver.quit();
        }
    }
}
