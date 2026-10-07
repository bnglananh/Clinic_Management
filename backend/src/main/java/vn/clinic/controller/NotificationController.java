package vn.clinic.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.clinic.dto.ApiResponse;
import vn.clinic.dto.NotificationDto;
import vn.clinic.dto.NotificationSummaryDto;
import vn.clinic.dto.SendNotificationRequest;
import vn.clinic.model.NotificationType;
import vn.clinic.service.NotificationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * UC08 - Bước 4: Lấy danh sách thông báo của người dùng
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getNotifications(
            @RequestParam(required = false, defaultValue = "usr-pat-01") String userId,
            @RequestParam(required = false) Boolean isRead,
            @RequestParam(required = false) NotificationType type) {
        List<NotificationDto> notifications = notificationService.getNotifications(userId, isRead, type);
        return ResponseEntity.ok(ApiResponse.success(notifications, "Lấy danh sách thông báo thành công"));
    }

    /**
     * UC08: Tóm tắt thông báo và số lượng chưa đọc (phục vụ hiển thị badge chuông)
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<NotificationSummaryDto>> getNotificationSummary(
            @RequestParam(required = false, defaultValue = "usr-pat-01") String userId) {
        NotificationSummaryDto summary = notificationService.getNotificationSummary(userId);
        return ResponseEntity.ok(ApiResponse.success(summary, "Lấy tóm tắt thông báo thành công"));
    }

    /**
     * UC08: Lấy số lượng thông báo chưa đọc
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @RequestParam(required = false, defaultValue = "usr-pat-01") String userId) {
        NotificationSummaryDto summary = notificationService.getNotificationSummary(userId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("unreadCount", summary.getUnreadCount()), "Lấy số lượng thông báo chưa đọc"));
    }

    /**
     * UC08 - Bước 5: Ghi nhận trạng thái đã xem (đánh dấu 1 thông báo là đã đọc)
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationDto>> markAsRead(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "usr-pat-01") String userId) {
        NotificationDto updated = notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(ApiResponse.success(updated, "Đánh dấu thông báo đã đọc thành công"));
    }

    /**
     * UC08: Đánh dấu tất cả thông báo là đã đọc
     */
    @PatchMapping("/mark-all-read")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @RequestParam(required = false, defaultValue = "usr-pat-01") String userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã đánh dấu tất cả thông báo là đã đọc"));
    }

    /**
     * UC08 - Bước 1 & 2: Hệ thống phát sinh và gửi thông báo mới
     */
    @PostMapping
    public ResponseEntity<ApiResponse<NotificationDto>> sendNotification(
            @Valid @RequestBody SendNotificationRequest request) {
        NotificationDto created = notificationService.sendNotification(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Gửi thông báo thành công"));
    }

    /**
     * UC08: Xóa thông báo khỏi danh sách
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "usr-pat-01") String userId) {
        notificationService.deleteNotification(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa thông báo thành công"));
    }
}
