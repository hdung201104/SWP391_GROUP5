package com.hiremate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * HireMate AI - Main Entry Point Class
 * Spec: PROJECT_MASTER_SPECIFICATION.md
 */
@org.springframework.scheduling.annotation.EnableAsync
@SpringBootApplication
public class HireMateApplication {

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(HireMateApplication.class, args);
    }

    private static void loadDotEnv() {
        java.io.File envFile = new java.io.File(".env");
        if (!envFile.exists()) {
            envFile = new java.io.File("hiremate-backend/.env");
        }
        if (envFile.exists()) {
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
                        if (System.getProperty(key) == null && System.getenv(key) == null) {
                            System.setProperty(key, value);
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        }
    }
}
