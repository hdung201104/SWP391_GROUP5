package com.hiremate.service;

import com.hiremate.dto.request.*;
import com.hiremate.dto.response.AuthResponse;
import com.hiremate.entity.User;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse getCurrentUser(User user);
    String sendOtp(SendOtpRequest request);
    boolean verifyOtp(VerifyOtpRequest request);
    String forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
    void changePassword(Long userId, ChangePasswordRequest request);
    AuthResponse googleLogin(GoogleAuthRequest request);
}
