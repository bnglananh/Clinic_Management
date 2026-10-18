package vn.clinic.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RescheduleAppointmentRequest {
    @NotBlank(message = "Ngày khám mới không được để trống")
    private String newAppointmentDate;

    @NotBlank(message = "Khung giờ mới không được để trống")
    private String newTimeSlot;

    private String reason;
}
