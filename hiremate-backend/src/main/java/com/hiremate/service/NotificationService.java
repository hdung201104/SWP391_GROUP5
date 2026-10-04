package com.hiremate.service;

import com.hiremate.dto.response.NotificationResponse;
import com.hiremate.entity.User;
import com.hiremate.enums.NotificationType;

import java.util.List;

public interface NotificationService {
    void createNotification(Long userId, NotificationType type, String title, String body, Long refId, String refTable);
    List<NotificationResponse> getUserNotifications(User user);
    long getUnreadCount(User user);
    NotificationResponse markAsRead(Long notificationId, User user);
    void markAllAsRead(User user);
    void deleteNotification(Long notificationId, User user);
    void clearAllNotifications(User user);
}
