package com.hiremate.service;

public interface EmailService {
    void sendOtpEmail(String toEmail, String otp, String purpose);
    void sendWelcomeEmail(String toEmail, String fullName, String role);
    void sendPasswordChangedNotification(String toEmail);
}
