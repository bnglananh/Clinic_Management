package vn.clinic;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import vn.clinic.dto.NotificationDto;
import vn.clinic.dto.NotificationSummaryDto;
import vn.clinic.dto.SendNotificationRequest;
import vn.clinic.model.NotificationType;
import vn.clinic.repository.InMemoryNotificationRepository;
import vn.clinic.service.NotificationService;
import vn.clinic.service.NotificationServiceImpl;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("UC08: Nhận thông báo Tests")
class NotificationServiceTest {

    private InMemoryNotificationRepository repository;
    private NotificationService service;

    @BeforeEach
    void setUp() {
        repository = new InMemoryNotificationRepository();
        repository.initMockData();
        service = new NotificationServiceImpl(repository);
    }

    @Test
    @DisplayName("UC08 - Bước 4: Lấy danh sách thông báo và tóm tắt chưa đọc thành công")
    void testGetNotificationsAndSummary() {
        NotificationSummaryDto summary = service.getNotificationSummary("usr-pat-01");
        assertNotNull(summary);
        assertEquals(5, summary.getTotal(), "Tổng số thông báo ban đầu phải là 5");
        assertEquals(2, summary.getUnreadCount(), "Phải có đúng 2 thông báo chưa đọc");

        List<NotificationDto> unreadOnly = service.getNotifications("usr-pat-01", false, null);
        assertEquals(2, unreadOnly.size());

        List<NotificationDto> appointments = service.getNotifications("usr-pat-01", null, NotificationType.APPOINTMENT);
        assertEquals(1, appointments.size());
        assertEquals(NotificationType.APPOINTMENT, appointments.get(0).getType());
    }

    @Test
    @DisplayName("UC08 - Bước 5: Đánh dấu một thông báo là đã đọc")
    void testMarkAsRead() {
        // NOTIF-01 đang là unread (false)
        NotificationDto updated = service.markAsRead("NOTIF-01", "usr-pat-01");
        assertTrue(updated.isRead());
        assertNotNull(updated.getReadAt());

        // Kiểm tra lại số lượng chưa đọc còn 1
        NotificationSummaryDto summary = service.getNotificationSummary("usr-pat-01");
        assertEquals(1, summary.getUnreadCount());
    }

    @Test
    @DisplayName("UC08 - Đánh dấu tất cả thông báo là đã đọc")
    void testMarkAllAsRead() {
        service.markAllAsRead("usr-pat-01");

        NotificationSummaryDto summary = service.getNotificationSummary("usr-pat-01");
        assertEquals(0, summary.getUnreadCount(), "Tất cả thông báo phải được đánh dấu đã đọc");
    }

    @Test
    @DisplayName("UC08 - Bước 1 & 2: Hệ thống phát sinh sự kiện và gửi thông báo mới")
    void testSendNotification() {
        SendNotificationRequest req = SendNotificationRequest.builder()
                .userId("usr-pat-01")
                .title("Thông báo khám khẩn cấp")
                .content("Bác sĩ yêu cầu tái khám sớm.")
                .type(NotificationType.MEDICAL_RECORD)
                .referenceId("EMERGENCY-01")
                .build();

        NotificationDto sent = service.sendNotification(req);
        assertNotNull(sent.getId());
        assertEquals("Thông báo khám khẩn cấp", sent.getTitle());
        assertFalse(sent.isRead());

        NotificationSummaryDto summary = service.getNotificationSummary("usr-pat-01");
        assertEquals(6, summary.getTotal());
        assertEquals(3, summary.getUnreadCount());
    }

    @Test
    @DisplayName("UC08: Xóa thông báo thành công")
    void testDeleteNotification() {
        service.deleteNotification("NOTIF-05", "usr-pat-01");
        NotificationSummaryDto summary = service.getNotificationSummary("usr-pat-01");
        assertEquals(4, summary.getTotal());
    }
}
