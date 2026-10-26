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
    private final com.hiremate.repository.SubscriptionRepository subscriptionRepository;
    private final com.hiremate.repository.UserRepository userRepository;

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
    @Transactional
    public void notifyAdmins(NotificationType type, String title, String body, Long refId, String refTable) {
        try {
            List<User> admins = userRepository.findByRole(com.hiremate.enums.UserRole.ADMIN);
            for (User admin : admins) {
                createNotification(admin.getUserId(), type, title, body, refId, refTable);
            }
            log.info(">> [Notification] Đã gửi thông báo cho {} Admin: {}", admins.size(), title);
        } catch (Exception e) {
            log.warn("Không thể gửi thông báo cho Admins: {}", e.getMessage());
        }
    }

    @Override
    @Transactional
    public List<NotificationResponse> getUserNotifications(User user) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getUserId());

        // Tự động đồng bộ thông báo nâng cấp nếu người dùng đã có gói active nhưng chưa được nhận thông báo
        try {
            boolean hasSubNotif = notifications.stream()
                    .anyMatch(n -> n.getTitle() != null && n.getTitle().contains("Nâng cấp"));
            if (!hasSubNotif) {
                subscriptionRepository.findFirstByUser_UserIdAndStatusOrderByCreatedAtDesc(user.getUserId(), com.hiremate.enums.SubscriptionStatus.ACTIVE)
                        .ifPresent(sub -> {
                            com.hiremate.entity.SubscriptionPlan plan = sub.getPlan();
                            if (plan != null && plan.getPrice() != null && plan.getPrice().compareTo(java.math.BigDecimal.ZERO) > 0) {
                                createNotification(
                                        user.getUserId(),
                                        NotificationType.SYSTEM_ALERT,
                                        "🎉 Nâng cấp tài khoản thành công!",
                                        "Chúc mừng bạn đã nâng cấp thành công gói " + plan.getPlanName() + ". Toàn bộ đặc quyền AI cao cấp và hạn mức đã được kích hoạt!",
                                        sub.getSubscriptionId(),
                                        "subscriptions"
                                );
                            }
                        });
            }
        } catch (Exception e) {
            log.warn("Không thể đồng bộ thông báo gói active: {}", e.getMessage());
        }

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
