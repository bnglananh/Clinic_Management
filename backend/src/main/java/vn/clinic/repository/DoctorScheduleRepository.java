package vn.clinic.repository;

import vn.clinic.model.DoctorSchedule;
import vn.clinic.model.WorkShift;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DoctorScheduleRepository {
    List<DoctorSchedule> findAll();
    Optional<DoctorSchedule> findById(String id);
    List<DoctorSchedule> findByDate(LocalDate date);
    List<DoctorSchedule> findByDoctorId(String doctorId);
    List<DoctorSchedule> findByDoctorAndDate(String doctorId, LocalDate date);
    Optional<DoctorSchedule> findByDoctorDateAndShift(String doctorId, LocalDate date, WorkShift shift);
    Optional<DoctorSchedule> findByRoomDateAndShift(String roomName, LocalDate date, WorkShift shift);
    DoctorSchedule save(DoctorSchedule schedule);
    boolean deleteById(String id);
    List<DoctorSchedule> search(LocalDate date, String doctorId, WorkShift shift);
}
