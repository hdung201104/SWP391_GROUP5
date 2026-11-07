package com.hiremate.testng;

import com.hiremate.config.JwtUtil;
import com.hiremate.dto.request.LoginRequest;
import com.hiremate.dto.request.RegisterRequest;
import com.hiremate.dto.response.AuthResponse;
import com.hiremate.entity.Candidate;
import com.hiremate.entity.Company;
import com.hiremate.entity.Recruiter;
import com.hiremate.entity.User;
import com.hiremate.enums.CompanyStatus;
import com.hiremate.enums.UserRole;
import com.hiremate.enums.UserStatus;
import com.hiremate.exception.BadRequestException;
import com.hiremate.repository.CandidateRepository;
import com.hiremate.repository.CompanyRepository;
import com.hiremate.repository.RecruiterRepository;
import com.hiremate.repository.UserRepository;
import com.hiremate.service.EmailService;
import com.hiremate.service.GoogleTokenVerifierService;
import com.hiremate.service.NotificationService;
import com.hiremate.service.OtpService;
import com.hiremate.service.TokenBlacklistService;
import com.hiremate.service.impl.AuthServiceImpl;
import com.hiremate.testng.TestDataLoader;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.time.LocalDate;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * ==============================================================================
 * HIREMATE AI - AUTHENTICATION UNIT TESTS (54 CASES SUITE: FEATURE 1)
 * Workbook: HireMate_AUTH_UnitTest_Template_6Cases.xlsx
 * Exactly 6 test cases per function across 3 functions = 18 cases
 * Framework: TestNG 7.9.0 + Mockito (Isolated, no production DB)
 * ==============================================================================
 */
public class AuthServiceDesignTestNGTest {

    private UserRepository userRepository;
    private CandidateRepository candidateRepository;
    private RecruiterRepository recruiterRepository;
    private CompanyRepository companyRepository;
    private PasswordEncoder passwordEncoder;
    private JwtUtil jwtUtil;
    private OtpService otpService;
    private EmailService emailService;
    private NotificationService notificationService;
    private GoogleTokenVerifierService googleTokenVerifierService;
    private TokenBlacklistService tokenBlacklistService;

    private AuthServiceImpl authService;

    private User sampleCandidateUser;

    @BeforeMethod
    public void setUp() {
        userRepository = mock(UserRepository.class);
        candidateRepository = mock(CandidateRepository.class);
        recruiterRepository = mock(RecruiterRepository.class);
        companyRepository = mock(CompanyRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        jwtUtil = mock(JwtUtil.class);
        otpService = mock(OtpService.class);
        emailService = mock(EmailService.class);
        notificationService = mock(NotificationService.class);
        googleTokenVerifierService = mock(GoogleTokenVerifierService.class);
        tokenBlacklistService = mock(TokenBlacklistService.class);

        authService = new AuthServiceImpl(
                userRepository,
                candidateRepository,
                recruiterRepository,
                companyRepository,
                passwordEncoder,
                jwtUtil,
                otpService,
                emailService,
                notificationService,
                googleTokenVerifierService,
                tokenBlacklistService
        );

        sampleCandidateUser = User.builder()
                .userId(101L)
                .email("candidate@hiremate.ai")
                .passwordHash("$2a$10$encodedBcryptPasswordHashForTesting12345")
                .fullName("Nguyen Van A")
                .role(UserRole.CANDIDATE)
                .status(UserStatus.ACTIVE)
                .isEmailVerified(true)
                .build();
    }

    // ==========================================================================
    // FUNCTION 1: register(RegisterRequest) — 6 TEST CASES (AUTH-R01 to AUTH-R14)
    // ==========================================================================

    @Test(description = "AUTH-R01 / UTCID01: Candidate đăng ký hợp lệ với OTP đúng")
    public void test_AUTH_R01_UTCID01_registerCandidate_Success() {
        var data = TestDataLoader.loadJsonNode("testdata/auth-testdata.json").path("register").path("AUTH_R01");
        RegisterRequest request = new RegisterRequest();
        request.setEmail(data.path("email").asText());
        request.setPassword(data.path("password").asText());
        request.setFullName(data.path("fullName").asText());
        request.setRole(UserRole.valueOf(data.path("role").asText("CANDIDATE")));
        request.setOtp(data.path("otp").asText());

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(otpService.verifyOtp(request.getEmail(), request.getOtp(), "REGISTER")).thenReturn(true);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("bcrypt_hashed_pass");
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setUserId(201L);
            return u;
        });
        when(jwtUtil.generateToken(anyString(), any())).thenReturn("mock_token_candidate");
        when(jwtUtil.generateRefreshToken(anyString(), any())).thenReturn("mock_refresh_token");

