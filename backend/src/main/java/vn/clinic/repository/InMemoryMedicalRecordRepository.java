package vn.clinic.repository;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Repository;
import vn.clinic.model.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class InMemoryMedicalRecordRepository implements MedicalRecordRepository {

    private final Map<String, MedicalRecord> store = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        // REC-01: Bệnh nhân p-004 (Đặng Kim Chi - BN-2026-0885)
        save(MedicalRecord.builder()
                .id("REC-01")
                .visitCode("EMR-2026-0012")
                .visitId("vis-001")
                .patientId("p-004")
                .patientCode("BN-2026-0885")
                .patientName("Đặng Kim Chi")
                .patientGender("NỮ")
                .patientDob("1989-12-05")
                .department("Khoa Tim Mạch")
                .doctorName("Trần Minh Hoàng")
                .doctorTitle("TS.BS")
                .roomName("Phòng khám Nội 101")
                .visitDate("2026-02-15")
                .chiefComplaint("Đau đầu âm ỉ vùng sau gáy, chóng mặt nhẹ khi thay đổi tư thế.")
                .clinicalSymptoms("Bệnh nhân có triệu chứng căng thẳng, huyết áp dao động, đau nửa đầu nhẹ.")
                .allergies(List.of("Penicillin", "Aspirin"))
                .vitals(VitalSigns.builder()
                        .bloodPressure("142/90 mmHg")
                        .heartRate(84)
                        .temperature(36.7)
                        .weight(69.0)
                        .height(170.0)
                        .bmi(23.9)
                        .spo2(98.0)
                        .build())
                .diagnoses(List.of(
                        new DiagnosisItem("I10", "Tăng huyết áp vô căn (nguyên phát)", true),
                        new DiagnosisItem("E78.2", "Tăng lipid máu hỗn hợp", false)
                ))
                .services(List.of(
                        new ClinicalServiceOrder("CẬN LÂM SÀNG", "Điện tâm đồ vi tính 12 chuyển đạo (ECG)", "Nhịp xoang đều 80ck/p, dày thất trái nhẹ.", 150000.0, "COMPLETED"),
                        new ClinicalServiceOrder("XÉT NGHIỆM", "Bộ mỡ máu toàn phần (Cholesterol, Triglyceride)", "Cholesterol: 6.2 mmol/L (Cao), Triglyceride: 2.8 mmol/L.", 200000.0, "COMPLETED")
                ))
                .prescriptions(List.of(
                        new PrescriptionItem("Amlor (Amlodipine)", "5mg", "1 viên/ngày (uống vào 8h sáng sau ăn)", 30, "Viên", "Uống sau ăn sáng")
                ))
                .doctorAdvice("Uống thuốc đều đặn vào mỗi buổi sáng. Ăn nhạt (<5g muối/ngày), hạn chế mỡ động vật. Đo huyết áp mỗi sáng tại nhà.")
                .followUpDays(30)
                .isLocked(true)
                .version(1)
                .createdAt("2026-02-15T09:30:00Z")
                .updatedAt("2026-02-15T10:15:00Z")
                .build());

        // REC-02: Bệnh nhân p-002 (Lê Thị Thu Thảo - BN-2026-0892)
        save(MedicalRecord.builder()
                .id("REC-02")
                .visitCode("EMR-2026-0008")
                .visitId("vis-002")
                .patientId("p-002")
                .patientCode("BN-2026-0892")
                .patientName("Lê Thị Thu Thảo")
                .patientGender("NỮ")
                .patientDob("1995-10-22")
                .department("Khoa Tiêu Hóa")
                .doctorName("Lê Quốc Hưng")
                .doctorTitle("BS.CKI")
                .roomName("Phòng khám Nội 103")
                .visitDate("2026-01-25")
                .chiefComplaint("Ợ chua nóng rát sau xương ức, đầy bụng khó tiêu sau bữa tối.")
                .clinicalSymptoms("Ợ nóng, trào ngược thực quản khi nằm ngửa.")
                .allergies(Collections.emptyList())
                .vitals(VitalSigns.builder()
                        .bloodPressure("135/85 mmHg")
                        .heartRate(78)
                        .temperature(36.8)
                        .weight(70.0)
                        .height(170.0)
                        .bmi(24.2)
                        .spo2(99.0)
                        .build())
                .diagnoses(List.of(
                        new DiagnosisItem("K21.0", "Bệnh trào ngược dạ dày - thực quản có viêm thực quản", true)
                ))
                .services(List.of(
                        new ClinicalServiceOrder("CHẨN ĐOÁN HÌNH ẢNH", "Siêu âm ổ bụng tổng quát màu Doppler", "Gan nhiễm mỡ độ 1. Không sỏi túi mật.", 300000.0, "COMPLETED")
                ))
                .prescriptions(List.of(
                        new PrescriptionItem("Nexium (Omeprazole)", "20mg", "1 viên/ngày (trước ăn sáng 30 phút)", 14, "Viên", "Uống trước ăn sáng")
                ))
                .doctorAdvice("Không nằm ngay sau khi ăn tối (chờ ít nhất 2 tiếng). Tránh uống cà phê, nước ngọt có ga và đồ chua cay.")
                .followUpDays(14)
                .isLocked(true)
                .version(1)
                .createdAt("2026-01-25T08:45:00Z")
                .updatedAt("2026-01-25T09:20:00Z")
                .build());

        // REC-03: Bệnh nhân p-001 (Nguyễn Văn Hùng - BN-2026-0891)
        save(MedicalRecord.builder()
                .id("REC-03")
                .visitCode("EMR-2026-0002")
                .visitId("vis-003")
                .patientId("p-001")
                .patientCode("BN-2026-0891")
                .patientName("Nguyễn Văn Hùng")
                .patientGender("NAM")
                .patientDob("1982-05-14")
                .department("Khoa Nội Tổng Quát")
                .doctorName("Nguyễn Thị Mai Lan")
                .doctorTitle("ThS.BS")
                .roomName("Phòng khám Nội 102")
                .visitDate("2026-01-10")
                .chiefComplaint("Ho có đờm trắng đục, rát họng, sốt nhẹ về chiều.")
                .clinicalSymptoms("Họng đỏ sung huyết, amidan sưng nhẹ, không giả mạc.")
                .allergies(List.of("Paracetamol (dị ứng nhẹ)"))
                .vitals(VitalSigns.builder()
                        .bloodPressure("130/82 mmHg")
                        .heartRate(88)
                        .temperature(37.8)
                        .weight(70.0)
                        .height(170.0)
                        .bmi(24.2)
                        .spo2(97.0)
                        .build())
                .diagnoses(List.of(
                        new DiagnosisItem("J06.9", "Nhiễm trùng đường hô hấp trên cấp tính", true)
                ))
                .services(List.of(
                        new ClinicalServiceOrder("XÉT NGHIỆM", "Tổng phân tích tế bào máu ngoại vi (CBC)", "Bạch cầu tăng nhẹ (10.5 G/L), Neutrophil 72%.", 120000.0, "COMPLETED")
                ))
                .prescriptions(List.of(
                        new PrescriptionItem("Augmentin 1g", "1000mg", "1 viên x 2 lần/ngày sau ăn", 14, "Viên", "Kháng sinh uống 7 ngày")
                ))
                .doctorAdvice("Súc miệng nước muối sinh lý 3 lần/ngày. Uống nhiều nước ấm (2 lít/ngày). Đeo khẩu trang khi ra ngoài.")
                .followUpDays(7)
                .isLocked(true)
                .version(1)
                .createdAt("2026-01-10T14:15:00Z")
                .updatedAt("2026-01-10T15:00:00Z")
                .build());
    }

    @Override
    public Optional<MedicalRecord> findById(String id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public Optional<MedicalRecord> findByVisitCode(String visitCode) {
        if (visitCode == null) return Optional.empty();
        return store.values().stream()
                .filter(r -> visitCode.equalsIgnoreCase(r.getVisitCode()))
                .findFirst();
    }

    @Override
    public Optional<MedicalRecord> findByVisitId(String visitId) {
        if (visitId == null) return Optional.empty();
        return store.values().stream()
                .filter(r -> visitId.equalsIgnoreCase(r.getVisitId()))
                .findFirst();
    }

    @Override
    public List<MedicalRecord> findByPatientId(String patientId) {
        if (patientId == null) return Collections.emptyList();
        return store.values().stream()
                .filter(r -> patientId.equals(r.getPatientId()) || patientId.equalsIgnoreCase(r.getPatientCode()))
                .sorted(Comparator.comparing(MedicalRecord::getVisitDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<MedicalRecord> search(String patientId, String keyword, String department, Integer year) {
        return store.values().stream()
                .filter(r -> patientId == null || patientId.isBlank()
                        || patientId.equals(r.getPatientId()) || patientId.equalsIgnoreCase(r.getPatientCode()))
                .filter(r -> {
                    if (keyword == null || keyword.isBlank()) return true;
                    String kw = keyword.trim().toLowerCase();
                    boolean matchDoctor = r.getDoctorName() != null && r.getDoctorName().toLowerCase().contains(kw);
                    boolean matchDept = r.getDepartment() != null && r.getDepartment().toLowerCase().contains(kw);
                    boolean matchDiag = r.getDiagnoses() != null && r.getDiagnoses().stream()
                            .anyMatch(d -> (d.getNameVi() != null && d.getNameVi().toLowerCase().contains(kw))
                                    || (d.getCode() != null && d.getCode().toLowerCase().contains(kw)));
                    boolean matchRx = r.getPrescriptions() != null && r.getPrescriptions().stream()
                            .anyMatch(p -> p.getName() != null && p.getName().toLowerCase().contains(kw));
                    return matchDoctor || matchDept || matchDiag || matchRx;
                })
                .filter(r -> department == null || department.isBlank() || "ALL".equalsIgnoreCase(department)
                        || department.equalsIgnoreCase(r.getDepartment()))
                .filter(r -> {
                    if (year == null) return true;
                    if (r.getVisitDate() == null) return false;
                    return r.getVisitDate().startsWith(String.valueOf(year));
                })
                .sorted(Comparator.comparing(MedicalRecord::getVisitDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<MedicalRecord> findAll() {
        return new ArrayList<>(store.values());
    }

    @Override
    public MedicalRecord save(MedicalRecord record) {
        if (record.getId() == null) {
            record.setId("REC-" + (store.size() + 1));
        }
        store.put(record.getId(), record);
        return record;
    }

    @Override
    public void deleteById(String id) {
        store.remove(id);
    }
}
