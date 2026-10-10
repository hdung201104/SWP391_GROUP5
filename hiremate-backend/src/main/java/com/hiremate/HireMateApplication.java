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
        SpringApplication.run(HireMateApplication.class, args);
    }
}
