package vn.clinic.repository;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Repository;
import vn.clinic.model.Appointment;
import vn.clinic.model.AppointmentStatus;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class InMemoryAppointmentRepository implements AppointmentRepository {

    private final Map<String, Appointment> storage = new ConcurrentHashMap<>();

    @PostConstruct
    public void initMockData() {
        // Mock appointments matching frontend reception-mock-data.ts
        save(Appointment.builder()
                .id("apt-01")
                .appointmentCode("LH-2026-0158")
                .patientId("p-001")
                .patientCode("BN-2026-0891")
                .patientName("Nguyễn Văn Hùng")
                .phone("0903881234")
                .department("Khoa Tim Mạch")
                .doctorId("usr-doc-01")
                .doctorName("TS.BS Trần Minh Hoàng")
                .appointmentDate("2026-10-05")
                .timeSlot("08:00 - 08:30")
                .reasonForVisit("Tái khám tăng huyết áp và đau thắt ngực nhẹ")
                .status(AppointmentStatus.CHECKED_IN)
                .createdAt("2026-10-02T10:00:00Z")
                .build());

        save(Appointment.builder()
                .id("apt-02")
                .appointmentCode("LH-2026-0159")
                .patientId("p-002")
                .patientCode("BN-2026-0892")
                .patientName("Lê Thị Thu Thảo")
                .phone("0918334556")
                .department("Khoa Nội Tổng Quát")
                .doctorId("usr-doc-01")
                .doctorName("TS.BS Trần Minh Hoàng")
                .appointmentDate("2026-10-05")
                .timeSlot("08:30 - 09:00")
                .reasonForVisit("Khám định kỳ sức khỏe tổng quát")
                .status(AppointmentStatus.CHECKED_IN)
                .createdAt("2026-10-03T14:30:00Z")
                .build());

        save(Appointment.builder()
                .id("apt-03")
                .appointmentCode("LH-2026-0160")
                .patientId("p-004")
                .patientCode("BN-2026-0885")
                .patientName("Đặng Kim Chi")
                .phone("0977445678")
                .department("Khoa Tim Mạch")
                .doctorId("usr-doc-01")
                .doctorName("TS.BS Trần Minh Hoàng")
                .appointmentDate("2026-10-05")
                .timeSlot("09:00 - 09:30")
                .reasonForVisit("Hồi hộp, đánh trống ngực khi làm việc căng thẳng")
                .status(AppointmentStatus.CONFIRMED)
                .createdAt("2026-10-04T09:00:00Z")
                .build());

        save(Appointment.builder()
                .id("apt-04")
                .appointmentCode("LH-2026-0161")
                .patientId("p-005")
                .patientCode("BN-2026-0900")
                .patientName("Vũ Đức Thịnh")
                .phone("0933667889")
                .department("Khoa Tai Mũi Họng")
                .doctorId("usr-doc-02")
                .doctorName("ThS.BS Vũ Hải Đăng")
                .appointmentDate("2026-10-05")
                .timeSlot("09:30 - 10:00")
                .reasonForVisit("Viêm họng hạt, sốt nhẹ 2 ngày")
                .status(AppointmentStatus.CONFIRMED)
                .createdAt("2026-10-04T15:20:00Z")
                .build());

        save(Appointment.builder()
                .id("apt-05")
                .appointmentCode("LH-2026-0162")
                .patientId("p-006")
                .patientCode("BN-2026-0905")
                .patientName("Phạm Thị Mỹ Linh")
                .phone("0909554332")
                .department("Khoa Nội Tiêu Hóa")
                .doctorId("usr-doc-03")
                .doctorName("BSCKII Nguyễn Hoàng Long")
                .appointmentDate("2026-10-05")
                .timeSlot("10:00 - 10:30")
                .reasonForVisit("Đau thượng vị âm ỉ, ợ chua sau khi ăn")
                .status(AppointmentStatus.CONFIRMED)
                .createdAt("2026-10-05T07:10:00Z")
                .build());
    }

    @Override
    public List<Appointment> findAll() {
        return storage.values().stream()
                .sorted(Comparator.comparing(Appointment::getAppointmentDate).reversed())
                .toList();
    }

    @Override
    public Optional<Appointment> findById(String id) {
        if (id == null) return Optional.empty();
        return Optional.ofNullable(storage.get(id));
    }

    @Override
    public Optional<Appointment> findByAppointmentCode(String appointmentCode) {
        if (appointmentCode == null) return Optional.empty();
        return storage.values().stream()
                .filter(a -> appointmentCode.equalsIgnoreCase(a.getAppointmentCode()))
                .findFirst();
    }

    @Override
    public List<Appointment> findByPatientId(String patientId) {
        if (patientId == null) return List.of();
        return storage.values().stream()
                .filter(a -> patientId.equals(a.getPatientId()))
                .sorted(Comparator.comparing(Appointment::getAppointmentDate).reversed())
                .toList();
    }

    @Override
    public List<Appointment> findByDoctorId(String doctorId) {
        if (doctorId == null) return List.of();
        return storage.values().stream()
                .filter(a -> doctorId.equals(a.getDoctorId()))
                .toList();
    }

    @Override
    public List<Appointment> search(String date, String doctorId, AppointmentStatus status, String patientId, String query) {
        return storage.values().stream()
                .filter(a -> date == null || date.isBlank() || date.equals(a.getAppointmentDate()))
                .filter(a -> doctorId == null || doctorId.isBlank() || doctorId.equals(a.getDoctorId()))
                .filter(a -> status == null || status == a.getStatus())
                .filter(a -> patientId == null || patientId.isBlank() || patientId.equals(a.getPatientId()))
                .filter(a -> {
                    if (query == null || query.isBlank()) return true;
                    String q = query.trim().toLowerCase();
                    return (a.getPatientName() != null && a.getPatientName().toLowerCase().contains(q))
                            || (a.getPhone() != null && a.getPhone().contains(q))
                            || (a.getAppointmentCode() != null && a.getAppointmentCode().toLowerCase().contains(q))
                            || (a.getPatientCode() != null && a.getPatientCode().toLowerCase().contains(q));
                })
                .sorted(Comparator.comparing(Appointment::getAppointmentDate).reversed())
                .toList();
    }

    @Override
    public boolean existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(
            String doctorId, String date, String timeSlot, AppointmentStatus excludedStatus) {
        return storage.values().stream()
                .anyMatch(a -> a.getDoctorId() != null
                        && a.getDoctorId().equals(doctorId)
                        && a.getAppointmentDate() != null
                        && a.getAppointmentDate().equals(date)
                        && a.getTimeSlot() != null
                        && a.getTimeSlot().equalsIgnoreCase(timeSlot)
                        && (excludedStatus == null || a.getStatus() != excludedStatus));
    }

    @Override
    public Appointment save(Appointment appointment) {
        if (appointment.getId() == null || appointment.getId().isBlank()) {
            appointment.setId("apt-" + System.currentTimeMillis());
        }
        storage.put(appointment.getId(), appointment);
        return appointment;
    }

    @Override
    public long count() {
        return storage.size();
    }
}
