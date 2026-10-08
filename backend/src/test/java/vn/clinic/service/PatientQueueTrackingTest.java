package vn.clinic.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.clinic.dto.PatientQueueTrackingDto;
import vn.clinic.model.PriorityLevel;
import vn.clinic.model.QueueStatus;
import vn.clinic.model.QueueTicket;
import vn.clinic.repository.AppointmentRepository;
import vn.clinic.repository.InMemoryQueueTicketRepository;
import vn.clinic.repository.PatientProfileRepository;
import vn.clinic.repository.QueueTicketRepository;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class PatientQueueTrackingTest {

    private QueueTicketRepository queueTicketRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private PatientProfileRepository patientProfileRepository;

    @Mock
    private NotificationService notificationService;

    private QueueService queueService;

    @BeforeEach
    void setUp() {
        queueTicketRepository = new InMemoryQueueTicketRepository();
        ((InMemoryQueueTicketRepository) queueTicketRepository).initMockData();

        queueService = new QueueServiceImpl(
                queueTicketRepository,
                appointmentRepository,
                patientProfileRepository,
                notificationService
        );
    }

    @Test
    @DisplayName("UC04: Bệnh nhân theo dõi lượt khám thời gian thực (STT, phòng, số người phía trước)")
    void testGetPatientActiveQueue_Success() {
        // q-003 (A-013 / p-002 Lê Thị Thu Thảo / Phòng Khám Nội 101 - WAITING)
        PatientQueueTrackingDto tracking = queueService.getPatientActiveQueue("p-002");

        assertNotNull(tracking);
        assertEquals("A-013", tracking.getTicketNumber());
        assertEquals("Lê Thị Thu Thảo", tracking.getPatientName());
        assertEquals("Phòng Khám Nội 101", tracking.getRoomName());
        assertEquals(QueueStatus.WAITING, tracking.getStatus());
        assertEquals(1, tracking.getStepperStep()); // 1: Chờ gọi số
        assertNotNull(tracking.getCurrentCallingNumber());
    }

    @Test
    @DisplayName("UC04: Tra cứu theo số thứ tự (A-012 / IN_PROGRESS)")
    void testTrackTicketByNumber_InProgressStep() {
        // q-002: A-012 / IN_PROGRESS
        PatientQueueTrackingDto tracking = queueService.trackTicketByNumber("A-012");

        assertNotNull(tracking);
        assertEquals("A-012", tracking.getTicketNumber());
        assertEquals(QueueStatus.IN_PROGRESS, tracking.getStatus());
        assertEquals(2, tracking.getStepperStep()); // 2: Đang khám
        assertEquals("A-012", tracking.getCurrentCallingNumber());
        assertEquals(0, tracking.getPeopleAhead());
    }

    @Test
    @DisplayName("UC04: Bệnh nhân có lượt khám đã hoàn tất (A-011 / COMPLETED)")
    void testGetPatientActiveQueue_CompletedStep() {
        // q-001: A-011 / p-004 / COMPLETED
        PatientQueueTrackingDto tracking = queueService.getPatientActiveQueue("p-004");

        assertNotNull(tracking);
        assertEquals("A-011", tracking.getTicketNumber());
        assertEquals(QueueStatus.COMPLETED, tracking.getStatus());
        assertEquals(3, tracking.getStepperStep()); // 3: Hoàn tất
    }
}
