package com.hiremate.service.impl;

import com.hiremate.dto.response.NotificationResponse;
import com.hiremate.entity.Notification;
import com.hiremate.entity.User;
import com.hiremate.enums.NotificationType;
import com.hiremate.repository.NotificationRepository;
import com.hiremate.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public void createNotification(Long userId, NotificationType type, String title, String body, Long refId, String refTable) {
        try {
            Notification notification = Notification.builder()
                    .userId(userId)
                    .type(type != null ? type : NotificationType.SYSTEM_ALERT)
                    .title(title)
                    .body(body)
                    .refId(refId)
                    .refTable(refTable)
                    .isRead(false)
                    .build();

            notificationRepository.save(notification);
            log.info(">> [Notification] Đã tạo thông báo cho user_id={}: {}", userId, title);
        } catch (Exception e) {
            log.error(">> [Notification] Lỗi khi tạo thông báo cho user_id={}: {}", userId, e.getMessage());
        }
    }

    @Override
    public List<NotificationResponse> getUserNotifications(User user) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getUserId());
        return notifications.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public long getUnreadCount(User user) {
        return notificationRepository.countByUserIdAndIsReadFalse(user.getUserId());
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long notificationId, User user) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));

        if (!notification.getUserId().equals(user.getUserId())) {
            throw new SecurityException("Unauthorized to update this notification");
        }

        notification.setIsRead(true);
        Notification saved = notificationRepository.save(notification);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void markAllAsRead(User user) {
        List<Notification> unreadList = notificationRepository.findByUserIdAndIsReadFalse(user.getUserId());
        for (Notification notif : unreadList) {
            notif.setIsRead(true);
        }
        notificationRepository.saveAll(unreadList);
    }

    @Override
    @Transactional
    public void deleteNotification(Long notificationId, User user) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));

        if (!notification.getUserId().equals(user.getUserId())) {
            throw new SecurityException("Unauthorized to delete this notification");
        }

        notificationRepository.delete(notification);
        log.info(">> [Notification] Đã xóa thông báo id={} của user_id={}", notificationId, user.getUserId());
    }

    @Override
    @Transactional
    public void clearAllNotifications(User user) {
        List<Notification> all = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getUserId());
        notificationRepository.deleteAll(all);
        log.info(">> [Notification] Đã xóa toàn bộ thông báo của user_id={}", user.getUserId());
    }

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .notificationId(n.getNotificationId())
                .userId(n.getUserId())
                .type(n.getType())
                .title(n.getTitle())
                .body(n.getBody())
                .refId(n.getRefId())
                .refTable(n.getRefTable())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