        AuthResponse response = authService.register(request);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getEmail(), request.getEmail());
        Assert.assertEquals(response.getRole(), UserRole.CANDIDATE);
        Assert.assertEquals(response.getToken(), "mock_token_candidate");
        verify(candidateRepository, times(1)).save(any(Candidate.class));
    }

    @Test(
        description = "AUTH-R03 / UTCID02: Đăng ký thất bại do email đã tồn tại trong hệ thống",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Email already exists.*"
    )
    public void test_AUTH_R03_UTCID02_register_DuplicateEmail_ThrowsException() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("existing@hiremate.ai");
        request.setPassword("ValidPassword123@");
        request.setOtp("123456");

        when(userRepository.existsByEmail("existing@hiremate.ai")).thenReturn(true);

        authService.register(request);
    }

    @Test(
        description = "AUTH-R04 / UTCID03: Đăng ký thất bại do không cung cấp mã OTP",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Mã xác thực OTP là bắt buộc.*"
    )
    public void test_AUTH_R04_UTCID03_register_MissingOtp_ThrowsException() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("newuser@hiremate.ai");
        request.setPassword("ValidPassword123@");
        request.setOtp(null);

        when(userRepository.existsByEmail("newuser@hiremate.ai")).thenReturn(false);

        authService.register(request);
    }

    @Test(
        description = "AUTH-R06 / UTCID04: Đăng ký thất bại do mã OTP không hợp lệ",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Mã xác thực OTP không chính xác hoặc đã hết hiệu lực.*"
    )
    public void test_AUTH_R06_UTCID04_register_InvalidOtp_ThrowsException() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("newuser@hiremate.ai");
        request.setPassword("ValidPassword123@");
        request.setOtp("999999");

        when(userRepository.existsByEmail("newuser@hiremate.ai")).thenReturn(false);
        when(otpService.verifyOtp("newuser@hiremate.ai", "999999", "REGISTER")).thenReturn(false);

        authService.register(request);
    }

    @Test(
        description = "AUTH-R13 / UTCID05: Biên dưới 14 tuổi (today - 14 years + 1 day) bị từ chối",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Độ tuổi ứng viên phải từ 14 tuổi trở lên.*"
    )
    public void test_AUTH_R13_UTCID05_register_Under14YearsOld_ThrowsException() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("young.candidate@hiremate.ai");
        request.setPassword("ValidPassword123@");
        request.setFullName("Young Candidate");
        request.setRole(UserRole.CANDIDATE);
        request.setOtp("123456");
        request.setDateOfBirth(LocalDate.now().minusYears(14).plusDays(1).toString());

        when(userRepository.existsByEmail("young.candidate@hiremate.ai")).thenReturn(false);
        when(otpService.verifyOtp("young.candidate@hiremate.ai", "123456", "REGISTER")).thenReturn(true);

        authService.register(request);
    }

    @Test(description = "AUTH-R14 / UTCID06: Đúng 14 tuổi (today - 14 years) vượt qua kiểm tra tuổi và đăng ký thành công")
    public void test_AUTH_R14_UTCID06_register_Exact14YearsOld_Success() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("exact14@hiremate.ai");
        request.setPassword("ValidPassword123@");
        request.setFullName("Exact 14 Candidate");
        request.setRole(UserRole.CANDIDATE);
        request.setOtp("123456");
        request.setDateOfBirth(LocalDate.now().minusYears(14).toString());

        when(userRepository.existsByEmail("exact14@hiremate.ai")).thenReturn(false);
        when(otpService.verifyOtp("exact14@hiremate.ai", "123456", "REGISTER")).thenReturn(true);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_pass");
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setUserId(202L);
            return u;
        });
        when(jwtUtil.generateToken(anyString(), any())).thenReturn("mock_token_14");
        when(jwtUtil.generateRefreshToken(anyString(), any())).thenReturn("mock_refresh_14");

        AuthResponse response = authService.register(request);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getEmail(), "exact14@hiremate.ai");
        verify(candidateRepository, times(1)).save(any(Candidate.class));
    }

    // ==========================================================================
    // FUNCTION 2: login(LoginRequest) — 6 TEST CASES (AUTH-L01 to AUTH-L07)
    // ==========================================================================

    @Test(description = "AUTH-L01 / UTCID01: Đăng nhập thành công với email và mật khẩu chính xác")
    public void test_AUTH_L01_UTCID01_login_ValidCredentials_Success() {
        var data = TestDataLoader.loadJsonNode("testdata/auth-testdata.json").path("login").path("AUTH_L01");
        LoginRequest request = new LoginRequest(data.path("email").asText(), data.path("password").asText());

        when(userRepository.findByEmail("candidate@hiremate.ai")).thenReturn(Optional.of(sampleCandidateUser));
        when(passwordEncoder.matches("CorrectPassword123@", sampleCandidateUser.getPasswordHash())).thenReturn(true);
        when(jwtUtil.generateToken(eq(sampleCandidateUser.getEmail()), any())).thenReturn("valid_jwt_token");
        when(jwtUtil.generateRefreshToken(eq(sampleCandidateUser.getEmail()), any())).thenReturn("valid_refresh_token");

        AuthResponse response = authService.login(request);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getToken(), "valid_jwt_token");
        Assert.assertEquals(response.getUserId(), Long.valueOf(101L));
        Assert.assertEquals(response.getEmail(), "candidate@hiremate.ai");
    }

    @Test(
        description = "AUTH-L02 / UTCID02: Đăng nhập thất bại do email là null",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Vui lòng nhập đầy đủ email và mật khẩu.*"
    )
    public void test_AUTH_L02_UTCID02_login_NullEmail_ThrowsException() {
        LoginRequest request = new LoginRequest(null, "ValidPass123@");
        authService.login(request);
    }

    @Test(
        description = "AUTH-L04 / UTCID03: Đăng nhập thất bại do email không tồn tại",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Tài khoản hoặc mật khẩu không chính xác.*"
    )
    public void test_AUTH_L04_UTCID03_login_EmailNotFound_ThrowsException() {
        LoginRequest request = new LoginRequest("unknown@hiremate.ai", "AnyPassword123@");
        when(userRepository.findByEmail("unknown@hiremate.ai")).thenReturn(Optional.empty());

        authService.login(request);
    }

    @Test(
        description = "AUTH-L05 / UTCID04: Đăng nhập thất bại do nhập sai mật khẩu",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Tài khoản hoặc mật khẩu không chính xác.*"
    )
    public void test_AUTH_L05_UTCID04_login_WrongPassword_ThrowsException() {
        LoginRequest request = new LoginRequest("candidate@hiremate.ai", "WrongPassword999#");

        when(userRepository.findByEmail("candidate@hiremate.ai")).thenReturn(Optional.of(sampleCandidateUser));
        when(passwordEncoder.matches("WrongPassword999#", sampleCandidateUser.getPasswordHash())).thenReturn(false);

        authService.login(request);
    }

    @Test(
        description = "AUTH-L06 / UTCID05: Đăng nhập thất bại do tài khoản người dùng bị khóa (BLOCKED)",
        expectedExceptions = IllegalStateException.class,
        expectedExceptionsMessageRegExp = ".*Tài khoản hiện đang bị khóa.*"
    )
    public void test_AUTH_L06_UTCID05_login_BlockedUser_ThrowsException() {
        User blockedUser = User.builder()
                .userId(102L)
                .email("blocked@hiremate.ai")
                .passwordHash("$2a$10$encodedHashBlocked")
                .role(UserRole.CANDIDATE)
                .status(UserStatus.BLOCKED)
                .build();

        LoginRequest request = new LoginRequest("blocked@hiremate.ai", "CorrectPassword123@");

        when(userRepository.findByEmail("blocked@hiremate.ai")).thenReturn(Optional.of(blockedUser));
        when(passwordEncoder.matches("CorrectPassword123@", blockedUser.getPasswordHash())).thenReturn(true);

        authService.login(request);
    }

    @Test(description = "AUTH-L07 / UTCID06: Đăng nhập thành công khi email viết hoa và có khoảng trắng (Email normalization)")
    public void test_AUTH_L07_UTCID06_login_NormalizedEmail_Success() {
        var data = TestDataLoader.loadJsonNode("testdata/auth-testdata.json").path("login").path("AUTH_L07");
        LoginRequest request = new LoginRequest(data.path("email").asText(), data.path("password").asText());

        when(userRepository.findByEmail("candidate@hiremate.ai")).thenReturn(Optional.of(sampleCandidateUser));
        when(passwordEncoder.matches("CorrectPassword123@", sampleCandidateUser.getPasswordHash())).thenReturn(true);
        when(jwtUtil.generateToken(eq(sampleCandidateUser.getEmail()), any())).thenReturn("token_normalized");
        when(jwtUtil.generateRefreshToken(eq(sampleCandidateUser.getEmail()), any())).thenReturn("refresh_normalized");

        AuthResponse response = authService.login(request);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getToken(), "token_normalized");
        verify(userRepository, times(1)).findByEmail("candidate@hiremate.ai");
    }

    // ==========================================================================
    // FUNCTION 3: getCurrentUser(User) — 6 TEST CASES (AUTH-M01 to AUTH-M06)
    // ==========================================================================

    @Test(description = "AUTH-M01 / UTCID01: Candidate lấy thông tin cá nhân, companyId trả về null")
    public void test_AUTH_M01_UTCID01_getCurrentUser_Candidate_Success() {
        User candidateUser = User.builder()
                .userId(101L)
                .email("candidate@hiremate.ai")
                .fullName("Nguyen Candidate")
                .role(UserRole.CANDIDATE)
                .build();

        AuthResponse response = authService.getCurrentUser(candidateUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getUserId(), Long.valueOf(101L));
        Assert.assertEquals(response.getRole(), UserRole.CANDIDATE);
        Assert.assertNull(response.getCompanyId());
    }

    @Test(description = "AUTH-M02 / UTCID02: Admin lấy thông tin cá nhân, không tìm kiếm company")
    public void test_AUTH_M02_UTCID02_getCurrentUser_Admin_Success() {
        User adminUser = User.builder()
                .userId(1L)
                .email("admin@hiremate.ai")
                .fullName("System Admin")
                .role(UserRole.ADMIN)
                .build();

        AuthResponse response = authService.getCurrentUser(adminUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getUserId(), Long.valueOf(1L));
        Assert.assertEquals(response.getRole(), UserRole.ADMIN);
        Assert.assertNull(response.getCompanyId());
        verify(companyRepository, never()).findByRecruiterId(any());
    }

    @Test(description = "AUTH-M03 / UTCID03: Recruiter có thông tin Company trực tiếp trong quan hệ thực thể")
    public void test_AUTH_M03_UTCID03_getCurrentUser_Recruiter_DirectCompany_Success() {
        User recruiterUser = User.builder()
                .userId(301L)
                .email("recruiter@fpt.com")
                .role(UserRole.RECRUITER)
                .build();

        Company company = Company.builder()
                .companyId(501L)
                .companyName("FPT Software")
                .build();

        Recruiter recruiter = Recruiter.builder()
                .recruiterId(301L)
                .company(company)
                .build();

        when(recruiterRepository.findById(301L)).thenReturn(Optional.of(recruiter));

        AuthResponse response = authService.getCurrentUser(recruiterUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getCompanyId(), Long.valueOf(501L));
        Assert.assertEquals(response.getCompanyName(), "FPT Software");
    }

    @Test(description = "AUTH-M04 / UTCID04: Recruiter có entity company=null, tự động fallback qua companyRepository")
    public void test_AUTH_M04_UTCID04_getCurrentUser_Recruiter_FallbackCompanyRepo_Success() {
        User recruiterUser = User.builder()
                .userId(302L)
                .email("recruiter2@vng.com")
                .role(UserRole.RECRUITER)
                .build();

        Recruiter recruiter = Recruiter.builder()
                .recruiterId(302L)
                .company(null)
                .build();

        Company fallbackCompany = Company.builder()
                .companyId(601L)
                .companyName("VNG Corporation")
                .build();

        when(recruiterRepository.findById(302L)).thenReturn(Optional.of(recruiter));
        when(companyRepository.findByRecruiterId(302L)).thenReturn(Optional.of(fallbackCompany));

        AuthResponse response = authService.getCurrentUser(recruiterUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getCompanyId(), Long.valueOf(601L));
        Assert.assertEquals(response.getCompanyName(), "VNG Corporation");
    }

    @Test(description = "AUTH-M05 / UTCID05: Recruiter chưa liên kết công ty nào, companyId trả về null")
    public void test_AUTH_M05_UTCID05_getCurrentUser_Recruiter_NoCompany_Success() {
        User recruiterUser = User.builder()
                .userId(303L)
                .email("freelance.recruiter@hiremate.ai")
                .role(UserRole.RECRUITER)
                .build();

        when(recruiterRepository.findById(303L)).thenReturn(Optional.empty());
        when(companyRepository.findByRecruiterId(303L)).thenReturn(Optional.empty());

        AuthResponse response = authService.getCurrentUser(recruiterUser);

        Assert.assertNotNull(response);
        Assert.assertNull(response.getCompanyId());
        Assert.assertNull(response.getCompanyName());
    }

    @Test(description = "AUTH-M06 / UTCID06: Recruiter truy cập lazy Company ném runtime exception, fallback an toàn")
    public void test_AUTH_M06_UTCID06_getCurrentUser_Recruiter_LazyCompanyThrows_Fallback_Success() {
        User recruiterUser = User.builder()
                .userId(304L)
                .email("lazy.recruiter@hiremate.ai")
                .role(UserRole.RECRUITER)
                .build();

        Recruiter mockRecruiter = mock(Recruiter.class);
        when(mockRecruiter.getCompany()).thenThrow(new RuntimeException("Lazy loading failed without Hibernate session"));

        Company fallbackCompany = Company.builder()
                .companyId(701L)
                .companyName("Viettel Group")
                .build();

        when(recruiterRepository.findById(304L)).thenReturn(Optional.of(mockRecruiter));
        when(companyRepository.findByRecruiterId(304L)).thenReturn(Optional.of(fallbackCompany));

        AuthResponse response = authService.getCurrentUser(recruiterUser);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getCompanyId(), Long.valueOf(701L));
        Assert.assertEquals(response.getCompanyName(), "Viettel Group");
    }

    // ==========================================================================
    // EXTENDED TESTS (KNOWN GAPS COVERAGE): register & login
    // ==========================================================================

    @Test(
        description = "AUTH-EXT-01: Từ chối đăng ký tài khoản với vai trò ADMIN qua cổng công khai",
        expectedExceptions = BadRequestException.class,
        expectedExceptionsMessageRegExp = ".*Không thể đăng ký tài khoản với vai trò Quản trị viên.*"
    )
    public void test_AUTH_EXT01_register_AdminRole_ThrowsBadRequestException() {
        var data = TestDataLoader.loadJsonNode("testdata/auth-testdata.json").path("extended").path("AUTH_EXT01");
        RegisterRequest request = new RegisterRequest();
        request.setEmail(data.path("email").asText("admin.attempt@hiremate.ai"));
        request.setPassword(data.path("password").asText("Password123@"));
        request.setOtp(data.path("otp").asText("123456"));
        request.setRole(UserRole.valueOf(data.path("role").asText("ADMIN")));

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(otpService.verifyOtp(eq(request.getEmail()), eq(request.getOtp()), eq("REGISTER"))).thenReturn(true);

        authService.register(request);
    }

    @Test(
        description = "AUTH-EXT-02: Từ chối đăng ký do định dạng số điện thoại di động Việt Nam không hợp lệ",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Số điện thoại không đúng định dạng.*"
    )
    public void test_AUTH_EXT02_register_InvalidPhoneFormat_ThrowsException() {
        var data = TestDataLoader.loadJsonNode("testdata/auth-testdata.json").path("extended").path("AUTH_EXT02");
        RegisterRequest request = new RegisterRequest();
        request.setEmail(data.path("email").asText("valid.phone@hiremate.ai"));
        request.setPassword(data.path("password").asText("Password123@"));
        request.setOtp(data.path("otp").asText("123456"));
        request.setPhone(data.path("phone").asText("012345")); // Sai định dạng (ít hơn 10 chữ số)

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(otpService.verifyOtp(eq(request.getEmail()), eq(request.getOtp()), eq("REGISTER"))).thenReturn(true);

        authService.register(request);
    }

    @Test(
        description = "AUTH-EXT-03: Từ chối đăng ký do ngày sinh ở tương lai",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Ngày sinh không thể ở tương lai.*"
    )
    public void test_AUTH_EXT03_register_FutureDateOfBirth_ThrowsException() {
        var data = TestDataLoader.loadJsonNode("testdata/auth-testdata.json").path("extended").path("AUTH_EXT03");
        RegisterRequest request = new RegisterRequest();
        request.setEmail(data.path("email").asText("future.dob@hiremate.ai"));
        request.setPassword(data.path("password").asText("Password123@"));
        request.setOtp(data.path("otp").asText("123456"));
        request.setDateOfBirth(LocalDate.now().plusDays(data.path("daysOffset").asInt(2)).toString());

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(otpService.verifyOtp(eq(request.getEmail()), eq(request.getOtp()), eq("REGISTER"))).thenReturn(true);

        authService.register(request);
    }

    @Test(
        description = "AUTH-EXT-04: Từ chối đăng ký do ngày sinh trước năm 1920",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Ngày sinh không hợp lệ.*"
    )
    public void test_AUTH_EXT04_register_DateOfBirthBefore1920_ThrowsException() {
        var data = TestDataLoader.loadJsonNode("testdata/auth-testdata.json").path("extended").path("AUTH_EXT04");
        RegisterRequest request = new RegisterRequest();
        request.setEmail(data.path("email").asText("ancient.dob@hiremate.ai"));
        request.setPassword(data.path("password").asText("Password123@"));
        request.setOtp(data.path("otp").asText("123456"));
        request.setDateOfBirth(data.path("dateOfBirth").asText("1910-05-12"));

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(otpService.verifyOtp(eq(request.getEmail()), eq(request.getOtp()), eq("REGISTER"))).thenReturn(true);

        authService.register(request);
    }

    @Test(
        description = "AUTH-EXT-05: Từ chối đăng ký do định dạng email không đúng chuẩn regex",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Địa chỉ email không đúng định dạng.*"
    )
    public void test_AUTH_EXT05_register_MalformedEmailRegex_ThrowsException() {
        var data = TestDataLoader.loadJsonNode("testdata/auth-testdata.json").path("extended").path("AUTH_EXT05");
        RegisterRequest request = new RegisterRequest();
        request.setEmail(data.path("email").asText("not-an-email"));
        request.setPassword(data.path("password").asText("Password123@"));
        request.setOtp(data.path("otp").asText("123456"));

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(otpService.verifyOtp(eq(request.getEmail()), eq(request.getOtp()), eq("REGISTER"))).thenReturn(true);

        authService.register(request);
    }

    @Test(description = "AUTH-EXT-06: Recruiter đăng ký và tạo doanh nghiệp mới thành công (Head Recruiter)")
    public void test_AUTH_EXT06_register_RecruiterNewCompany_Success() {
        var data = TestDataLoader.loadJsonNode("testdata/auth-testdata.json").path("extended").path("AUTH_EXT06");
        RegisterRequest request = new RegisterRequest();
        request.setEmail(data.path("email").asText("hr.director@newcorp.vn"));
        request.setPassword(data.path("password").asText("Password123@"));
        request.setFullName(data.path("fullName").asText("Nguyen Van HR"));
        request.setRole(UserRole.valueOf(data.path("role").asText("RECRUITER")));
        request.setOtp(data.path("otp").asText("123456"));
        request.setCompanyName(data.path("companyName").asText("New Tech Corporation"));
        request.setTaxCode(data.path("taxCode").asText("0109988776"));
        request.setCompanySize(data.path("companySize").asText("100-500 nhân viên"));
        request.setWebsite(data.path("website").asText("https://newcorp.vn"));
        request.setPosition(data.path("position").asText("Giám đốc Nhân sự"));

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(otpService.verifyOtp(anyString(), anyString(), anyString())).thenReturn(true);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_recruiter_pass");
        when(companyRepository.findFirstByTaxCodeIgnoreCase(request.getTaxCode())).thenReturn(Optional.empty());
        when(companyRepository.findFirstByCompanyNameIgnoreCase(request.getCompanyName())).thenReturn(Optional.empty());

        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setUserId(301L);
            return u;
        });

        when(companyRepository.saveAndFlush(any(Company.class))).thenAnswer(inv -> {
            Company c = inv.getArgument(0);
            c.setCompanyId(701L);
            return c;
        });

        when(recruiterRepository.saveAndFlush(any(Recruiter.class))).thenAnswer(inv -> {
            Recruiter r = inv.getArgument(0);
            r.setRecruiterId(301L);
            return r;
        });

        when(jwtUtil.generateToken(anyString(), any())).thenReturn("token_recruiter_new");
        when(jwtUtil.generateRefreshToken(anyString(), any())).thenReturn("refresh_recruiter_new");

        AuthResponse response = authService.register(request);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getRole(), UserRole.RECRUITER);
        Assert.assertEquals(response.getCompanyId(), Long.valueOf(701L));
        Assert.assertEquals(response.getCompanyName(), "New Tech Corporation");
        verify(companyRepository, atLeastOnce()).save(any(Company.class));
        verify(recruiterRepository, times(1)).saveAndFlush(any(Recruiter.class));
    }

    @Test(
        description = "AUTH-EXT-07: Recruiter gia nhập công ty có sẵn nhưng nhập sai mã HR PIN -> ném BadRequestException",
        expectedExceptions = BadRequestException.class,
        expectedExceptionsMessageRegExp = ".*Mã số xác nhận gia nhập HR.*không chính xác.*"
    )
    public void test_AUTH_EXT07_register_RecruiterJoinExistingCompany_WrongPin_ThrowsBadRequestException() {
        var data = TestDataLoader.loadJsonNode("testdata/auth-testdata.json").path("extended").path("AUTH_EXT07");
        RegisterRequest request = new RegisterRequest();
        request.setEmail(data.path("email").asText("hr.staff@fpt.com"));
        request.setPassword(data.path("password").asText("Password123@"));
        request.setRole(UserRole.valueOf(data.path("role").asText("RECRUITER")));
        request.setOtp(data.path("otp").asText("123456"));
        request.setCompanyId(data.path("companyId").asLong(10L));
        request.setCompanyHrPin(data.path("wrongHrPin").asText("9999")); // Sai mã PIN

        String branchesJson = String.format("[{\"branchName\":\"Trụ sở chính\",\"managerName\":\"Admin\",\"hrPin\":\"%s\"}]",
                data.path("correctHrPin").asText("1234"));
        Company fpt = Company.builder()
                .companyId(10L)
                .companyName("FPT Software")
                .branchesJson(branchesJson)
                .status(CompanyStatus.VERIFIED)
                .build();

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(otpService.verifyOtp(anyString(), anyString(), anyString())).thenReturn(true);
        when(companyRepository.findById(10L)).thenReturn(Optional.of(fpt));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setUserId(302L);
            return u;
        });

        authService.register(request);
    }

    @Test(description = "AUTH-EXT-08: Nâng cấp tài khoản cũ lưu mật khẩu plaintext sang BCrypt khi đăng nhập thành công")
    public void test_AUTH_EXT08_login_LegacyPlaintextPassword_AutoUpgradesToBcrypt_Success() {
        var data = TestDataLoader.loadJsonNode("testdata/auth-testdata.json").path("extended").path("AUTH_EXT08");
        String email = data.path("email").asText("legacy.user@hiremate.ai");
        String plainPassword = data.path("plainPassword").asText("plainSecretPass123");
        String newBcryptHash = data.path("newBcryptHash").asText("new_bcrypt_hash");

        User legacyUser = User.builder()
                .userId(105L)
                .email(email)
                .passwordHash(plainPassword) // Plaintext chưa băm
                .role(UserRole.CANDIDATE)
                .status(UserStatus.ACTIVE)
                .build();

        LoginRequest request = new LoginRequest(email, plainPassword);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(legacyUser));
        when(passwordEncoder.matches(plainPassword, plainPassword)).thenReturn(false);
        when(passwordEncoder.encode(plainPassword)).thenReturn(newBcryptHash);
        when(jwtUtil.generateToken(eq(email), any())).thenReturn("jwt_token_legacy");
        when(jwtUtil.generateRefreshToken(eq(email), any())).thenReturn("refresh_token_legacy");

        AuthResponse response = authService.login(request);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getToken(), "jwt_token_legacy");
        verify(userRepository, times(1)).save(argThat(u -> newBcryptHash.equals(u.getPasswordHash())));
    }
}

