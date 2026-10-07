package vn.clinic.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.clinic.model.ScheduleStatus;
import vn.clinic.model.WorkShift;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateScheduleRequest {

    @NotBlank(message = "ID Bác sĩ không được để trống (SRS UC023)")
    private String doctorId;

    private String doctorName;

    @NotBlank(message = "Chuyên khoa không được để trống")
    private String specialty;

    @NotBlank(message = "Phòng khám / Buồng trực không được để trống")
    private String roomName;

    @NotNull(message = "Ngày làm việc không được để trống (SRS UC023)")
    private LocalDate date;

    @NotNull(message = "Ca làm việc không được để trống (MORNING, AFTERNOON, EVENING)")
    private WorkShift shift;

    @Builder.Default
    private ScheduleStatus status = ScheduleStatus.CONFIRMED;

    @Min(value = 1, message = "Số lượng bệnh nhân tối đa trong ca phải lớn hơn 0")
    @Builder.Default
    private int maxPatients = 25;
}
