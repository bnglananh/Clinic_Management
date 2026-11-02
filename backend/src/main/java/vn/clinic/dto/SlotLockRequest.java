package vn.clinic.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Yêu cầu giữ chỗ / nhả chỗ một khung giờ khám trong lúc đặt lịch. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlotLockRequest {

    @NotBlank(message = "Mã bác sĩ không được để trống")
    private String doctorId;

    @NotBlank(message = "Ngày khám không được để trống")
    private String appointmentDate;

    @NotBlank(message = "Khung giờ khám không được để trống")
    private String timeSlot;

    /** Người giữ chỗ: mã bệnh nhân, hoặc số điện thoại nếu đặt hộ tại quầy. */
    @NotBlank(message = "Thiếu thông tin người giữ chỗ")
    private String ownerId;
}
