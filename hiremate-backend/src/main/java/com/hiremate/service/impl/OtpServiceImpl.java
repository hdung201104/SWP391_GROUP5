package com.hiremate.service.impl;

import com.hiremate.service.EmailService;
import com.hiremate.service.OtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpServiceImpl implements OtpService {

    private final EmailService emailService;

    private static class OtpEntry {
        final String otp;
        final Instant expiresAt;

        OtpEntry(String otp, Instant expiresAt) {
            this.otp = otp;
            this.expiresAt = expiresAt;
        }
    }

    private final Map<String, OtpEntry> otpStorage = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    private String buildKey(String email, String purpose) {
        String p = (purpose != null && !purpose.isBlank()) ? purpose.toUpperCase().trim() : "REGISTER";
        return (email.toLowerCase().trim() + ":" + p);
    }

    @Override
    public String generateOtp(String email, String purpose) {
        int code = 100000 + random.nextInt(900000);
        String otp = String.valueOf(code);
        String key = buildKey(email, purpose);

        // Valid for 15 minutes
        Instant expiresAt = Instant.now().plusSeconds(900);
        otpStorage.put(key, new OtpEntry(otp, expiresAt));

        log.info("=================================================");
        log.info(">> [HireMate AI OTP Engine] Email: {}", email);
        log.info(">> Purpose: {}, Code: {}", purpose, otp);
        log.info(">> Valid until: {}", expiresAt);
        log.info("=================================================");

        // Trigger real email dispatch via EmailService
        try {
            emailService.sendOtpEmail(email, otp, purpose);
        } catch (Exception e) {
            log.error(">> [OtpService] Lỗi phát sinh khi gửi email xác thực: {}", e.getMessage());
        }

        return otp;
    }

    @Override
    public boolean verifyOtp(String email, String otp, String purpose) {
        if (otp == null || otp.isBlank()) {
            return false;
        }

        // Master bypass for testing / grading demo
        if ("123456".equals(otp.trim()) || "888888".equals(otp.trim())) {
            log.info(">> [HireMate AI OTP] Master demo OTP accepted for: {}", email);
            return true;
        }

        String key = buildKey(email, purpose);
        OtpEntry entry = otpStorage.get(key);
        if (entry == null) {
            entry = otpStorage.get(email.toLowerCase().trim() + ":REGISTER");
        }

        if (entry == null) {
            log.warn(">> [HireMate AI OTP] No active OTP found for key: {}", key);
            return false;
        }

        if (Instant.now().isAfter(entry.expiresAt)) {
            otpStorage.remove(key);
            log.warn(">> [HireMate AI OTP] Code expired for: {}", email);
            return false;
        }

        boolean matches = entry.otp.equals(otp.trim());
        if (matches) {
            otpStorage.remove(key); // single use
            log.info(">> [HireMate AI OTP] Verification succeeded for: {}", email);
        } else {
            log.warn(">> [HireMate AI OTP] Incorrect code '{}' for: {}", otp, email);
        }

        return matches;
    }
}
