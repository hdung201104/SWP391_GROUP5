package pages;

import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.Select;

/**
 * PracticeFormPage: Page Object cho trang https://demoqa.com/automation-practice-form
 * Định vị đầy đủ các phần tử của form đăng ký học sinh và các phương thức thao tác.
 */
public class PracticeFormPage extends BasePage {

    public static final String URL = "https://demoqa.com/automation-practice-form";

    // ==================== 1. LOCATORS FORM HỌC SINH ====================
    private final By userForm = By.id("userForm");
    private final By firstNameInput = By.id("firstName");
    private final By lastNameInput = By.id("lastName");
    private final By emailInput = By.id("userEmail");

    // Giới tính (Gender)
    private final By genderMaleRadio = By.id("gender-radio-1");
    private final By genderFemaleRadio = By.id("gender-radio-2");
    private final By genderOtherRadio = By.id("gender-radio-3");
    private final By genderMaleLabel = By.cssSelector("label[for='gender-radio-1']");
    private final By genderFemaleLabel = By.cssSelector("label[for='gender-radio-2']");
    private final By genderOtherLabel = By.cssSelector("label[for='gender-radio-3']");

    // Số điện thoại (Mobile - 10 Digits)
    private final By mobileInput = By.id("userNumber");

    // Ngày sinh (Date of Birth)
    private final By dateOfBirthInput = By.id("dateOfBirthInput");
    private final By monthSelect = By.cssSelector(".react-datepicker__month-select");
    private final By yearSelect = By.cssSelector(".react-datepicker__year-select");

    // Môn học (Subjects)
    private final By subjectsInput = By.id("subjectsInput");

    // Sở thích (Hobbies)
    private final By hobbySportsCheckbox = By.id("hobbies-checkbox-1");
    private final By hobbyReadingCheckbox = By.id("hobbies-checkbox-2");
    private final By hobbyMusicCheckbox = By.id("hobbies-checkbox-3");
    private final By hobbySportsLabel = By.cssSelector("label[for='hobbies-checkbox-1']");
    private final By hobbyReadingLabel = By.cssSelector("label[for='hobbies-checkbox-2']");
    private final By hobbyMusicLabel = By.cssSelector("label[for='hobbies-checkbox-3']");

    // Địa chỉ hiện tại (Current Address)
    private final By currentAddressInput = By.id("currentAddress");

    // Bang và Thành phố (State & City)
    private final By stateContainer = By.id("state");
    private final By stateInput = By.id("react-select-3-input");
    private final By cityContainer = By.id("city");
    private final By cityInput = By.id("react-select-4-input");

    // Nút Submit
    private final By submitButton = By.id("submit");

    // Modal xác nhận sau khi Submit thành công
    private final By confirmationModal = By.cssSelector(".modal-content");
    private final By modalTitle = By.id("example-modal-sizes-title-lg");
    private final By closeModalButton = By.id("closeLargeModal");

    public PracticeFormPage(WebDriver driver) {
        super(driver);
    }

    // ==================== 2. CÁC HÀM THAO TÁC TRÊN TRANG ====================

    /**
     * Mở trang Automation Practice Form và ẩn banner quảng cáo.
     */
    public void open() {
        driver.get(URL);
        waitForPresence(userForm);
        hideAdsAndFooter();
    }

    /**
     * Nhập Họ (First Name).
     */
    public void enterFirstName(String firstName) {
        sendKeys(firstNameInput, firstName);
    }

    /**
     * Nhập Tên (Last Name).
     */
    public void enterLastName(String lastName) {
        sendKeys(lastNameInput, lastName);
    }

    /**
     * Nhập Email.
     */
    public void enterEmail(String email) {
        sendKeys(emailInput, email);
    }

    /**
     * Chọn Giới tính ("Male", "Female", hoặc "Other").
     */
    public void selectGender(String gender) {
        hideAdsAndFooter();
        if ("Female".equalsIgnoreCase(gender)) {
            clickGenderOption(genderFemaleLabel, genderFemaleRadio);
        } else if ("Other".equalsIgnoreCase(gender)) {
            clickGenderOption(genderOtherLabel, genderOtherRadio);
        } else {
            clickGenderOption(genderMaleLabel, genderMaleRadio);
        }
    }

    private void clickGenderOption(By labelLocator, By radioLocator) {
        try {
            if (!driver.findElements(labelLocator).isEmpty()) {
                click(labelLocator);
            } else {
                jsClick(radioLocator);
            }
        } catch (Exception e) {
            jsClick(radioLocator);
        }
    }

    /**
     * Nhập Số điện thoại (10 chữ số).
     */
    public void enterMobile(String mobile) {
        sendKeys(mobileInput, mobile);
    }

    /**
     * Chọn Ngày sinh thông qua DatePicker (Ví dụ: day="15", month="May", year="2003").
     */
    public void selectDateOfBirth(String day, String month, String year) {
        hideAdsAndFooter();
        click(dateOfBirthInput);

        WebElement monthElem = waitForVisibility(monthSelect);
        new Select(monthElem).selectByVisibleText(month);

        WebElement yearElem = waitForVisibility(yearSelect);
        new Select(yearElem).selectByVisibleText(year);

        String formattedDay = String.format("%03d", Integer.parseInt(day));
        By dayLocator = By.cssSelector(
                ".react-datepicker__day--" + formattedDay + ":not(.react-datepicker__day--outside-month)"
        );
        click(dayLocator);
    }

