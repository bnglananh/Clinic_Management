package vn.clinic.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.clinic.model.ScheduleStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateScheduleRequest {

    @NotBlank(message = "Phòng khám / Buồng trực không được để trống")
    private String roomName;

    private String specialty;

    private ScheduleStatus status; // CONFIRMED or LEAVE

    @Min(value = 1, message = "Số lượng bệnh nhân tối đa phải lớn hơn 0")
    private int maxPatients;
}
