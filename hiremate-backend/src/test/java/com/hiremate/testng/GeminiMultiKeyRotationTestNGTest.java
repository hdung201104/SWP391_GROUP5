package com.hiremate.testng;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hiremate.config.GeminiAiConfig;
import com.hiremate.dto.ai.AiCvAnalysis;
import com.hiremate.dto.ai.AiInterviewEvaluation;
import com.hiremate.service.impl.GeminiAiServiceImpl;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.*;
import java.util.concurrent.*;

/**
 * Automated Software Engineering Verification Test Suite for Gemini Multi-Key Rotation & Failover
 */
public class GeminiMultiKeyRotationTestNGTest {

    private GeminiAiConfig config;
    private ObjectMapper objectMapper;
    private GeminiAiServiceImpl service;

    private static final String KEY_1 = "test-gemini-key-alpha-9876543210-valid";
    private static final String KEY_2 = "test-gemini-key-beta-9876543210-valid";
    private static final String KEY_3 = "test-gemini-key-gamma-9876543210-valid";

    @BeforeMethod
    public void setUp() throws Exception {
        config = new GeminiAiConfig();
        // Inject multiple keys with comma separation and duplicate KEY_3
        setField(config, "apiKey", KEY_1 + "," + KEY_2 + "," + KEY_3 + "," + KEY_3);
        setField(config, "model", "gemini-3.5-flash-lite");
        setField(config, "baseUrl", "https://generativelanguage.googleapis.com/v1beta");
        setField(config, "voiceModel", "gemini-3.5-flash-lite");

        objectMapper = new ObjectMapper();
        com.hiremate.agent.AgentReflectionEngine reflectionEngine = new com.hiremate.agent.AgentReflectionEngine();
        com.hiremate.agent.AgentToolRegistry toolRegistry = org.mockito.Mockito.mock(com.hiremate.agent.AgentToolRegistry.class);

        service = new GeminiAiServiceImpl(config, objectMapper, reflectionEngine, toolRegistry);
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        Field f = target.getClass().getDeclaredField(fieldName);
        f.setAccessible(true);
        f.set(target, value);
    }

    private Object invokePrivateMethod(Object target, String methodName, Class<?>[] paramTypes, Object[] args) throws Exception {
        Method m = target.getClass().getDeclaredMethod(methodName, paramTypes);
        m.setAccessible(true);
        return m.invoke(target, args);
    }

    @Test(description = "Verify parsing, deduplication, and delimiter flexibility (commas, spaces, semicolons)")
    public void testApiKeyParsingAndDeduplication() throws Exception {
        // Test 1: Deduplication
        List<String> keys = config.getApiKeys();
        Assert.assertEquals(keys.size(), 3, "Duplicate KEY_3 should be filtered out to leave exactly 3 unique keys");
        Assert.assertTrue(keys.contains(KEY_1));
        Assert.assertTrue(keys.contains(KEY_2));
        Assert.assertTrue(keys.contains(KEY_3));

        // Test 2: Flexible delimiter parsing (spaces + semicolons + invalid placeholders)
        GeminiAiConfig spaceConfig = new GeminiAiConfig();
        setField(spaceConfig, "apiKey", KEY_1 + "   " + KEY_2 + "; " + "YOUR_GEMINI_API_KEY short " + KEY_3);
        List<String> parsedKeys = spaceConfig.getApiKeys();
        Assert.assertEquals(parsedKeys.size(), 3, "Should correctly extract 3 valid keys ignoring spaces, semicolons, and placeholders");

        // Test 3: isAvailable check
        Assert.assertTrue(service.isAvailable(), "Service must be available when valid keys are configured");
    }

    @Test(description = "Verify round-robin rotation across healthy keys")
    public void testRoundRobinRotation() throws Exception {
        Set<String> selectedKeys = new HashSet<>();
        for (int i = 0; i < 6; i++) {
            String key = (String) invokePrivateMethod(service, "getNextHealthyApiKey", new Class<?>[]{Set.class}, new Object[]{Collections.emptySet()});
            Assert.assertNotNull(key);
            selectedKeys.add(key);
        }
        Assert.assertEquals(selectedKeys.size(), 3, "Round-robin must distribute across all 3 configured keys");
    }

