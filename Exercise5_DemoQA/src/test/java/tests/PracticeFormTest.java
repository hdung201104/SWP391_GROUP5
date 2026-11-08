package tests;

import org.junit.jupiter.api.*;
import pages.PracticeFormPage;

import static org.junit.jupiter.api.Assertions.*;

/**
 * PracticeFormTest: Kiểm thử tự động form đăng ký học sinh trên trang DemoQA.
 * - Test 1: Điền thông tin hợp lệ -> Click Submit -> Assert modal xác nhận xuất hiện.
 * - Test 2: Bỏ trống các trường bắt buộc -> Click Submit -> Assert form báo lỗi HTML5 validation.
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class PracticeFormTest extends BaseTest {

    private PracticeFormPage practiceFormPage;

    @BeforeEach
    public void initPage() {
        practiceFormPage = new PracticeFormPage(driver);
        practiceFormPage.open();
    }

    @Test
    @Order(1)
    @DisplayName("Test 1: Điền đầy đủ thông tin hợp lệ -> Click Submit -> Modal xác nhận xuất hiện")
    public void testSubmitFormWithValidData() {
        practiceFormPage.fillStudentForm(
                "Nguyen",
                "Van An",
                "nguyenvanan@example.com",
                "Male",
                "0912345678",
                "15",
                "May",
                "2003",
                "Maths",
                "Sports",
                "FPT University, Khu Cong Nghe Cao Hoa Lac, Ha Noi",
                "NCR",
                "Delhi"
        );

        practiceFormPage.clickSubmit();

        assertTrue(
                practiceFormPage.isConfirmationModalDisplayed(),
                "Modal xác nhận phải xuất hiện sau khi điền thông tin hợp lệ và nhấn Submit"
        );
        assertEquals(
                "Thanks for submitting the form",
                practiceFormPage.getConfirmationModalTitle(),
                "Tiêu đề modal xác nhận không khớp"
        );

        practiceFormPage.closeModalIfPresent();
    }

    @Test
    @Order(2)
    @DisplayName("Test 2: Bỏ trống các trường bắt buộc -> Click Submit -> Báo lỗi HTML5 Validation")
    public void testSubmitFormWithEmptyRequiredFields() {
        // Không điền bất kỳ trường bắt buộc nào, nhấn Submit ngay
        practiceFormPage.clickSubmit();

        assertTrue(
                practiceFormPage.isHtml5ValidationTriggered(),
                "Form phải kích hoạt báo lỗi HTML5 validation khi bỏ trống các trường bắt buộc"
        );
    }
}

