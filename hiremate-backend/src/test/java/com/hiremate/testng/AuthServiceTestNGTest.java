package com.hiremate.testng;

import com.hiremate.config.JwtUtil;
import com.hiremate.dto.request.LoginRequest;
import com.hiremate.dto.request.RegisterRequest;
import com.hiremate.dto.response.AuthResponse;
import com.hiremate.entity.Candidate;
import com.hiremate.entity.Company;
import com.hiremate.entity.Recruiter;
import com.hiremate.entity.User;
import com.hiremate.enums.UserRole;
import com.hiremate.enums.UserStatus;
import com.hiremate.repository.CandidateRepository;
import com.hiremate.repository.CompanyRepository;
import com.hiremate.repository.RecruiterRepository;
import com.hiremate.repository.UserRepository;
import com.hiremate.service.EmailService;
import com.hiremate.service.GoogleTokenVerifierService;
import com.hiremate.service.NotificationService;
import com.hiremate.service.OtpService;
import com.hiremate.service.impl.AuthServiceImpl;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * ============================================================================
 * TEST SUITE: KIỂM THỬ XÁC THỰC (REGISTER & LOGIN) - HIREMATE AI BACKEND
 * Sử dụng TestNG Framework (thay thế JUnit theo yêu cầu đề tài)
 * Bao gồm đầy đủ 7 Test Cases minh họa:
 *  - 1. Nhóm hàm AssertX()
 *  - 2. Đăng ký Recruiter tạo Company tự động
 *  - 3. Bắt ngoại lệ ngoại suy có chủ đích (expectedExceptions)
 *  - 4. Data-Driven Testing (DDT) với @DataProvider
 *  - 5. Đăng nhập thành công với thông tin hợp lệ
 *  - 6. Bắt lỗi sai thông tin đăng nhập
 *  - 7. Ràng buộc Dependency (dependsOnMethods) - Login thành công mới gọi hàm sau
 * ============================================================================
 */
public class AuthServiceTestNGTest {

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
    private com.hiremate.service.TokenBlacklistService tokenBlacklistService;

    private AuthServiceImpl authService;
    private User sampleCandidate;

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
        tokenBlacklistService = mock(com.hiremate.service.TokenBlacklistService.class);

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

