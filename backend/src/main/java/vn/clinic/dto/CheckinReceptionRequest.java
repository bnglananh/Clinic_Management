package vn.clinic.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.clinic.model.PriorityLevel;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckinReceptionRequest {
    private String appointmentId;      // Nếu tiếp nhận từ lịch hẹn trước
    private String patientId;          // ID hồ sơ bệnh nhân (nếu đã có)
    private String patientCode;        // Mã bệnh nhân (nếu đã có)

    @NotBlank(message = "Họ tên bệnh nhân không được để trống (SRS UC09)")
    private String patientName;

    @NotBlank(message = "Số điện thoại không được để trống (SRS UC09)")
    private String phone;

    private String gender;             // NAM, NU, KHAC
    private Integer yearOfBirth;

    @NotBlank(message = "Phòng khám phân bổ không được để trống (SRS UC09 BR-08)")
    private String roomName;

    private String doctorId;
    private String doctorName;

    @Builder.Default
    private PriorityLevel priority = PriorityLevel.NORMAL; // NORMAL, PRIORITY, EMERGENCY

    private String notes;
}
