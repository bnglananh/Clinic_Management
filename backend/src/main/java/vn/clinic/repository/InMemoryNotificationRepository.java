package vn.clinic.repository;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Repository;
import vn.clinic.model.Notification;
import vn.clinic.model.NotificationType;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class InMemoryNotificationRepository implements NotificationRepository {

    private final Map<String, Notification> storage = new ConcurrentHashMap<>();

    @PostConstruct
    public void initMockData() {
        // Seed initial notifications for usr-pat-01 (Phạm Văn An)
        save(Notification.builder()
                .id("NOTIF-01")
                .userId("usr-pat-01")
                .title("Nhắc nhở: Lịch hẹn khám sắp diễn ra")
                .content("Quý khách có lịch hẹn khám Chuyên khoa Tim mạch vào lúc 08:30 ngày mai (07/10/2026) tại Phòng khám 101 với TS.BS Trần Minh Hoàng. Vui lòng có mặt trước 15 phút.")
                .type(NotificationType.APPOINTMENT)
                .referenceId("APT-2026-1001")
                .channel("IN_APP")
                .isRead(false)
                .createdAt("2026-10-06 14:00")
                .build());

        save(Notification.builder()
                .id("NOTIF-02")
                .userId("usr-pat-01")
                .title("Đã có kết quả xét nghiệm cận lâm sàng")
                .content("Kết quả Xét nghiệm Tổng phân tích tế bào máu (CBC) và Điện tâm đồ (ECG) của bạn đã có kết quả. Bạn có thể tra cứu chi tiết tại mục 'Hồ sơ sức khỏe'.")
                .type(NotificationType.MEDICAL_RECORD)
                .referenceId("LAB-2026-045")
                .channel("IN_APP")
                .isRead(false)
                .createdAt("2026-10-06 11:30")
                .build());

        save(Notification.builder()
                .id("NOTIF-03")
                .userId("usr-pat-01")
                .title("Xác nhận thanh toán viện phí thành công")
                .content("Hóa đơn viện phí #HD-2026-089 với số tiền 350.000 VNĐ đã được thanh toán thành công qua chuyển khoản QR Napas247. Cảm ơn quý khách.")
                .type(NotificationType.BILLING)
                .referenceId("INV-2026-089")
                .channel("IN_APP")
                .isRead(true)
                .readAt("2026-10-06 10:45")
                .createdAt("2026-10-06 10:15")
                .build());

        save(Notification.builder()
                .id("NOTIF-04")
                .userId("usr-pat-01")
                .title("Cập nhật tiến trình số thứ tự hàng đợi")
                .content("Số thứ tự STT-015 của bạn tại Phòng khám Nội 101 hiện chỉ còn 2 lượt nữa là đến lượt khám. Xin vui lòng di chuyển đến sảnh chờ trước phòng khám.")
                .type(NotificationType.QUEUE)
                .referenceId("QUEUE-015")
                .channel("IN_APP")
                .isRead(true)
                .readAt("2026-10-06 09:20")
                .createdAt("2026-10-06 09:05")
                .build());

        save(Notification.builder()
                .id("NOTIF-05")
                .userId("usr-pat-01")
                .title("Chào mừng đến với Hệ thống Y tế SmartClinic")
                .content("Tài khoản của bạn đã được nâng hạng thành Bệnh nhân thân thiết (Hạng Vàng). Tận hưởng các quyền lợi ưu tiên đặt hẹn và hỗ trợ chăm sóc y tế toàn diện.")
                .type(NotificationType.SYSTEM)
                .referenceId("SYS-WELCOME")
                .channel("IN_APP")
                .isRead(true)
                .readAt("2026-10-05 18:00")
                .createdAt("2026-10-05 08:00")
                .build());
    }

    @Override
    public List<Notification> findByUserId(String userId) {
        if (userId == null) return Collections.emptyList();
        return storage.values().stream()
                .filter(n -> userId.equals(n.getUserId()))
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Notification> findByUserIdAndIsRead(String userId, boolean isRead) {
        if (userId == null) return Collections.emptyList();
        return storage.values().stream()
                .filter(n -> userId.equals(n.getUserId()) && n.isRead() == isRead)
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Notification> findByUserIdAndType(String userId, NotificationType type) {
        if (userId == null) return Collections.emptyList();
        return storage.values().stream()
                .filter(n -> userId.equals(n.getUserId()) && (type == null || n.getType() == type))
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .collect(Collectors.toList());
    }

    @Override
    public long countUnreadByUserId(String userId) {
        if (userId == null) return 0;
        return storage.values().stream()
                .filter(n -> userId.equals(n.getUserId()) && !n.isRead())
                .count();
    }

    @Override
    public Optional<Notification> findById(String id) {
        return Optional.ofNullable(storage.get(id));
    }

    @Override
    public Notification save(Notification notification) {
        if (notification.getId() == null || notification.getId().isBlank()) {
            int nextIndex = storage.size() + 1;
            String newId = String.format("NOTIF-%02d", nextIndex);
            while (storage.containsKey(newId)) {
                nextIndex++;
                newId = String.format("NOTIF-%02d", nextIndex);
            }
            notification.setId(newId);
        }
        storage.put(notification.getId(), notification);
        return notification;
    }

    @Override
    public void markAsRead(String id, String readAt) {
        Notification notification = storage.get(id);
        if (notification != null) {
            notification.setRead(true);
            notification.setReadAt(readAt);
        }
    }

    @Override
    public void markAllAsRead(String userId, String readAt) {
        if (userId == null) return;
        storage.values().stream()
                .filter(n -> userId.equals(n.getUserId()) && !n.isRead())
                .forEach(n -> {
                    n.setRead(true);
                    n.setReadAt(readAt);
                });
    }

    @Override
    public void deleteById(String id) {
        storage.remove(id);
    }
}
