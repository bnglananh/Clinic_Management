package vn.clinic.repository;

import vn.clinic.model.Notification;
import vn.clinic.model.NotificationType;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository {
    List<Notification> findByUserId(String userId);

    List<Notification> findByUserIdAndIsRead(String userId, boolean isRead);

    List<Notification> findByUserIdAndType(String userId, NotificationType type);

    long countUnreadByUserId(String userId);

    Optional<Notification> findById(String id);

    Notification save(Notification notification);

    void markAsRead(String id, String readAt);

    void markAllAsRead(String userId, String readAt);

    void deleteById(String id);
}