    /**
     * Nhập Môn học (Subjects) và nhấn Enter để chọn từ danh sách gợi ý.
     */
    public void enterSubject(String subject) {
        hideAdsAndFooter();
        WebElement input = waitForPresence(subjectsInput);
        scrollToElement(input);
        input.sendKeys(subject);
        try {
            By autoCompleteOption = By.cssSelector(".subjects-auto-complete__option");
            waitForVisibility(autoCompleteOption).click();
        } catch (Exception e) {
            input.sendKeys(Keys.ENTER);
        }
    }

    /**
     * Chọn Sở thích ("Sports", "Reading", "Music").
     */
    public void selectHobby(String hobby) {
        hideAdsAndFooter();
        if ("Reading".equalsIgnoreCase(hobby)) {
            clickHobbyOption(hobbyReadingLabel, hobbyReadingCheckbox);
        } else if ("Music".equalsIgnoreCase(hobby)) {
            clickHobbyOption(hobbyMusicLabel, hobbyMusicCheckbox);
        } else {
            clickHobbyOption(hobbySportsLabel, hobbySportsCheckbox);
        }
    }

    private void clickHobbyOption(By labelLocator, By checkboxLocator) {
        try {
            if (!driver.findElements(labelLocator).isEmpty()) {
                click(labelLocator);
            } else {
                jsClick(checkboxLocator);
            }
        } catch (Exception e) {
            jsClick(checkboxLocator);
        }
    }

    /**
     * Nhập Địa chỉ hiện tại (Current Address).
     */
    public void enterCurrentAddress(String address) {
        sendKeys(currentAddressInput, address);
    }

    /**
     * Chọn Bang (State), ví dụ: "NCR".
     */
    public void selectState(String stateName) {
        hideAdsAndFooter();
        scrollToElement(stateContainer);
        WebElement input = waitForPresence(stateInput);
        input.sendKeys(stateName);
        input.sendKeys(Keys.ENTER);
    }

    /**
     * Chọn Thành phố (City), ví dụ: "Delhi".
     */
    public void selectCity(String cityName) {
        hideAdsAndFooter();
        scrollToElement(cityContainer);
        WebElement input = waitForPresence(cityInput);
        input.sendKeys(cityName);
        input.sendKeys(Keys.ENTER);
    }

    /**
     * Điền toàn bộ thông tin hợp lệ vào form học sinh.
     */
    public void fillStudentForm(
            String firstName,
            String lastName,
            String email,
            String gender,
            String mobile,
            String birthDay,
            String birthMonth,
            String birthYear,
            String subject,
            String hobby,
            String address,
            String state,
            String city
    ) {
        enterFirstName(firstName);
        enterLastName(lastName);
        enterEmail(email);
        selectGender(gender);
        enterMobile(mobile);
        selectDateOfBirth(birthDay, birthMonth, birthYear);
        enterSubject(subject);
        selectHobby(hobby);
        enterCurrentAddress(address);
        selectState(state);
        selectCity(city);
    }

    /**
     * Nhấn nút Submit.
     */
    public void clickSubmit() {
        hideAdsAndFooter();
        jsClick(submitButton);
    }

    /**
     * Kiểm tra Modal xác nhận đã xuất hiện sau khi Submit thành công.
     */
    public boolean isConfirmationModalDisplayed() {
        return isDisplayed(confirmationModal) && isDisplayed(modalTitle);
    }

    /**
     * Lấy tiêu đề của Modal xác nhận ("Thanks for submitting the form").
     */
    public String getConfirmationModalTitle() {
        return getText(modalTitle);
    }

    /**
     * Kiểm tra lỗi HTML5 Validation khi bỏ trống các trường bắt buộc (First Name, Last Name, Gender, Mobile).
     */
    public boolean isHtml5ValidationTriggered() {
        JavascriptExecutor js = (JavascriptExecutor) driver;
        WebElement firstName = waitForPresence(firstNameInput);
        WebElement lastName = waitForPresence(lastNameInput);
        WebElement mobile = waitForPresence(mobileInput);

        Boolean firstNameValid = (Boolean) js.executeScript("return arguments[0].checkValidity();", firstName);
        Boolean lastNameValid = (Boolean) js.executeScript("return arguments[0].checkValidity();", lastName);
        Boolean mobileValid = (Boolean) js.executeScript("return arguments[0].checkValidity();", mobile);
        String validationMsg = (String) js.executeScript("return arguments[0].validationMessage;", firstName);

        WebElement form = waitForPresence(userForm);
        String formClass = form.getAttribute("class");
        boolean hasWasValidatedClass = formClass != null && formClass.contains("was-validated");

        return Boolean.FALSE.equals(firstNameValid)
                && Boolean.FALSE.equals(lastNameValid)
                && Boolean.FALSE.equals(mobileValid)
                && (validationMsg != null && !validationMsg.isBlank() || hasWasValidatedClass);
    }

    /**
     * Đóng Modal xác nhận nếu đang hiển thị.
     */
    public void closeModalIfPresent() {
        try {
            if (isDisplayed(closeModalButton)) {
                jsClick(closeModalButton);
            }
        } catch (Exception ignored) {
        }
    }
}

