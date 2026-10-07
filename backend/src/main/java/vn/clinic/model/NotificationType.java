package vn.clinic.model;

public enum NotificationType {
    APPOINTMENT("Lịch hẹn khám bệnh"),
    QUEUE("Tiến trình lượt khám & hàng đợi"),
    MEDICAL_RECORD("Kết quả khám & Đơn thuốc"),
    BILLING("Viện phí & Hóa đơn thanh toán"),
    SYSTEM("Thông báo hệ thống & CSKH");

    private final String description;

    NotificationType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
