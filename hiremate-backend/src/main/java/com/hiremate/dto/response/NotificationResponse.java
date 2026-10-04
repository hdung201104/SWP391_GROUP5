package com.hiremate.dto.response;

import com.hiremate.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private Long notificationId;
    private Long userId;
    private NotificationType type;
    private String title;
    private String body;
    private Long refId;
    private String refTable;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
