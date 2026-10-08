package vn.clinic;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import vn.clinic.controller.AppointmentController;
import vn.clinic.controller.PatientController;
import vn.clinic.controller.QueueController;
import vn.clinic.controller.ReceptionController;
import vn.clinic.dto.*;
import vn.clinic.model.PriorityLevel;
import vn.clinic.repository.InMemoryAppointmentRepository;
import vn.clinic.repository.InMemoryNotificationRepository;
import vn.clinic.repository.InMemoryPatientProfileRepository;
import vn.clinic.repository.InMemoryQueueTicketRepository;
import vn.clinic.service.*;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ReceptionAndAppointmentControllerTest {

    private AppointmentController appointmentController;
    private ReceptionController receptionController;
    private QueueController queueController;
    private PatientController patientController;

    @BeforeEach
    void setUp() {
        InMemoryAppointmentRepository appointmentRepo = new InMemoryAppointmentRepository();
        appointmentRepo.initMockData();

        InMemoryPatientProfileRepository patientRepo = new InMemoryPatientProfileRepository();
        patientRepo.initMockData();

        InMemoryQueueTicketRepository queueRepo = new InMemoryQueueTicketRepository();
        queueRepo.initMockData();

        InMemoryNotificationRepository notifRepo = new InMemoryNotificationRepository();
        notifRepo.initMockData();
        NotificationService notifService = new NotificationServiceImpl(notifRepo);

        AppointmentService appointmentService = new AppointmentServiceImpl(appointmentRepo, patientRepo, notifService);
        QueueService queueService = new QueueServiceImpl(queueRepo, appointmentRepo, patientRepo, notifService);
        PatientService patientService = new PatientServiceImpl(patientRepo, appointmentRepo, queueRepo);

        appointmentController = new AppointmentController(appointmentService);
        receptionController = new ReceptionController(queueService);
        queueController = new QueueController(queueService);
        patientController = new PatientController(patientService);
    }

    @Test
    @DisplayName("API Appointments: Đặt lịch hẹn mới thành công")
    void testCreateAppointmentEndpoint() {
        CreateAppointmentRequest req = CreateAppointmentRequest.builder()
                .patientName("Lâm Khánh Chi")
                .phone("0988771122")
                .department("Khoa Tim Mạch")
                .doctorId("usr-doc-01")
                .appointmentDate("2026-10-15")
                .timeSlot("10:00 - 10:30")
                .reasonForVisit("Khám tim")
                .build();

        ResponseEntity<ApiResponse<AppointmentDto>> res = appointmentController.createAppointment(req);
        assertEquals(HttpStatus.CREATED, res.getStatusCode());
        assertNotNull(res.getBody().getData());
        assertEquals("Lâm Khánh Chi", res.getBody().getData().getPatientName());
    }

    @Test
    @DisplayName("API Reception: Tiếp nhận và cấp số thứ tự thành công")
    void testCheckinEndpoint() {
        CheckinReceptionRequest req = CheckinReceptionRequest.builder()
                .patientName("Nguyễn Đức Thịnh")
                .phone("0912998877")
                .roomName("Phòng Khám Nội 101")
                .priority(PriorityLevel.NORMAL)
                .build();

        ResponseEntity<ApiResponse<QueueTicketDto>> res = receptionController.checkin(req);
        assertEquals(HttpStatus.CREATED, res.getStatusCode());
        assertNotNull(res.getBody().getData());
        assertTrue(res.getBody().getData().getTicketNumber().startsWith("A-"));
    }

    @Test
    @DisplayName("API Queue: Lấy danh sách hàng đợi và thống kê")
    void testQueueEndpoints() {
        ResponseEntity<ApiResponse<List<QueueTicketDto>>> queueRes = queueController.getQueue(null, null, null, null);
        assertEquals(HttpStatus.OK, queueRes.getStatusCode());
        assertFalse(queueRes.getBody().getData().isEmpty());

        ResponseEntity<ApiResponse<QueueSummaryDto>> summaryRes = queueController.getQueueSummary();
        assertEquals(HttpStatus.OK, summaryRes.getStatusCode());
        assertTrue(summaryRes.getBody().getData().getTotalTickets() > 0);
    }

    @Test
    @DisplayName("API Patients: Tra cứu và xem lịch sử bệnh nhân")
    void testPatientEndpoints() {
        ResponseEntity<ApiResponse<List<PatientDto>>> listRes = patientController.getPatients("Hùng");
        assertEquals(HttpStatus.OK, listRes.getStatusCode());
        assertFalse(listRes.getBody().getData().isEmpty());

        ResponseEntity<ApiResponse<PatientHistorySummaryDto>> historyRes = patientController.getPatientHistory("p-001");
        assertEquals(HttpStatus.OK, historyRes.getStatusCode());
        assertNotNull(historyRes.getBody().getData().getPatient());
    }
}
