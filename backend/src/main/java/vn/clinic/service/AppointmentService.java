package vn.clinic.service;

import vn.clinic.dto.AppointmentDto;
import vn.clinic.dto.CancelAppointmentRequest;
import vn.clinic.dto.CreateAppointmentRequest;
import vn.clinic.dto.RescheduleAppointmentRequest;
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
}
