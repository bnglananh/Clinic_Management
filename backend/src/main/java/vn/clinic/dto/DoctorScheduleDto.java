package vn.clinic.dto;

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
public class DoctorScheduleDto {
    private String id;
    private String doctorId;
    private String doctorName;
    private String specialty;
    private String roomName;
    private LocalDate date;
    private WorkShift shift;
    private ScheduleStatus status;
    private int maxPatients;
    private int bookedPatients;
}
