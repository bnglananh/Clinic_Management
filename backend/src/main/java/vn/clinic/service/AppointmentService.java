package vn.clinic.service;

import vn.clinic.dto.AppointmentDto;
import vn.clinic.dto.CancelAppointmentRequest;
import vn.clinic.dto.CreateAppointmentRequest;
import vn.clinic.dto.LeaderboardEntryDto;
import vn.clinic.dto.RescheduleAppointmentRequest;
import vn.clinic.dto.SlotLockDto;
import vn.clinic.dto.SlotLockRequest;
import vn.clinic.model.AppointmentStatus;

import java.util.List;

public interface AppointmentService {
    List<AppointmentDto> getAppointments(String date, String doctorId, AppointmentStatus status, String patientId, String query);
    AppointmentDto getAppointmentById(String id);
    AppointmentDto getAppointmentByCode(String code);
    List<AppointmentDto> getAppointmentsByPatientId(String patientId);
    AppointmentDto createAppointment(CreateAppointmentRequest request);
    AppointmentDto rescheduleAppointment(String id, RescheduleAppointmentRequest request);
    AppointmentDto cancelAppointment(String id, CancelAppointmentRequest request);

    /** Giữ chỗ khung giờ trong 10 phút (Redis SET NX EX) để bệnh nhân hoàn tất đặt lịch. */
    SlotLockDto lockSlot(SlotLockRequest request);

    void releaseSlot(SlotLockRequest request);

    /** Bảng xếp hạng bác sĩ theo số lịch hẹn trong tháng (Redis Sorted Set). */
    List<LeaderboardEntryDto> getDoctorLeaderboard(String yearMonth, int limit);
}
