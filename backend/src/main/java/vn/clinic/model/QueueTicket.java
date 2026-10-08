package vn.clinic.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueueTicket {
    private String id;                 // Mã vé nội bộ (vd: "q-001", "q-1712345678")
    private String ticketNumber;       // Số thứ tự phiếu khám (vd: "A-012", "B-005")
    private String patientId;          // ID bệnh nhân
    private String patientCode;        // Mã bệnh nhân (vd: "BN-2026-0891")
    private String patientName;        // Họ và tên bệnh nhân
    private String gender;             // Giới tính ("NAM", "NU", "KHAC")
    private Integer yearOfBirth;       // Năm sinh
    private String phone;              // Số điện thoại
    private QueueStatus status;        // WAITING, IN_PROGRESS, COMPLETED, SKIPPED
    private PriorityLevel priority;    // NORMAL, PRIORITY, EMERGENCY
    private String roomName;           // Buồng khám (vd: "Phòng Khám Nội 101")
    private String doctorId;           // Mã bác sĩ
    private String doctorName;         // Tên bác sĩ phụ trách
    private String estimatedTime;      // Giờ dự kiến khám (vd: "08:50")
    private String checkinTime;        // Dấu thời gian tiếp nhận (ISO)
    private String notes;              // Ghi chú tiếp nhận điều phối
    private String appointmentId;      // Mã lịch hẹn gốc (nếu check-in từ lịch hẹn)
}
