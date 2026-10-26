package com.hiremate.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@Getter
public class GeminiAiConfig {

    @Value("${gemini.api.key:YOUR_GEMINI_API_KEY}")
    private String apiKey;

    @Value("${gemini.api.model:gemini-3-flash-preview}")
    private String model;

    @Value("${gemini.api.base-url:https://generativelanguage.googleapis.com/v1beta}")
    private String baseUrl;

    @Value("${gemini.voice.api-key:}")
    private String voiceApiKey;

    @Value("${gemini.voice.model:gemini-3-flash-preview}")
    private String voiceModel;

    /**
     * Lấy API Key chuyên biệt cho Voice AI & Phỏng vấn trực tiếp.
     * Tự động fallback về API Key chung nếu voiceApiKey chưa cấu hình.
     */
    public String getEffectiveVoiceApiKey() {
        if (voiceApiKey != null && !voiceApiKey.isBlank() && !voiceApiKey.contains("YOUR_GEMINI_VOICE_API_KEY")) {
            return voiceApiKey.trim();
        }
        List<String> keys = getApiKeys();
        if (!keys.isEmpty()) return keys.get(0);
        return apiKey;
    }

    public String getEffectiveVoiceModel() {
        if (voiceModel != null && !voiceModel.isBlank()) {
            return voiceModel.trim();
        }
        return "gemini-3-flash-preview";
    }

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
