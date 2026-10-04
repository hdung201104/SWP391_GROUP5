package com.hiremate.controller;

import com.hiremate.dto.response.ApiResponse;
import com.hiremate.dto.response.NotificationResponse;
import com.hiremate.entity.User;
import com.hiremate.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getUserNotifications(
            @AuthenticationPrincipal User user
    ) {
        List<NotificationResponse> list = notificationService.getUserNotifications(user);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @AuthenticationPrincipal User user
    ) {
        long count = notificationService.getUnreadCount(user);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("unreadCount", count)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        NotificationResponse response = notificationService.markAsRead(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Notification marked as read", response));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal User user
    ) {
        notificationService.markAllAsRead(user);
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        notificationService.deleteNotification(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa thông báo thành công", null));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearAllNotifications(
            @AuthenticationPrincipal User user
    ) {
        notificationService.clearAllNotifications(user);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa toàn bộ thông báo", null));
    }
}
