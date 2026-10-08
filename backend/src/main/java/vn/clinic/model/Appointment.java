package vn.clinic.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {
    private String id;                 // Mã định danh nội bộ (vd: "apt-01", "apt-1712345678")
    private String appointmentCode;    // Mã hiển thị (vd: "LH-2026-0158")
    private String patientId;          // ID hồ sơ bệnh nhân
    private String patientCode;        // Mã bệnh nhân (vd: "BN-2026-0891")
    private String patientName;        // Họ và tên bệnh nhân
    private String phone;              // Số điện thoại liên hệ
    private String department;         // Chuyên khoa (Khoa Tim Mạch, Khoa Nội, ...)
    private String doctorId;           // Mã bác sĩ
    private String doctorName;         // Tên bác sĩ
    private String appointmentDate;    // Ngày hẹn (YYYY-MM-DD)
    private String timeSlot;           // Khung giờ (vd: "08:00 - 08:30")
    private String reasonForVisit;     // Lý do khám / Triệu chứng ban đầu
    private AppointmentStatus status;  // PENDING, CONFIRMED, CHECKED_IN, CANCELLED
    private String createdAt;          // Thời gian tạo lịch hẹn (ISO)
    private String notes;              // Ghi chú thêm
    private String cancelReason;       // Lý do hủy hẹn (nếu status = CANCELLED)
}