        sampleCandidate = User.builder()
                .userId(101L)
                .email("candidate@hiremate.ai")
                .passwordHash("$2a$10$encoded_bcrypt_hashed_password")
                .fullName("Nguyen Van A")
                .role(UserRole.CANDIDATE)
                .status(UserStatus.ACTIVE)
                .isEmailVerified(true)
                .build();
    }

    // ========================================================================
    // TEST CASE 1: Đăng ký Candidate thành công (Kiểm tra assertX)
    // ========================================================================
    @Test(description = "TC01: Đăng ký tài khoản Ứng viên (CANDIDATE) thành công và mã hóa mật khẩu")
    public void test01_registerCandidate_Success() {
        RegisterRequest request = RegisterRequest.builder()
                .email("newcandidate@hiremate.ai")
                .password("SecurePass2026@")
                .fullName("Le Thi Thu")
                .role(UserRole.CANDIDATE)
                .build();

        when(userRepository.existsByEmail("newcandidate@hiremate.ai")).thenReturn(false);
        when(passwordEncoder.encode("SecurePass2026@")).thenReturn("bcrypt_encrypted_hash");
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setUserId(201L);
            return u;
        });
        when(jwtUtil.generateToken(anyString(), any())).thenReturn("mocked_jwt_access_token");
        when(jwtUtil.generateRefreshToken(anyString(), any())).thenReturn("mocked_jwt_refresh_token");

        AuthResponse response = authService.register(request);

        // Nhóm hàm assertX() của TestNG
        Assert.assertNotNull(response, "Response không được null");
        Assert.assertEquals(response.getEmail(), "newcandidate@hiremate.ai", "Email trả về không khớp");
        Assert.assertEquals(response.getFullName(), "Le Thi Thu", "Họ tên không khớp");
        Assert.assertEquals(response.getRole(), UserRole.CANDIDATE, "Role phải là CANDIDATE");
        Assert.assertEquals(response.getToken(), "mocked_jwt_access_token", "JWT token không đúng");
        Assert.assertTrue(response.getIsEmailVerified(), "Tài khoản đăng ký mới phải được xác thực email");

        // Verify mật khẩu đã được mã hóa BCrypt
        verify(passwordEncoder, times(1)).encode("SecurePass2026@");
        verify(candidateRepository, times(1)).save(any(Candidate.class));
    }

    // ========================================================================
    // TEST CASE 2: Đăng ký Recruiter thành công (Tự động liên kết Company)
    // ========================================================================
    @Test(description = "TC02: Đăng ký Nhà tuyển dụng (RECRUITER) tự động khởi tạo Doanh nghiệp")
    public void test02_registerRecruiter_Success() {
        RegisterRequest request = RegisterRequest.builder()
                .email("hr@fpt.com")
                .password("HrPassword123#")
                .fullName("Tran Van HR")
                .companyName("FPT Software")
                .role(UserRole.RECRUITER)
                .build();

        when(userRepository.existsByEmail("hr@fpt.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_hr_password");
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setUserId(301L);
            return u;
        });
        when(companyRepository.saveAndFlush(any(Company.class))).thenAnswer(i -> {
            Company c = i.getArgument(0);
            c.setCompanyId(501L);
            return c;
        });
        when(recruiterRepository.saveAndFlush(any(Recruiter.class))).thenAnswer(i -> {
            Recruiter r = i.getArgument(0);
            r.setRecruiterId(301L);
            return r;
        });
        when(jwtUtil.generateToken(anyString(), any())).thenReturn("recruiter_jwt_token");
        when(jwtUtil.generateRefreshToken(anyString(), any())).thenReturn("recruiter_refresh_token");

        AuthResponse response = authService.register(request);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getRole(), UserRole.RECRUITER);
        Assert.assertEquals(response.getCompanyId(), Long.valueOf(501L), "Company ID phải được gán chuẩn xác");
        verify(companyRepository, atLeastOnce()).save(any(Company.class));
        verify(recruiterRepository, times(1)).saveAndFlush(any(Recruiter.class));
    }

    // ========================================================================
    // TEST CASE 3: Bắt ngoại lệ trùng Email (expectedExceptions)
    // ========================================================================
    @Test(
        description = "TC03: Bắt ngoại lệ khi đăng ký trùng Email đã có trong hệ thống",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*Email already exists.*"
    )
    public void test03_register_DuplicateEmail_ThrowsException() {
        RegisterRequest request = RegisterRequest.builder()
                .email("candidate@hiremate.ai")
                .password("Password123@")
                .fullName("Trung Email")
                .build();

        // Giả lập email đã tồn tại trong database
        when(userRepository.existsByEmail("candidate@hiremate.ai")).thenReturn(true);

        // Gọi hàm - TestNG sẽ bắt ngoại lệ và đánh dấu test case là PASS (Xanh)
        authService.register(request);
    }

    // ========================================================================
    // TEST CASE 4: Data-Driven Testing (DDT) với @DataProvider
    // ========================================================================
    @DataProvider(name = "candidateRoleFallbacks")
    public Object[][] provideCandidateTestData() {
        return new Object[][] {
            { "user_a@test.com", "User Alpha", UserRole.CANDIDATE },
            { "user_b@test.com", "User Beta", null } // Khi role là null, hệ thống tự fallback về CANDIDATE
        };
    }

    @Test(
        dataProvider = "candidateRoleFallbacks",
        description = "TC04: DDT - Kiểm tra đăng ký ứng viên với nhiều kịch bản dữ liệu khác nhau"
    )
    public void test04_register_DataDrivenTesting_DDT(String email, String fullName, UserRole role) {
        RegisterRequest req = RegisterRequest.builder()
                .email(email)
                .password("PassDDT123#")
                .fullName(fullName)
                .role(role)
                .build();

        when(userRepository.existsByEmail(email)).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_pass");
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setUserId(999L);
            return u;
        });
        when(jwtUtil.generateToken(anyString(), any())).thenReturn("token_ddt");
        when(jwtUtil.generateRefreshToken(anyString(), any())).thenReturn("refresh_token_ddt");

        AuthResponse res = authService.register(req);

        Assert.assertNotNull(res);
        Assert.assertEquals(res.getEmail(), email);
        Assert.assertEquals(res.getRole(), UserRole.CANDIDATE, "Role phải luôn là CANDIDATE dù role đầu vào null");
    }

    // ========================================================================
    // TEST CASE 5: Đăng nhập thành công với thông tin hợp lệ
    // ========================================================================
    @Test(description = "TC05: Đăng nhập thành công với email và mật khẩu chính xác")
    public void test05_login_ValidCredentials_Success() {
        LoginRequest request = LoginRequest.builder()
                .email("candidate@hiremate.ai")
                .password("CorrectPassword123#")
                .build();

        when(userRepository.findByEmail("candidate@hiremate.ai")).thenReturn(Optional.of(sampleCandidate));
        when(passwordEncoder.matches("CorrectPassword123#", sampleCandidate.getPasswordHash())).thenReturn(true);
        when(jwtUtil.generateToken(eq(sampleCandidate.getEmail()), any())).thenReturn("login_access_token_success");
        when(jwtUtil.generateRefreshToken(eq(sampleCandidate.getEmail()), any())).thenReturn("login_refresh_token_success");

        AuthResponse response = authService.login(request);

        Assert.assertNotNull(response);
        Assert.assertEquals(response.getToken(), "login_access_token_success");
        Assert.assertEquals(response.getUserId(), Long.valueOf(101L));
        Assert.assertEquals(response.getEmail(), "candidate@hiremate.ai");
    }

    // ========================================================================
    // TEST CASE 6: Bắt lỗi khi đăng nhập sai mật khẩu
    // ========================================================================
    @Test(
        description = "TC06: Bắt lỗi khi người dùng nhập sai mật khẩu đăng nhập",
        expectedExceptions = IllegalArgumentException.class,
        expectedExceptionsMessageRegExp = ".*không chính xác.*"
    )
    public void test06_login_WrongPassword_ThrowsException() {
        LoginRequest request = LoginRequest.builder()
                .email("candidate@hiremate.ai")
                .password("TotallyWrongPassword999#")
                .build();

        when(userRepository.findByEmail("candidate@hiremate.ai")).thenReturn(Optional.of(sampleCandidate));
        when(passwordEncoder.matches("TotallyWrongPassword999#", sampleCandidate.getPasswordHash())).thenReturn(false);

        // Gọi hàm đăng nhập - TestNG bắt ngoại lệ đúng thông điệp
        authService.login(request);
    }

    // ========================================================================
    // TEST CASE 7: Ràng buộc Dependency (dependsOnMethods)
    // Đúng y hệt đề bài: Login thành công mới chạy kịch bản xem thông tin User!
    // ========================================================================
    @Test(
        dependsOnMethods = "test05_login_ValidCredentials_Success",
        description = "TC07: DEPENDENCY - Chỉ chạy khi test05 (Login) thành công. Lấy thông tin user hiện tại."
    )
    public void test07_getCurrentUser_DependsOn_Login() {
        AuthResponse response = authService.getCurrentUser(sampleCandidate);

        Assert.assertNotNull(response, "Thông tin User sau khi Login thành công không được null");
        Assert.assertEquals(response.getUserId(), Long.valueOf(101L));
        Assert.assertEquals(response.getEmail(), "candidate@hiremate.ai");
        Assert.assertEquals(response.getRole(), UserRole.CANDIDATE);
    }
}
