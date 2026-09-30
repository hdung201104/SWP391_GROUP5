package com.hiremate.service;

public interface OtpService {
    String generateOtp(String email, String purpose);
    boolean verifyOtp(String email, String otp, String purpose);
}
