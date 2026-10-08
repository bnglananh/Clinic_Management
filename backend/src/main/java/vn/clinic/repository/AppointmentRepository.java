package vn.clinic.repository;

import vn.clinic.model.Appointment;
import vn.clinic.model.AppointmentStatus;

import java.util.List;
import java.util.Optional;

public interface AppointmentRepository {
    List<Appointment> findAll();
    Optional<Appointment> findById(String id);
    Optional<Appointment> findByAppointmentCode(String appointmentCode);
    List<Appointment> findByPatientId(String patientId);
    List<Appointment> findByDoctorId(String doctorId);
    List<Appointment> search(String date, String doctorId, AppointmentStatus status, String patientId, String query);
    boolean existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(String doctorId, String date, String timeSlot, AppointmentStatus excludedStatus);
    Appointment save(Appointment appointment);
    long count();
}
