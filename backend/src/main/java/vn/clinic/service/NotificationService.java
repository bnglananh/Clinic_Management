package vn.clinic.service;

import vn.clinic.dto.NotificationDto;
import vn.clinic.dto.NotificationSummaryDto;
import vn.clinic.dto.SendNotificationRequest;
import vn.clinic.model.NotificationType;

import java.util.List;

public interface NotificationService {

    List<NotificationDto> getNotifications(String userId, Boolean isRead, NotificationType type);

    NotificationSummaryDto getNotificationSummary(String userId);

    NotificationDto markAsRead(String id, String userId);

    void markAllAsRead(String userId);

    NotificationDto sendNotification(SendNotificationRequest request);

    void deleteNotification(String id, String userId);
}
