package com.hiremate.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class TokenBlacklistService {

    private final Map<String, Long> blacklistedTokens = new ConcurrentHashMap<>();

    /**
     * Thêm token vào danh sách đen với thời gian hết hạn (expiration time) tính bằng ms.
     */
    public void blacklistToken(String token, long expirationTimeMs) {
        if (token != null && !token.isBlank()) {
            cleanExpiredTokens();
            blacklistedTokens.put(token.trim(), expirationTimeMs);
            log.info(">> [Security] Token đã được đưa vào Blacklist thành công. Hết hạn lúc: {}", expirationTimeMs);
        }
    }

    /**
     * Kiểm tra xem token có nằm trong Blacklist hay không.
     */
    public boolean isBlacklisted(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        Long expireAt = blacklistedTokens.get(token.trim());
        if (expireAt == null) {
            return false;
        }
        if (System.currentTimeMillis() > expireAt) {
            blacklistedTokens.remove(token.trim());
            return false;
        }
        return true;
    }

    /**
     * Dọn dẹp định kỳ các token đã hết hạn tự nhiên để giải phóng RAM.
     */
    private void cleanExpiredTokens() {
        long now = System.currentTimeMillis();
        blacklistedTokens.entrySet().removeIf(entry -> entry.getValue() < now);
    }
}
