package vn.clinic.model;

public enum QueueStatus {
    WAITING,       // Chờ khám
    IN_PROGRESS,   // Đang khám
    COMPLETED,     // Đã khám xong
    SKIPPED        // Đã qua lượt (gọi không có mặt)
}
