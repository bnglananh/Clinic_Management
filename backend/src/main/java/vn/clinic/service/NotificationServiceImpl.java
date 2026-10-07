package vn.clinic.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.clinic.dto.NotificationDto;
import vn.clinic.dto.NotificationSummaryDto;
import vn.clinic.dto.SendNotificationRequest;
import vn.clinic.exception.ResourceNotFoundException;
import vn.clinic.model.Notification;
import vn.clinic.model.NotificationType;
import vn.clinic.repository.NotificationRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    @Override
    public List<NotificationDto> getNotifications(String userId, Boolean isRead, NotificationType type) {
        String resolvedId = (userId == null || userId.isBlank()) ? "usr-pat-01" : userId;
        List<Notification> list;

        if (isRead != null) {
            list = notificationRepository.findByUserIdAndIsRead(resolvedId, isRead);
        } else if (type != null) {
            list = notificationRepository.findByUserIdAndType(resolvedId, type);
        } else {
            list = notificationRepository.findByUserId(resolvedId);
        }

        return list.stream()
                .map(NotificationDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public NotificationSummaryDto getNotificationSummary(String userId) {
        String resolvedId = (userId == null || userId.isBlank()) ? "usr-pat-01" : userId;
        List<Notification> all = notificationRepository.findByUserId(resolvedId);
        long unread = notificationRepository.countUnreadByUserId(resolvedId);

        List<NotificationDto> dtos = all.stream()
                .map(NotificationDto::fromEntity)
                .collect(Collectors.toList());

        return NotificationSummaryDto.builder()
                .total(all.size())
                .unreadCount(unread)
                .notifications(dtos)
                .build();
    }

    @Override
    public NotificationDto markAsRead(String id, String userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo: " + id));

        String now = LocalDateTime.now().format(FORMATTER);
        notificationRepository.markAsRead(id, now);
        notification.setRead(true);
        notification.setReadAt(now);

        log.info("Notification {} marked as read at {}", id, now);
        return NotificationDto.fromEntity(notification);
    }

    @Override
    public void markAllAsRead(String userId) {
        String resolvedId = (userId == null || userId.isBlank()) ? "usr-pat-01" : userId;
        String now = LocalDateTime.now().format(FORMATTER);
        notificationRepository.markAllAsRead(resolvedId, now);
        log.info("All notifications for user {} marked as read", resolvedId);
    }

    @Override
    public NotificationDto sendNotification(SendNotificationRequest request) {
        String now = LocalDateTime.now().format(FORMATTER);
        Notification notification = Notification.builder()
                .userId(request.getUserId())
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .type(request.getType())
                .referenceId(request.getReferenceId())
                .channel(request.getChannel() != null ? request.getChannel() : "IN_APP")
                .isRead(false)
                .createdAt(now)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Dispatched notification id={} to user={}", saved.getId(), saved.getUserId());
        return NotificationDto.fromEntity(saved);
    }

    @Override
    public void deleteNotification(String id, String userId) {
        notificationRepository.deleteById(id);
        log.info("Deleted notification {}", id);
    }
}
