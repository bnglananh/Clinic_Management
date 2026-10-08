package vn.clinic.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.clinic.dto.CreateMedicalRecordRequest;
import vn.clinic.dto.MedicalRecordDto;
import vn.clinic.model.DiagnosisItem;
import vn.clinic.model.VitalSigns;
import vn.clinic.repository.InMemoryMedicalRecordRepository;
import vn.clinic.repository.MedicalRecordRepository;
import vn.clinic.repository.PatientProfileRepository;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class MedicalRecordServiceTest {

    private MedicalRecordRepository medicalRecordRepository;

    @Mock
    private PatientProfileRepository patientProfileRepository;

    private MedicalRecordService medicalRecordService;

    @BeforeEach
    void setUp() {
        medicalRecordRepository = new InMemoryMedicalRecordRepository();
        ((InMemoryMedicalRecordRepository) medicalRecordRepository).init();

        medicalRecordService = new MedicalRecordServiceImpl(
                medicalRecordRepository,
                patientProfileRepository
        );
    }

    @Test
    @DisplayName("UC06: Tra cứu lịch sử khám bệnh của bệnh nhân")
    void testGetPatientRecords_ReturnsList() {
        // REC-01 thuộc về p-004 (Đặng Kim Chi)
        List<MedicalRecordDto> records = medicalRecordService.getPatientRecords("p-004", null, "ALL", null);

        assertNotNull(records);
        assertFalse(records.isEmpty());
        assertEquals("p-004", records.get(0).getPatientId());
        assertEquals("EMR-2026-0012", records.get(0).getVisitCode());
        assertEquals("Khoa Tim Mạch", records.get(0).getDepartment());
    }

    @Test
    @DisplayName("UC06: Bộ lọc lịch sử khám theo chuyên khoa và từ khóa")
    void testGetPatientRecords_FilterDepartmentAndKeyword() {
        List<MedicalRecordDto> filtered = medicalRecordService.getPatientRecords("p-004", "huyết áp", "Khoa Tim Mạch", 2026);

        assertNotNull(filtered);
        assertEquals(1, filtered.size());
        assertEquals("I10", filtered.get(0).getDiagnoses().get(0).getCode());
    }

    @Test
    @DisplayName("UC05: Tra cứu chi tiết hồ sơ khám theo ID (sinh hiệu, chẩn đoán ICD-10, dịch vụ, thuốc)")
    void testGetRecordById_Success() {
        MedicalRecordDto record = medicalRecordService.getRecordById("REC-01");

        assertNotNull(record);
        assertEquals("REC-01", record.getId());
        assertEquals("EMR-2026-0012", record.getVisitCode());
        assertNotNull(record.getVitals());
        assertEquals("142/90 mmHg", record.getVitals().getBloodPressure());
        assertEquals(84, record.getVitals().getHeartRate());
        assertEquals(2, record.getDiagnoses().size());
        assertEquals(2, record.getServices().size());
        assertEquals(1, record.getPrescriptions().size());
        assertTrue(record.isLocked());
    }

    @Test
    @DisplayName("UC05: Tra cứu hồ sơ bệnh án theo mã lượt khám visitCode")
    void testGetRecordByVisitCode_Success() {
        MedicalRecordDto record = medicalRecordService.getRecordByVisitCode("EMR-2026-0008");

        assertNotNull(record);
        assertEquals("REC-02", record.getId());
        assertEquals("Lê Thị Thu Thảo", record.getPatientName());
        assertEquals("K21.0", record.getDiagnoses().get(0).getCode());
    }

    @Test
    @DisplayName("Lưu mới hồ sơ bệnh án và khóa hồ sơ BR-23")
    void testCreateAndLockRecord() {
        CreateMedicalRecordRequest req = CreateMedicalRecordRequest.builder()
                .visitId("vis-test-99")
                .patientId("p-001")
                .department("Khoa Ngoại")
                .doctorName("BS. Nguyễn Văn A")
                .chiefComplaint("Đau khớp gối")
                .vitals(VitalSigns.builder().bloodPressure("120/80 mmHg").heartRate(75).temperature(36.5).build())
                .diagnoses(List.of(new DiagnosisItem("M17", "Thoái hóa khớp gối", true)))
                .build();

        MedicalRecordDto created = medicalRecordService.createRecord(req);
        assertNotNull(created);
        assertNotNull(created.getVisitCode());
        assertFalse(created.isLocked());

        // Khóa hồ sơ
        MedicalRecordDto locked = medicalRecordService.lockRecord(created.getId());
        assertTrue(locked.isLocked());
    }
}
