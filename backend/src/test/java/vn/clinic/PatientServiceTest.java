package vn.clinic;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import vn.clinic.dto.CreatePatientRequest;
import vn.clinic.dto.PatientDto;
import vn.clinic.dto.PatientHistorySummaryDto;
import vn.clinic.dto.UpdatePatientRequest;
import vn.clinic.exception.DuplicateResourceException;
import vn.clinic.repository.InMemoryAppointmentRepository;
import vn.clinic.repository.InMemoryPatientProfileRepository;
import vn.clinic.repository.InMemoryQueueTicketRepository;
import vn.clinic.service.PatientService;
import vn.clinic.service.PatientServiceImpl;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PatientServiceTest {

    private InMemoryPatientProfileRepository patientRepo;
    private InMemoryAppointmentRepository appointmentRepo;
    private InMemoryQueueTicketRepository queueRepo;
    private PatientService patientService;

    @BeforeEach
    void setUp() {
        patientRepo = new InMemoryPatientProfileRepository();
        patientRepo.initMockData();

        appointmentRepo = new InMemoryAppointmentRepository();
        appointmentRepo.initMockData();

        queueRepo = new InMemoryQueueTicketRepository();
        queueRepo.initMockData();

        patientService = new PatientServiceImpl(patientRepo, appointmentRepo, queueRepo);
    }

    @Test
    @DisplayName("UC012: Tra cứu danh sách bệnh nhân theo từ khóa")
    void testSearchPatients() {
        List<PatientDto> results = patientService.searchPatients("Hùng");
        assertFalse(results.isEmpty());
        assertEquals("Nguyễn Văn Hùng", results.get(0).getFullName());

        List<PatientDto> byCccd = patientService.searchPatients("079082012345");
        assertFalse(byCccd.isEmpty());
        assertEquals("p-001", byCccd.get(0).getId());
    }

    @Test
    @DisplayName("UC012: Tạo mới hồ sơ bệnh nhân thành công với mã BN sinh tự động")
    void testCreatePatient_Success() {
        CreatePatientRequest request = CreatePatientRequest.builder()
                .cccd("079099887766")
                .fullName("Trương Gia Bình")
                .dateOfBirth("1970-01-01")
                .gender("NAM")
                .phone("0987112233")
                .email("binh.truong@fpt.com")
                .address("10 Phạm Văn Bạch, Cầu Giấy, Hà Nội")
                .allergyHistory("Không dị ứng")
                .bloodType("B+")
                .emergencyContactName("Trương Thị Mai (Con gái)")
                .emergencyContactPhone("0987998877")
                .build();

        PatientDto created = patientService.createPatient(request);

        assertNotNull(created);
        assertNotNull(created.getId());
        assertTrue(created.getPatientCode().startsWith("BN-2026-"));
        assertEquals("Trương Gia Bình", created.getFullName());
        assertEquals("079099887766", created.getCccd());
    }

    @Test
    @DisplayName("UC012 (BR-03): Từ chối tạo bệnh nhân trùng số CCCD")
    void testCreatePatient_DuplicateCccd_ThrowsException() {
        CreatePatientRequest request = CreatePatientRequest.builder()
                .cccd("079082012345") // Trùng với p-001
                .fullName("Người Mới Trùng CCCD")
                .dateOfBirth("1990-01-01")
                .gender("NAM")
                .phone("0988776655")
                .address("TP.HCM")
                .build();

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class, () ->
                patientService.createPatient(request)
        );
        assertTrue(ex.getMessage().contains("Số CCCD/Định danh cá nhân đã tồn tại"));
    }

    @Test
    @DisplayName("UC012 (BR-03): Từ chối tạo bệnh nhân trùng số điện thoại")
    void testCreatePatient_DuplicatePhone_ThrowsException() {
        CreatePatientRequest request = CreatePatientRequest.builder()
                .cccd("079099999999")
                .fullName("Người Mới Trùng Phone")
                .dateOfBirth("1990-01-01")
                .gender("NAM")
                .phone("0903881234") // Trùng phone p-001
                .address("TP.HCM")
                .build();

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class, () ->
                patientService.createPatient(request)
        );
        assertTrue(ex.getMessage().contains("Số điện thoại đã được đăng ký"));
    }

    @Test
    @DisplayName("UC012: Cập nhật hồ sơ bệnh nhân thành công")
    void testUpdatePatient_Success() {
        UpdatePatientRequest request = UpdatePatientRequest.builder()
                .cccd("079082012345")
                .fullName("Nguyễn Văn Hùng Cập Nhật")
                .dateOfBirth("1982-05-14")
                .gender("NAM")
                .phone("0903881234")
                .address("45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP.HCM (Đã đổi số nhà)")
                .allergyHistory("Dị ứng Penicillin, Aspirin và Tôm")
                .build();

        PatientDto updated = patientService.updatePatient("p-001", request);

        assertEquals("Nguyễn Văn Hùng Cập Nhật", updated.getFullName());
        assertEquals("Dị ứng Penicillin, Aspirin và Tôm", updated.getAllergyHistory());
    }

    @Test
    @DisplayName("UC012: Tra cứu lịch sử khám bệnh và lượt hẹn của bệnh nhân")
    void testGetPatientHistory() {
        PatientHistorySummaryDto history = patientService.getPatientHistory("p-001");

        assertNotNull(history.getPatient());
        assertEquals("p-001", history.getPatient().getId());
        assertNotNull(history.getAppointments());
        assertNotNull(history.getQueueTickets());
        // p-001 có apt-01 và q-002
        assertFalse(history.getAppointments().isEmpty());
        assertFalse(history.getQueueTickets().isEmpty());
    }
}
