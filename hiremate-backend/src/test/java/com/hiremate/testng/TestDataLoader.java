package com.hiremate.testng;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.io.InputStream;

/**
 * Utility helper to load test data from external JSON resources (src/test/resources/testdata/).
 * Implements Data-Driven Testing (DDT) as required by SWP391/SWT301 software testing standards.
 */
public class TestDataLoader {

    private static final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    public static JsonNode loadJsonNode(String resourcePath) {
        try (InputStream is = TestDataLoader.class.getClassLoader().getResourceAsStream(resourcePath)) {
            if (is == null) {
                throw new IllegalArgumentException("Test data file not found on classpath: " + resourcePath);
            }
            return objectMapper.readTree(is);
        } catch (Exception e) {
            throw new RuntimeException("Failed to read JSON test data from: " + resourcePath, e);
        }
    }
}

