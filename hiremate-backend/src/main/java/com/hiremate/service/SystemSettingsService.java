package com.hiremate.service;

import com.hiremate.dto.response.AdminSettingsDTO;

public interface SystemSettingsService {
    AdminSettingsDTO getSettings();
    AdminSettingsDTO updateSettings(AdminSettingsDTO newSettings);
}
