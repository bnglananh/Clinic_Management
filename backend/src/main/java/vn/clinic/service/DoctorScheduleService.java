package vn.clinic.service;

import vn.clinic.dto.*;
import vn.clinic.model.WorkShift;

import java.time.LocalDate;
import java.util.List;

public interface DoctorScheduleService {
    List<DoctorScheduleDto> getAllSchedules(LocalDate date, String doctorId, WorkShift shift);
    DoctorScheduleDto getScheduleById(String id);
    DoctorScheduleDto createSchedule(CreateScheduleRequest request);
    DoctorScheduleDto updateSchedule(String id, UpdateScheduleRequest request);
    DoctorScheduleDto toggleScheduleStatus(String id); // CONFIRMED <-> LEAVE
    void deleteSchedule(String id); // SRS UC023: Không được xóa nếu đã có bệnh nhân đặt hẹn (bookedPatients > 0)
}
