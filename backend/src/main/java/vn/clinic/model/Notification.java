package vn.clinic.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    private String id;
    private String userId;           // Mã người nhận (vd: "usr-pat-01")
    private String title;            // Tiêu đề thông báo
    private String content;          // Nội dung chi tiết thông báo
    private NotificationType type;   // APPOINTMENT, QUEUE, MEDICAL_RECORD, BILLING, SYSTEM
    private String referenceId;      // Mã lịch hẹn / mã kết quả / mã hóa đơn liên quan
    private String channel;          // IN_APP, SMS, EMAIL
    private boolean isRead;          // Đã đọc hay chưa
    private String readAt;           // Thời điểm đã đọc
    private String createdAt;        // Thời điểm gửi thông báo
}
