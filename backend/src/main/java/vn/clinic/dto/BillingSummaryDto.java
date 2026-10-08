package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingSummaryDto {
    private double paidTodayTotal;       // Tổng doanh thu đã thu trong ngày
    private long pendingCount;           // Số lượng hóa đơn đang chờ thanh toán
    private long paidCount;              // Số lượng hóa đơn đã hoàn tất thanh toán
    private double vietQrPercentage;     // Tỷ lệ thanh toán không dùng tiền mặt (VietQR) %
    private double totalOutstanding;     // Tổng số tiền còn phải thu
}
