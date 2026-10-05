package com.hiremate.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;

/**
 * Service xác thực Google OAuth2 ID Token gửi từ Frontend.
 * Sử dụng thư viện chính thức com.google.api-client để kiểm tra chữ ký số,
 * hạn sử dụng và thông tin tài khoản người dùng từ Google servers.
 */
@Slf4j
@Service
public class GoogleTokenVerifierService {

    @Value("${google.oauth2.client-id:}")
    private String configuredClientId;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GoogleUserInfo {
        private String googleId;
        private String email;
        private boolean emailVerified;
        private String fullName;
        private String avatarUrl;
    }

    public GoogleUserInfo verify(String idTokenString) {
        if (idTokenString == null || idTokenString.isBlank()) {
            throw new IllegalArgumentException("Google ID Token không được để trống");
        }

        try {
            GoogleIdTokenVerifier.Builder builder = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance()
            );

            // Nếu cấu hình GOOGLE_CLIENT_ID trong application.yml hoặc biến môi trường,
            // verifier sẽ kiểm tra nghiêm ngặt Audience khớp với Client ID của ứng dụng
            if (configuredClientId != null && !configuredClientId.isBlank()) {
                builder.setAudience(Collections.singletonList(configuredClientId.trim()));
                log.info(">> [GoogleTokenVerifier] Đang xác thực với Audience Google Client ID: {}", configuredClientId.trim());
            } else {
                log.warn(">> [GoogleTokenVerifier] CẢNH BÁO: Chưa cấu hình GOOGLE_CLIENT_ID, tiến hành xác thực chữ ký và tính hợp lệ của Token trực tiếp với Google.");
            }

            GoogleIdTokenVerifier verifier = builder.build();
            GoogleIdToken idToken = verifier.verify(idTokenString.trim());

            if (idToken == null) {
                log.warn(">> [GoogleTokenVerifier] Xác thực thất bại: GoogleIdToken trả về null (sai chữ ký, sai Audience hoặc đã hết hạn)");
                throw new IllegalArgumentException("Mã xác thực Google ID Token không hợp lệ hoặc đã hết hạn");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("Không thể trích xuất email từ tài khoản Google");
            }

            String name = (String) payload.get("name");
            String picture = (String) payload.get("picture");
            boolean emailVerified = Boolean.TRUE.equals(payload.getEmailVerified());

            log.info(">> [GoogleTokenVerifier] Xác thực thành công Google ID Token cho tài khoản: {}", email);

            return GoogleUserInfo.builder()
                    .googleId(payload.getSubject())
                    .email(email)
                    .emailVerified(emailVerified)
                    .fullName(name != null && !name.isBlank() ? name : email.split("@")[0])
                    .avatarUrl(picture)
                    .build();

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error(">> [GoogleTokenVerifier] Lỗi hệ thống khi xác thực Google ID Token: {}", e.getMessage(), e);
            throw new IllegalArgumentException("Lỗi xác thực Google ID Token: " + e.getMessage());
        }
    }
}
