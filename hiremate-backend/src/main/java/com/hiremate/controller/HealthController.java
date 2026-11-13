package com.hiremate.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Super lightweight Keep-Alive & Health Check controller.
 * Used by UptimeRobot or Cron services to prevent Render Free tier from sleeping.
 */
@RestController
public class HealthController {

    @GetMapping({"/health", "/api/v1/health", "/api/v1/ping", "/ping"})
    public ResponseEntity<Map<String, Object>> checkHealth() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "HireMate AI Cloud Backend",
                "timestamp", System.currentTimeMillis()
        ));
    }
}
