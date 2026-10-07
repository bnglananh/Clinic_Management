package vn.clinic.model;

public enum StockTransactionType {
    IMPORT,                 // Nhập kho thêm
    EXPORT,                 // Xuất kho (hủy, trả nhà cung cấp)
    ADJUSTMENT,             // Điều chỉnh kiểm kê
    PRESCRIPTION_DISPENSE   // Trừ kho tự động theo đơn thuốc đã thanh toán (BR-19)
}
