package com.hiremate.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hiremate.dto.response.AdminSettingsDTO;
import com.hiremate.service.SystemSettingsService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.concurrent.atomic.AtomicReference;

@Slf4j
@Service
public class SystemSettingsServiceImpl implements SystemSettingsService {

    private static final String SETTINGS_FILE = "system_settings.json";
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AtomicReference<AdminSettingsDTO> settingsRef =
            new AtomicReference<>(AdminSettingsDTO.builder().build());

    @PostConstruct
    public void init() {
        try {
            File file = new File(SETTINGS_FILE);
            if (file.exists() && file.length() > 0) {
                AdminSettingsDTO loaded = objectMapper.readValue(file, AdminSettingsDTO.class);
                if (loaded != null) {
                    settingsRef.set(loaded);
                    log.info(">> [SystemSettingsService] Nạp thành công cấu hình hệ thống từ file: {}", file.getAbsolutePath());
                    return;
                }
            }
            // Save initial defaults
            AdminSettingsDTO defaults = settingsRef.get();
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(file, defaults);
            log.info(">> [SystemSettingsService] Tạo file cấu hình mặc định: {}", file.getAbsolutePath());
        } catch (Exception e) {
            log.warn(">> [SystemSettingsService] Không thể đọc/ghi file cấu hình: {}", e.getMessage());
        }
    }

    @Override
    public AdminSettingsDTO getSettings() {
        return settingsRef.get();
    }

    @Override
    public AdminSettingsDTO updateSettings(AdminSettingsDTO newSettings) {
        if (newSettings == null) {
            return settingsRef.get();
        }

        // Đảm bảo không bị null ở các trường cốt lõi
        if (newSettings.getMandatoryWeight() == null) newSettings.setMandatoryWeight(70);
        if (newSettings.getPreferredWeight() == null) newSettings.setPreferredWeight(100 - newSettings.getMandatoryWeight());
        if (newSettings.getInterviewMaxQuestions() == null) newSettings.setInterviewMaxQuestions(5);
        if (newSettings.getCandidateFreeInterviewsPerDay() == null) newSettings.setCandidateFreeInterviewsPerDay(3);
        if (newSettings.getRecruiterFreeJobPostsPerMonth() == null) newSettings.setRecruiterFreeJobPostsPerMonth(3);
        if (newSettings.getVietqrBankName() == null || newSettings.getVietqrBankName().isBlank()) {
            newSettings.setVietqrBankName("MBBank - Ngân hàng TMCP Quân Đội");
        }
        if (newSettings.getVietqrAccountNumber() == null || newSettings.getVietqrAccountNumber().isBlank()) {
            newSettings.setVietqrAccountNumber("VQRQAMWSJ4104");
        }
        if (newSettings.getVietqrAccountHolder() == null || newSettings.getVietqrAccountHolder().isBlank()) {
            newSettings.setVietqrAccountHolder("HOANG NGOC DUNG");
        }
        if (newSettings.getPayosClientId() == null || newSettings.getPayosClientId().isBlank()) {
            newSettings.setPayosClientId("e2d0f50b-68aa-4cd9-b83f-72c4b3293db4");
        }
        if (newSettings.getPayosApiKey() == null || newSettings.getPayosApiKey().isBlank()) {
            newSettings.setPayosApiKey("425f9314-c0b3-4373-a332-7855f1d9e9d4");
        }
        if (newSettings.getPayosChecksumKey() == null || newSettings.getPayosChecksumKey().isBlank()) {
            newSettings.setPayosChecksumKey("007567eb3a0cf7565f8c4dca7a780336db04c33ec2fc8e0b7d9312dbe5fa447e");
        }
        if (newSettings.getPayosWebhookUrl() == null || newSettings.getPayosWebhookUrl().isBlank()) {
            newSettings.setPayosWebhookUrl("http://localhost:8088/api/v1/payment/payos-webhook");
        }
        if (newSettings.getPayosAutoApproveEnabled() == null) {
            newSettings.setPayosAutoApproveEnabled(true);
        }

        settingsRef.set(newSettings);

        try {
            File file = new File(SETTINGS_FILE);
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(file, newSettings);
            log.info(">> [SystemSettingsService] Đã lưu và áp dụng cấu hình hệ thống xuống file: {}", file.getAbsolutePath());
        } catch (Exception e) {
            log.error(">> [SystemSettingsService] Lỗi khi lưu file cấu hình: {}", e.getMessage());
        }

        return settingsRef.get();
    }
}