    @Test(description = "Verify automatic failover when a key encounters HTTP 429 rate limit")
    public void testAutomaticFailoverOnRateLimit() throws Exception {
        // Mark KEY_1 as rate limited (simulate HTTP 429)
        invokePrivateMethod(service, "markApiKeyRateLimited", new Class<?>[]{String.class}, new Object[]{KEY_1});

        // Query next healthy key 10 times - KEY_1 must never be returned!
        for (int i = 0; i < 10; i++) {
            String healthyKey = (String) invokePrivateMethod(service, "getNextHealthyApiKey", new Class<?>[]{Set.class}, new Object[]{Collections.emptySet()});
            Assert.assertNotNull(healthyKey);
            Assert.assertNotEquals(healthyKey, KEY_1, "Rate-limited KEY_1 must be excluded from healthy key pool");
            Assert.assertTrue(healthyKey.equals(KEY_2) || healthyKey.equals(KEY_3), "Should only rotate between healthy KEY_2 and KEY_3");
        }
    }

    @Test(description = "Verify resilience when ALL keys are temporarily rate-limited")
    public void testAllKeysRateLimitedGracefulHandling() throws Exception {
        // Mark all 3 keys as rate-limited
        invokePrivateMethod(service, "markApiKeyRateLimited", new Class<?>[]{String.class}, new Object[]{KEY_1});
        invokePrivateMethod(service, "markApiKeyRateLimited", new Class<?>[]{String.class}, new Object[]{KEY_2});
        invokePrivateMethod(service, "markApiKeyRateLimited", new Class<?>[]{String.class}, new Object[]{KEY_3});

        // getNextHealthyApiKey should return null because all are under cooldown
        String healthy = (String) invokePrivateMethod(service, "getNextHealthyApiKey", new Class<?>[]{Set.class}, new Object[]{Collections.emptySet()});
        Assert.assertNull(healthy, "No healthy key should be available during total cooldown");

        // BUT getNextAvailableApiKey must NOT crash or return null - it must pick the best candidate
        String fallback = (String) invokePrivateMethod(service, "getNextAvailableApiKey", new Class<?>[]{}, new Object[]{});
        Assert.assertNotNull(fallback, "getNextAvailableApiKey must provide graceful fallback even when all keys are cooling down");
        Assert.assertTrue(List.of(KEY_1, KEY_2, KEY_3).contains(fallback));
    }

    @Test(description = "Verify high-concurrency thread safety (20 threads concurrent key selection)")
    public void testConcurrentKeyRotationThreadSafety() throws Exception {
        int threadCount = 20;
        int iterationsPerThread = 50;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(threadCount);
        List<Throwable> errors = new CopyOnWriteArrayList<>();

        for (int t = 0; t < threadCount; t++) {
            executor.submit(() -> {
                try {
                    for (int i = 0; i < iterationsPerThread; i++) {
                        String key = (String) invokePrivateMethod(service, "getNextHealthyApiKey", new Class<?>[]{Set.class}, new Object[]{Collections.emptySet()});
                        if (key == null || key.isBlank()) {
                            throw new IllegalStateException("Key returned was null or blank during concurrent access");
                        }
                    }
                } catch (Throwable e) {
                    errors.add(e);
                } finally {
                    latch.countDown();
                }
            });
        }

        boolean finished = latch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        Assert.assertTrue(finished, "All threads should complete within 10s");
        Assert.assertTrue(errors.isEmpty(), "No concurrency race condition or exception should occur: " + errors);
    }

    @Test(description = "End-to-End Live Test: Evaluate interview answer using live multi-key pool")
    public void testLiveGeminiExecutionWithMultiKeyPool() {
        AiInterviewEvaluation eval = service.evaluateInterviewAnswer(
                "OOP là gì và kể tên 4 tính chất?",
                "OOP là lập trình hướng đối tượng gồm Đóng gói, Kế thừa, Đa hình và Trừu tượng.",
                "Java Fresher Developer"
        );

        Assert.assertNotNull(eval, "Evaluation response must not be null");
        Assert.assertTrue(eval.getScore() > 0, "Score should be positive");
        Assert.assertNotNull(eval.getFeedback(), "Feedback should be present");
    }

    @Test(description = "End-to-End Live Test: CV Analysis using live multi-key pool")
    public void testLiveCvAnalysisWithMultiKeyPool() {
        AiCvAnalysis analysis = service.analyzeCv(
                "Họ tên: Hoàng Ngọc Dũng. Kỹ năng: Java, Spring Boot, PostgreSQL, Git, RESTful API. Dự án: Xây dựng hệ thống HireMate AI."
        );

        Assert.assertNotNull(analysis, "CV analysis response must not be null");
        Assert.assertNotNull(analysis.getSummary(), "Summary must be present");
        Assert.assertTrue(analysis.getTopSkills().contains("Java"), "Top skills should include Java");
    }
}
