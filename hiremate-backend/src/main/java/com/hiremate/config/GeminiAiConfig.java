package com.hiremate.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class GeminiAiConfig {

    @Value("${gemini.api.key:YOUR_GEMINI_API_KEY}")
    private String apiKey;

    @Value("${gemini.api.model:gemini-1.5-flash}")
    private String model;

    @Value("${gemini.api.base-url:https://generativelanguage.googleapis.com/v1beta}")
    private String baseUrl;

    /**
     * Trích xuất danh sách API Keys để hỗ trợ cơ chế Xoay vòng Key (Key Rotation Pool),
     * cho phép cấu hình nhiều keys ngăn cách bởi dấu phẩy hoặc chấm phẩy: KEY_1,KEY_2,KEY_3
     */
    public java.util.List<String> getApiKeys() {
        if (apiKey == null || apiKey.isBlank()) {
            return java.util.Collections.emptyList();
        }
        String[] tokens = apiKey.split("[,;]");
        java.util.List<String> list = new java.util.ArrayList<>();
        for (String t : tokens) {
            String clean = t.trim();
            if (!clean.isEmpty() && !clean.contains("YOUR_GEMINI_API_KEY")) {
                list.add(clean);
            }
        }
        return list;
    }
}
