package com.hiremate.controller;

import com.hiremate.dto.request.UpdateAvatarRequest;
import com.hiremate.dto.request.UpdateProfileRequest;
import com.hiremate.dto.response.ApiResponse;
import com.hiremate.dto.response.UserProfileResponse;
import com.hiremate.entity.User;
import com.hiremate.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập để xem hồ sơ"));
        }
        UserProfileResponse response = userService.getProfile(user.getUserId());
        return ResponseEntity.ok(ApiResponse.ok("Lấy thông tin hồ sơ thành công", response));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateProfileRequest request) {
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập để chỉnh sửa hồ sơ"));
        }
        UserProfileResponse response = userService.updateProfile(user.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thông tin hồ sơ thành công", response));
    }

    @PostMapping("/avatar")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateAvatar(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateAvatarRequest request) {
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập để đổi ảnh đại diện"));
        }
        UserProfileResponse response = userService.updateAvatar(user.getUserId(), request.getAvatarUrl());
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật ảnh đại diện thành công", response));
    }
}
