package com.hiremate.service;

import com.hiremate.dto.request.UpdateProfileRequest;
import com.hiremate.dto.response.UserProfileResponse;

public interface UserService {
    UserProfileResponse getProfile(Long userId);
    UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request);
    UserProfileResponse updateAvatar(Long userId, String avatarUrl);
}
