package com.hiremate.controller;

import com.hiremate.dto.request.*;
import com.hiremate.dto.response.ApiResponse;
import com.hiremate.dto.response.AuthResponse;
import com.hiremate.entity.User;
import com.hiremate.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final com.hiremate.repository.UserRepository userRepository;
    private final com.hiremate.service.FileStorageService fileStorageService;
    private final com.hiremate.service.UserSessionService userSessionService;
    private final com.hiremate.config.JwtUtil jwtUtil;

    @PostMapping(value = "/upload-license", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadLicenseBeforeRegister(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file
    ) {
        if (file == null || file.isEmpty()) {
            throw new com.hiremate.exception.BadRequestException("Tệp Giấy phép kinh doanh không được để trống");
        }
        long maxBytes = 10 * 1024 * 1024L; // 10MB
        if (file.getSize() > maxBytes) {
            throw new com.hiremate.exception.BadRequestException("Dung lượng tệp vượt quá giới hạn 10MB");
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new com.hiremate.exception.BadRequestException("Tên tệp không hợp lệ");
        }
        String lower = originalFilename.toLowerCase();
        if (!lower.endsWith(".pdf") && !lower.endsWith(".jpg") && !lower.endsWith(".jpeg") && !lower.endsWith(".png") && !lower.endsWith(".webp")) {
            throw new com.hiremate.exception.BadRequestException("Chỉ chấp nhận tệp định dạng .pdf, .jpg, .jpeg, .png, .webp");
        }

        String uploadedUrl = fileStorageService.storeFile(file, "licenses");
        String fileName = originalFilename;
        return ResponseEntity.ok(ApiResponse.ok("Tải tệp GPKD thành công", Map.of(
                "url", uploadedUrl,
                "fileName", fileName
        )));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest
    ) {
        AuthResponse response = authService.login(request);
        if (userSessionService != null && response != null) {
            userSessionService.recordSession(response.getUserId(), response.getToken(), response.getRefreshToken(), httpRequest);
        }
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.ok("Registration successful", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }
        AuthResponse response = authService.getCurrentUser(user);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<Map<String, String>>> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        String generatedOtp = authService.sendOtp(request);
        Map<String, String> data = new java.util.HashMap<>();
        data.put("email", request.getEmail());
        data.put("purpose", request.getPurpose());
        data.put("otpDevHint", generatedOtp);
        return ResponseEntity.ok(ApiResponse.ok("Mã xác thực OTP đã được tạo và gửi đến email", data));
    }

    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkEmail(@RequestParam String email) {
        boolean exists = userRepository.existsByEmail(email.toLowerCase().trim());
        Map<String, Object> data = new java.util.HashMap<>();
        data.put("email", email);
        data.put("exists", exists);
        return ResponseEntity.ok(ApiResponse.ok("Kiểm tra sự tồn tại của email thành công", data));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Boolean>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        boolean verified = authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.ok("Xác thực OTP thành công", verified));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Map<String, String>>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String generatedOtp = authService.forgotPassword(request);
        Map<String, String> data = new java.util.HashMap<>();
        data.put("email", request.getEmail());
        data.put("otpDevHint", generatedOtp);
        return ResponseEntity.ok(ApiResponse.ok("Mã OTP khôi phục mật khẩu đã được gửi đến email", data));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.ok("Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay bằng mật khẩu mới.", "SUCCESS"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ChangePasswordRequest request) {
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập để đổi mật khẩu"));
        }
        authService.changePassword(user.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Đổi mật khẩu thành công!", "SUCCESS"));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(
            @Valid @RequestBody GoogleAuthRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest
    ) {
        AuthResponse response = authService.googleLogin(request);
        if (userSessionService != null && response != null) {
            userSessionService.recordSession(response.getUserId(), response.getToken(), response.getRefreshToken(), httpRequest);
        }
        return ResponseEntity.ok(ApiResponse.ok("Đăng nhập Google thành công", response));
    }

    @PostMapping("/google/complete-registration")
    public ResponseEntity<ApiResponse<AuthResponse>> completeGoogleRegistration(
            @Valid @RequestBody GoogleCompleteRegistrationRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest
    ) {
        AuthResponse response = authService.completeGoogleRegistration(request);
        if (userSessionService != null && response != null) {
            userSessionService.recordSession(response.getUserId(), response.getToken(), response.getRefreshToken(), httpRequest);
        }
        return ResponseEntity.ok(ApiResponse.ok("Hoàn tất đăng ký tài khoản thành công", response));
    }

    @PostMapping("/github")
    public ResponseEntity<ApiResponse<AuthResponse>> githubLogin(
            @RequestBody GitHubAuthRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest
    ) {
        AuthResponse response = authService.githubLogin(request);
        if (userSessionService != null && response != null) {
            userSessionService.recordSession(response.getUserId(), response.getToken(), response.getRefreshToken(), httpRequest);
        }
        return ResponseEntity.ok(ApiResponse.ok("Đăng nhập GitHub thành công", response));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @Valid @RequestBody com.hiremate.dto.request.RefreshTokenRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest
    ) {
        AuthResponse response = authService.refreshToken(request);
        if (userSessionService != null && response != null) {
            userSessionService.recordSession(response.getUserId(), response.getToken(), response.getRefreshToken(), httpRequest);
        }
        return ResponseEntity.ok(ApiResponse.ok("Làm mới token thành công", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        authService.logout(authHeader);
        return ResponseEntity.ok(ApiResponse.ok("Đăng xuất thành công", "LOGGED_OUT"));
    }

    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<java.util.List<com.hiremate.dto.response.UserSessionDTO>>> getActiveSessions(
            @AuthenticationPrincipal User user,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            jakarta.servlet.http.HttpServletRequest httpRequest
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập để xem phiên hoạt động"));
        }
        String currentToken = jwtUtil.extractTokenFromHeader(authHeader);
        if ((currentToken == null || currentToken.isBlank()) && httpRequest != null) {
            String pToken = httpRequest.getParameter("token");
            if (pToken == null || pToken.isBlank()) pToken = httpRequest.getParameter("access_token");
            if (pToken != null && !pToken.isBlank()) currentToken = pToken.trim();
        }
        java.util.List<com.hiremate.dto.response.UserSessionDTO> sessions = userSessionService.getUserSessions(user, currentToken);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách phiên đăng nhập thành công", sessions));
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<String>> revokeSession(
            @AuthenticationPrincipal User user,
            @PathVariable String sessionId
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập"));
        }
        userSessionService.revokeSession(user, sessionId);
        return ResponseEntity.ok(ApiResponse.ok("Đã đăng xuất thiết bị thành công", "SESSION_REVOKED"));
    }

    @DeleteMapping("/sessions/others")
    public ResponseEntity<ApiResponse<String>> revokeAllOtherSessions(
            @AuthenticationPrincipal User user,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            jakarta.servlet.http.HttpServletRequest httpRequest
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập"));
        }
        String currentToken = jwtUtil.extractTokenFromHeader(authHeader);
        if ((currentToken == null || currentToken.isBlank()) && httpRequest != null) {
            String pToken = httpRequest.getParameter("token");
            if (pToken == null || pToken.isBlank()) pToken = httpRequest.getParameter("access_token");
            if (pToken != null && !pToken.isBlank()) currentToken = pToken.trim();
        }
        userSessionService.revokeAllOtherSessions(user, currentToken);
        return ResponseEntity.ok(ApiResponse.ok("Đã đăng xuất tất cả các thiết bị khác thành công", "OTHER_SESSIONS_REVOKED"));
    }
}
