package com.hiremate.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class OpenAiConfig {

    @Value("${openai.api.key:}")
    private String apiKey;

    @Value("${openai.api.realtime-model:gpt-4o-realtime-preview}")
    private String realtimeModel;

    @Value("${openai.api.voice:alloy}")
    private String voice;

    @Value("${openai.api.base-url:https://api.openai.com/v1}")
    private String baseUrl;

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank() && !apiKey.equalsIgnoreCase("your_openai_api_key_here");
    }
}
