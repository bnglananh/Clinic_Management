package vn.clinic.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorSchedule {
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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
