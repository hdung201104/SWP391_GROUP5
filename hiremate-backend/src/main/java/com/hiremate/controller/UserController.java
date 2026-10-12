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
    private final com.hiremate.service.CandidateService candidateService;

    @GetMapping("/candidates/{candidateId}")
    public ResponseEntity<ApiResponse<com.hiremate.dto.response.CandidateProfileResponse>> getCandidateProfile(
            @PathVariable Long candidateId,
            @AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập để xem hồ sơ ứng viên"));
        }
        com.hiremate.dto.response.CandidateProfileResponse response = candidateService.getCandidateProfile(candidateId, user);
        return ResponseEntity.ok(ApiResponse.ok("Lấy hồ sơ chi tiết ứng viên thành công", response));
    }

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

    @PostMapping(value = "/avatar/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<UserProfileResponse>> uploadAvatar(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập để tải ảnh đại diện"));
        }
        UserProfileResponse response = userService.uploadAvatar(user.getUserId(), file);
        return ResponseEntity.ok(ApiResponse.ok("Tải lên và cập nhật ảnh đại diện thành công", response));
    }

    @GetMapping("/skills")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<java.util.List<com.hiremate.dto.response.CandidateSkillResponse>>> getCandidateSkills(
            @AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập để xem kỹ năng"));
        }
        java.util.List<com.hiremate.dto.response.CandidateSkillResponse> list = userService.getCandidateSkills(user.getUserId());
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách kỹ năng thành công", list));
    }

    @PostMapping("/skills")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<com.hiremate.dto.response.CandidateSkillResponse>> addCandidateSkill(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody com.hiremate.dto.request.AddCandidateSkillRequest request) {
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập để quản lý kỹ năng"));
        }
        com.hiremate.dto.response.CandidateSkillResponse response = userService.addOrUpdateCandidateSkill(user.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Thêm/Cập nhật kỹ năng thành công", response));
    }

    @DeleteMapping("/skills/{skillId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<Void>> deleteCandidateSkill(
            @AuthenticationPrincipal User user,
            @PathVariable Long skillId) {
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập để xóa kỹ năng"));
        }
        userService.deleteCandidateSkill(user.getUserId(), skillId);
        return ResponseEntity.ok(ApiResponse.ok("Xóa kỹ năng khỏi hồ sơ thành công", null));
    }
}
