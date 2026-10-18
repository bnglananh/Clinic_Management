package vn.clinic.model;

public enum QueueStatus {
    WAITING,          // Chờ khám
    IN_PROGRESS,      // Đang khám
    WAITING_RESULTS,  // Chờ kết quả cận lâm sàng (xét nghiệm, chẩn đoán hình ảnh)
    RESULTS_READY,    // Đã có đầy đủ kết quả CLS, sẵn sàng gọi lại vào phòng
    COMPLETED,        // Đã khám xong
    SKIPPED           // Đã qua lượt (gọi không có mặt)
}
