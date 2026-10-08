package vn.clinic.model;

public enum PriorityLevel {
    NORMAL,        // Bình thường
    PRIORITY,      // Ưu tiên (Người già > 75t, trẻ em < 6t, phụ nữ mang thai)
    EMERGENCY      // Cấp cứu / Khẩn cấp (đẩy ngay lên đầu hàng đợi)
}
