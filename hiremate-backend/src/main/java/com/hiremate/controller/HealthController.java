package com.hiremate.controller;

import com.hiremate.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Super lightweight Keep-Alive & Health Check controller.
 * Used by UptimeRobot or Cron services to prevent Render Free tier from sleeping.
 */
@RestController
public class HealthController {

    @Autowired(required = false)
    private EmailService emailService;

    @GetMapping({"/health", "/api/v1/health", "/api/v1/ping", "/ping"})
    public ResponseEntity<Map<String, Object>> checkHealth() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "HireMate AI Cloud Backend",
                "timestamp", System.currentTimeMillis()
        ));
    }

    @GetMapping("/api/v1/health/test-email")
    public ResponseEntity<Map<String, Object>> testEmail(@RequestParam(defaultValue = "hdung201104@gmail.com") String to) {
        try {
            if (emailService != null) {
                emailService.sendOtpEmail(to, "888999", "REGISTER");
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Mã OTP kiểm thử đã được gửi thành công đến: " + to,
                        "timestamp", System.currentTimeMillis()
                ));
            }
            return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", "EmailService bean chưa sẵn sàng",
                    "timestamp", System.currentTimeMillis()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", e.getMessage(),
                    "timestamp", System.currentTimeMillis()
            ));
        }
    }
}

