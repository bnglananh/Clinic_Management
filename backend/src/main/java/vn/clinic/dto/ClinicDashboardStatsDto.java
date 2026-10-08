package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicDashboardStatsDto {
    private double revenueToday;           // Doanh thu hôm nay
    private double revenueTotal;           // Tổng doanh thu lũy kế
    private int visitsToday;               // Tổng lượt khám trong ngày
    private int visitsCompleted;           // Số ca hoàn tất
    private int visitsInProgress;          // Số ca đang khám
    private int visitsWaiting;             // Số ca đang chờ

    private int criticalStockCount;        // Số thuốc có tồn kho <= 10 (BR-22)
    private int lowStockCount;             // Số thuốc có tồn kho <= 30
    private int activeDoctorsCount;        // Số bác sĩ đang trực
    private int totalStaffCount;           // Tổng số nhân sự

    private List<DepartmentPerformanceDto> departments; // Hiệu suất theo chuyên khoa

    private int totalAppointments;         // Tổng số lịch hẹn
    private int confirmedAppointments;     // Số lịch hẹn đã xác nhận
    private int checkedInAppointments;     // Số lịch hẹn đã check-in
    private int cancelledAppointments;     // Số lịch hẹn đã hủy
    private double appointmentCompletionRate; // Tỷ lệ hoàn tất %

    private int totalDrugs;                // Tổng số mặt hàng thuốc trong danh mục
    private double pharmacyInventoryValue; // Tổng giá trị tồn kho thuốc
}
