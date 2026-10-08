package vn.clinic;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import vn.clinic.dto.CheckinReceptionRequest;
import vn.clinic.dto.PrintTicketDto;
import vn.clinic.dto.QueueSummaryDto;
import vn.clinic.dto.QueueTicketDto;
import vn.clinic.exception.BusinessRuleException;
import vn.clinic.model.Appointment;
import vn.clinic.model.AppointmentStatus;
import vn.clinic.model.PriorityLevel;
import vn.clinic.model.QueueStatus;
import vn.clinic.repository.InMemoryAppointmentRepository;
import vn.clinic.repository.InMemoryNotificationRepository;
import vn.clinic.repository.InMemoryPatientProfileRepository;
import vn.clinic.repository.InMemoryQueueTicketRepository;
import vn.clinic.service.NotificationServiceImpl;
import vn.clinic.service.QueueService;
import vn.clinic.service.QueueServiceImpl;

import static org.junit.jupiter.api.Assertions.*;

class QueueServiceTest {

    private InMemoryQueueTicketRepository queueRepo;
    private InMemoryAppointmentRepository appointmentRepo;
    private InMemoryPatientProfileRepository patientRepo;
    private QueueService queueService;

    @BeforeEach
    void setUp() {
        queueRepo = new InMemoryQueueTicketRepository();
        queueRepo.initMockData();

        appointmentRepo = new InMemoryAppointmentRepository();
        appointmentRepo.initMockData();

        patientRepo = new InMemoryPatientProfileRepository();
        patientRepo.initMockData();

        InMemoryNotificationRepository notifRepo = new InMemoryNotificationRepository();
        notifRepo.initMockData();
        NotificationServiceImpl notifService = new NotificationServiceImpl(notifRepo);

        queueService = new QueueServiceImpl(queueRepo, appointmentRepo, patientRepo, notifService);
    }

    @Test
    @DisplayName("UC09: Tiếp nhận bệnh nhân có hẹn trước -> Chuyển lịch hẹn sang CHECKED_IN và cấp vé WAITING")
    void testCheckin_WithAppointment() {
        CheckinReceptionRequest request = CheckinReceptionRequest.builder()
                .appointmentId("apt-03")
                .patientName("Đặng Kim Chi")
                .phone("0977445678")
                .roomName("Phòng Khám Nội 101")
                .priority(PriorityLevel.NORMAL)
                .build();

        QueueTicketDto ticket = queueService.checkinAndIssueTicket(request);

        assertNotNull(ticket);
        assertEquals(QueueStatus.WAITING, ticket.getStatus());
        assertTrue(ticket.getTicketNumber().startsWith("A-"));

        // Kiểm tra lịch hẹn apt-03 đã đổi sang CHECKED_IN
        Appointment apt = appointmentRepo.findById("apt-03").orElseThrow();
        assertEquals(AppointmentStatus.CHECKED_IN, apt.getStatus());
    }

    @Test
    @DisplayName("UC09: Tiếp nhận bệnh nhân vãng lai (Walk-in, BR-06)")
    void testCheckin_WalkIn() {
        CheckinReceptionRequest request = CheckinReceptionRequest.builder()
                .patientName("Phan Hoàng Anh")
                .phone("0944556677")
                .gender("NAM")
                .yearOfBirth(1992)
                .roomName("Phòng Tai Mũi Họng 104")
                .priority(PriorityLevel.PRIORITY)
                .notes("Bệnh nhân đau họng cấp")
                .build();

        QueueTicketDto ticket = queueService.checkinAndIssueTicket(request);

        assertNotNull(ticket);
        assertEquals(QueueStatus.WAITING, ticket.getStatus());
        assertTrue(ticket.getTicketNumber().startsWith("B-"));
        assertEquals(PriorityLevel.PRIORITY, ticket.getPriority());
    }

    @Test
    @DisplayName("UC011: Thống kê số lượng hàng đợi (Summary)")
    void testGetQueueSummary() {
        QueueSummaryDto summary = queueService.getQueueSummary();

        assertTrue(summary.getTotalTickets() >= 6);
        assertTrue(summary.getWaitingCount() >= 1);
        assertTrue(summary.getInProgressCount() >= 1);
        assertTrue(summary.getCompletedCount() >= 1);
    }

    @Test
    @DisplayName("UC011: Điều phối đưa ca ưu tiên/cấp cứu lên đầu hàng đợi (promoteToTop)")
    void testPromoteToTop() {
        // q-005 đang ở trạng thái WAITING
        QueueTicketDto promoted = queueService.promoteToTop("q-005");

        assertEquals(PriorityLevel.EMERGENCY, promoted.getPriority());
        assertTrue(promoted.getNotes().contains("ưu tiên đầu hàng"));

        // Khi gọi bệnh nhân tiếp theo tại phòng 101, q-005 phải được gọi trước q-003
        QueueTicketDto next = queueService.callNextPatient("Phòng Khám Nội 101", "usr-doc-01");
        assertEquals("q-005", next.getId());
        assertEquals(QueueStatus.IN_PROGRESS, next.getStatus());
    }

    @Test
    @DisplayName("UC011: Gọi bệnh nhân kế tiếp vào buồng khám (WAITING -> IN_PROGRESS)")
    void testCallNextPatient() {
        QueueTicketDto called = queueService.callNextPatient("Phòng Tai Mũi Họng 104", "usr-doc-02");

        assertNotNull(called);
        assertEquals(QueueStatus.IN_PROGRESS, called.getStatus());
        assertEquals("Phòng Tai Mũi Họng 104", called.getRoomName());
    }

    @Test
    @DisplayName("UC011: Cập nhật trạng thái vé và chặn đảo ngược trạng thái đã COMPLETED (BR-07)")
    void testUpdateTicketStatus_CompletedCannotRevert() {
        // q-001 đã COMPLETED
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                queueService.updateTicketStatus("q-001", QueueStatus.IN_PROGRESS)
        );
        assertTrue(ex.getMessage().contains("không thể đảo ngược trạng thái"));
    }

    @Test
    @DisplayName("UC09: Lấy dữ liệu in phiếu K80 nhiệt")
    void testGetTicketPrintData() {
        PrintTicketDto printData = queueService.getTicketPrintData("q-002");

        assertNotNull(printData);
        assertEquals("A-012", printData.getTicketNumber());
        assertNotNull(printData.getClinicName());
        assertNotNull(printData.getClinicHotline());
    }
}
