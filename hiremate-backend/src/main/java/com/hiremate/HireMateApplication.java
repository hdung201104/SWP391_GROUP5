package com.hiremate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * HireMate AI - Main Entry Point Class
 * Spec: PROJECT_MASTER_SPECIFICATION.md
 */
@org.springframework.cache.annotation.EnableCaching
@org.springframework.scheduling.annotation.EnableAsync
@org.springframework.scheduling.annotation.EnableScheduling
@SpringBootApplication
public class HireMateApplication {

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(HireMateApplication.class, args);
    }

    private static void loadDotEnv() {
        // 1. Tải .env.local trước (nếu có, dùng để mỗi dev cấu hình riêng cổng/DB mà không bị xung đột git)
        loadEnvFile(new java.io.File(".env.local"));
        loadEnvFile(new java.io.File("hiremate-backend/.env.local"));

        // 2. Tải .env mặc định của dự án
        loadEnvFile(new java.io.File(".env"));
        loadEnvFile(new java.io.File("hiremate-backend/.env"));
    }

    private static void loadEnvFile(java.io.File envFile) {
        if (!envFile.exists()) {
            return;
        }
        try {
            java.util.List<String> lines = java.nio.file.Files.readAllLines(envFile.toPath());
            for (String line : lines) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }
                int eqIdx = line.indexOf('=');
                if (eqIdx > 0) {
                    String key = line.substring(0, eqIdx).trim();
                    String value = line.substring(eqIdx + 1).trim();
                    // Bỏ qua giá trị rỗng hoặc placeholder mẫu (YOUR_...) để không ghi đè fallback trong application.yml
                    if (value.isEmpty() || value.startsWith("YOUR_") || value.startsWith("<your_")) {
                        continue;
                    }
                    if (System.getProperty(key) == null && System.getenv(key) == null) {
                        System.setProperty(key, value);
                    }
                }
            }
        } catch (Exception ignored) {
        }
    }
}
