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

    private static class RateLimitEntry {
        int count;
        Instant resetTime;

        RateLimitEntry(int count, Instant resetTime) {
            this.count = count;
            this.resetTime = resetTime;
        }
    }

    private final Map<String, OtpEntry> otpStorage = new ConcurrentHashMap<>();
    private final Map<String, Instant> verifiedStorage = new ConcurrentHashMap<>();
    private final Map<String, RateLimitEntry> rateLimitStorage = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    private static final int MAX_OTP_ATTEMPTS = 5;
    private static final long WINDOW_SECONDS = 900; // 15 phút

    private String buildKey(String email, String purpose) {
        String p = (purpose != null && !purpose.isBlank()) ? purpose.toUpperCase().trim() : "REGISTER";
        return (email.toLowerCase().trim() + ":" + p);
    }

    @Override
    public String generateOtp(String email, String purpose) {
        String cleanEmail = email.toLowerCase().trim();
        Instant now = Instant.now();

        // Kiểm tra Rate Limit (Tối đa 5 lần / 15 phút)
        RateLimitEntry rateLimit = rateLimitStorage.compute(cleanEmail, (k, existing) -> {
            if (existing == null || now.isAfter(existing.resetTime)) {
                return new RateLimitEntry(1, now.plusSeconds(WINDOW_SECONDS));
            }
            existing.count++;
            return existing;
        });

        if (rateLimit.count > MAX_OTP_ATTEMPTS) {
            log.warn(">> [OtpService] Email {} đã bị chặn do vượt quá giới hạn gửi OTP ({} lần)", cleanEmail, rateLimit.count);
            throw new IllegalArgumentException("Bạn đã yêu cầu gửi mã OTP quá " + MAX_OTP_ATTEMPTS + " lần trong vòng 15 phút. Vui lòng đợi trước khi yêu cầu lại!");
        }

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

        // Trigger real email dispatch asynchronously so the frontend returns instantly (no hang on cloud)
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                emailService.sendOtpEmail(cleanEmail, otp, purpose);
            } catch (Exception e) {
                log.error(">> [OtpService] Lỗi phát sinh khi gửi email xác thực bất đồng bộ: {}", e.getMessage());
            }
        });

        return otp;
    }

    @Override
    public boolean verifyOtp(String email, String otp, String purpose) {
        if (email == null || email.isBlank()) {
            return false;
        }

        String key = buildKey(email, purpose);
        String registerKey = email.toLowerCase().trim() + ":REGISTER";

        // 1. Kiểm tra xem email đã được xác thực OTP thành công trong phiên gần nhất chưa (hỗ trợ luồng 2 bước verify -> submit)
        Instant verifiedUntil = verifiedStorage.get(key);
        if (verifiedUntil == null && "REGISTER".equalsIgnoreCase(purpose)) {
            verifiedUntil = verifiedStorage.get(registerKey);
        }
        if (verifiedUntil != null && Instant.now().isBefore(verifiedUntil)) {
            log.info(">> [HireMate AI OTP] Email {} đã được xác thực OTP thành công trước đó (trong vòng 10 phút).", email);
            return true;
        }

        if (otp == null || otp.isBlank()) {
            return false;
        }

        OtpEntry entry = otpStorage.get(key);
        if (entry == null) {
            entry = otpStorage.get(registerKey);
        }

        if (entry == null) {
            log.warn(">> [HireMate AI OTP] Không tìm thấy mã OTP nào đang hoạt động cho: {}", key);
            return false;
        }

        if (Instant.now().isAfter(entry.expiresAt)) {
            otpStorage.remove(key);
            otpStorage.remove(registerKey);
            log.warn(">> [HireMate AI OTP] Mã OTP đã hết hạn cho email: {}", email);
            return false;
        }

        boolean matches = entry.otp.equals(otp.trim());
        if (matches) {
            otpStorage.remove(key); // Dùng 1 lần
            otpStorage.remove(registerKey);
            // Lưu trạng thái đã xác thực thành công trong 10 phút để hoàn tất lưu tài khoản vào DB
            verifiedStorage.put(key, Instant.now().plusSeconds(600));
            verifiedStorage.put(registerKey, Instant.now().plusSeconds(600));
            log.info(">> [HireMate AI OTP] Xác thực OTP thành công cho email: {}", email);
        } else {
            log.warn(">> [HireMate AI OTP] Mã OTP không chính xác '{}' cho email: {}", otp, email);
        }

        return matches;
    }
}
