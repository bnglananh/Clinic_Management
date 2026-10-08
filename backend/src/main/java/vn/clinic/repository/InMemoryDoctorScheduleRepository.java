package vn.clinic.repository;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Repository;
import vn.clinic.model.DoctorSchedule;
import vn.clinic.model.ScheduleStatus;
import vn.clinic.model.WorkShift;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class InMemoryDoctorScheduleRepository implements DoctorScheduleRepository {

    private final Map<String, DoctorSchedule> scheduleStore = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        LocalDate baseDate = LocalDate.now();

        save(DoctorSchedule.builder()
                .id("SCH-01")
                .doctorId("STAFF-01")
                .doctorName("TS.BS Trần Minh Hoàng")
                .specialty("Tim Mạch")
                .roomName("Phòng khám Nội 101")
                .date(baseDate)
                .shift(WorkShift.MORNING)
                .status(ScheduleStatus.CONFIRMED)
                .maxPatients(25)
                .bookedPatients(18)
                .createdAt(LocalDateTime.now().minusDays(5))
                .updatedAt(LocalDateTime.now().minusDays(1))
                .build());

        save(DoctorSchedule.builder()
                .id("SCH-02")
                .doctorId("STAFF-01")
                .doctorName("TS.BS Trần Minh Hoàng")
                .specialty("Tim Mạch")
                .roomName("Phòng khám Nội 101")
                .date(baseDate)
                .shift(WorkShift.AFTERNOON)
                .status(ScheduleStatus.CONFIRMED)
                .maxPatients(20)
                .bookedPatients(12)
                .createdAt(LocalDateTime.now().minusDays(5))
                .updatedAt(LocalDateTime.now().minusDays(1))
                .build());

        save(DoctorSchedule.builder()
                .id("SCH-03")
                .doctorId("STAFF-02")
                .doctorName("ThS.BS Nguyễn Thị Mai Lan")
                .specialty("Nội Tổng Quát")
                .roomName("Phòng khám Nội 102")
                .date(baseDate)
                .shift(WorkShift.MORNING)
                .status(ScheduleStatus.CONFIRMED)
                .maxPatients(30)
                .bookedPatients(24)
                .createdAt(LocalDateTime.now().minusDays(5))
                .updatedAt(LocalDateTime.now().minusDays(1))
                .build());

        save(DoctorSchedule.builder()
                .id("SCH-04")
                .doctorId("STAFF-03")
                .doctorName("BS.CKI Lê Quốc Hưng")
                .specialty("Tiêu Hóa")
                .roomName("Phòng khám Nội 103")
                .date(baseDate)
                .shift(WorkShift.MORNING)
                .status(ScheduleStatus.CONFIRMED)
                .maxPatients(20)
                .bookedPatients(16)
                .createdAt(LocalDateTime.now().minusDays(5))
                .updatedAt(LocalDateTime.now().minusDays(1))
                .build());

        save(DoctorSchedule.builder()
                .id("SCH-05")
                .doctorId("STAFF-02")
                .doctorName("ThS.BS Nguyễn Thị Mai Lan")
                .specialty("Nội Tổng Quát")
                .roomName("Phòng khám Nội 102")
                .date(baseDate.plusDays(1))
                .shift(WorkShift.MORNING)
                .status(ScheduleStatus.CONFIRMED)
                .maxPatients(30)
                .bookedPatients(15)
                .createdAt(LocalDateTime.now().minusDays(5))
                .updatedAt(LocalDateTime.now().minusDays(1))
                .build());

        save(DoctorSchedule.builder()
                .id("SCH-06")
                .doctorId("STAFF-03")
                .doctorName("BS.CKI Lê Quốc Hưng")
                .specialty("Tiêu Hóa")
                .roomName("Phòng khám Nội 103")
                .date(baseDate.plusDays(1))
                .shift(WorkShift.MORNING)
                .status(ScheduleStatus.LEAVE)
                .maxPatients(0)
                .bookedPatients(0)
                .createdAt(LocalDateTime.now().minusDays(5))
                .updatedAt(LocalDateTime.now().minusDays(1))
                .build());
    }

    @Override
    public List<DoctorSchedule> findAll() {
        return scheduleStore.values().stream()
                .sorted(Comparator.comparing(DoctorSchedule::getDate)
                        .thenComparing(DoctorSchedule::getShift)
                        .thenComparing(DoctorSchedule::getDoctorName))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<DoctorSchedule> findById(String id) {
        return Optional.ofNullable(scheduleStore.get(id));
    }

    @Override
    public List<DoctorSchedule> findByDate(LocalDate date) {
        return scheduleStore.values().stream()
                .filter(s -> s.getDate().equals(date))
                .sorted(Comparator.comparing(DoctorSchedule::getShift))
                .collect(Collectors.toList());
    }

    @Override
    public List<DoctorSchedule> findByDoctorId(String doctorId) {
        return scheduleStore.values().stream()
                .filter(s -> s.getDoctorId().equals(doctorId))
                .sorted(Comparator.comparing(DoctorSchedule::getDate).thenComparing(DoctorSchedule::getShift))
                .collect(Collectors.toList());
    }

    @Override
    public List<DoctorSchedule> findByDoctorAndDate(String doctorId, LocalDate date) {
        return scheduleStore.values().stream()
                .filter(s -> s.getDoctorId().equals(doctorId) && s.getDate().equals(date))
                .sorted(Comparator.comparing(DoctorSchedule::getShift))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<DoctorSchedule> findByDoctorDateAndShift(String doctorId, LocalDate date, WorkShift shift) {
        return scheduleStore.values().stream()
                .filter(s -> s.getDoctorId().equals(doctorId) && s.getDate().equals(date) && s.getShift() == shift)
                .findFirst();
    }

    @Override
    public Optional<DoctorSchedule> findByRoomDateAndShift(String roomName, LocalDate date, WorkShift shift) {
        return scheduleStore.values().stream()
                .filter(s -> s.getRoomName().equalsIgnoreCase(roomName.trim()) && s.getDate().equals(date) && s.getShift() == shift)
                .findFirst();
    }

    @Override
    public DoctorSchedule save(DoctorSchedule schedule) {
        if (schedule.getId() == null || schedule.getId().isBlank()) {
            int nextId = scheduleStore.size() + 1;
            schedule.setId(String.format("SCH-%02d", nextId));
        }
        if (schedule.getCreatedAt() == null) {
            schedule.setCreatedAt(LocalDateTime.now());
        }
        schedule.setUpdatedAt(LocalDateTime.now());
        scheduleStore.put(schedule.getId(), schedule);
        return schedule;
    }

    @Override
    public boolean deleteById(String id) {
        return scheduleStore.remove(id) != null;
    }

    @Override
    public List<DoctorSchedule> search(LocalDate date, String doctorId, WorkShift shift) {
        return scheduleStore.values().stream()
                .filter(s -> {
                    boolean matchDate = (date == null) || s.getDate().equals(date);
                    boolean matchDoctor = (doctorId == null || doctorId.isBlank()) || s.getDoctorId().equals(doctorId);
                    boolean matchShift = (shift == null) || s.getShift() == shift;
                    return matchDate && matchDoctor && matchShift;
                })
                .sorted(Comparator.comparing(DoctorSchedule::getDate)
                        .thenComparing(DoctorSchedule::getShift)
                        .thenComparing(DoctorSchedule::getDoctorName))
                .collect(Collectors.toList());
    }
}
