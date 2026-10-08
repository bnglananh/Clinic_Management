package vn.clinic;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import vn.clinic.dto.AppointmentDto;
import vn.clinic.dto.CancelAppointmentRequest;
import vn.clinic.dto.CreateAppointmentRequest;
import vn.clinic.dto.RescheduleAppointmentRequest;
import vn.clinic.exception.BusinessRuleException;
import vn.clinic.model.AppointmentStatus;
import vn.clinic.repository.InMemoryAppointmentRepository;
import vn.clinic.repository.InMemoryNotificationRepository;
import vn.clinic.repository.InMemoryPatientProfileRepository;
import vn.clinic.service.AppointmentService;
import vn.clinic.service.AppointmentServiceImpl;
import vn.clinic.service.NotificationServiceImpl;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class AppointmentServiceTest {

    private InMemoryAppointmentRepository appointmentRepo;
    private InMemoryPatientProfileRepository patientRepo;
    private AppointmentService appointmentService;

    @BeforeEach
    void setUp() {
        appointmentRepo = new InMemoryAppointmentRepository();
        appointmentRepo.initMockData();

        patientRepo = new InMemoryPatientProfileRepository();
        patientRepo.initMockData();

        InMemoryNotificationRepository notifRepo = new InMemoryNotificationRepository();
        notifRepo.initMockData();
        NotificationServiceImpl notifService = new NotificationServiceImpl(notifRepo);

        appointmentService = new AppointmentServiceImpl(appointmentRepo, patientRepo, notifService);
    }

    @Test
    @DisplayName("UC02: Đặt lịch hẹn mới thành công")
    void testCreateAppointment_Success() {
        CreateAppointmentRequest request = CreateAppointmentRequest.builder()
                .patientName("Hoàng Minh Tuấn")
                .phone("0912345678")
                .department("Khoa Tim Mạch")
                .doctorId("usr-doc-01")
                .doctorName("TS.BS Trần Minh Hoàng")
                .appointmentDate("2026-10-10")
                .timeSlot("14:00 - 14:30")
                .reasonForVisit("Khám sàng lọc tim mạch")
                .build();

        AppointmentDto created = appointmentService.createAppointment(request);

        assertNotNull(created);
        assertNotNull(created.getId());
        assertTrue(created.getAppointmentCode().startsWith("LH-2026-"));
        assertEquals(AppointmentStatus.CONFIRMED, created.getStatus());
        assertEquals("Hoàng Minh Tuấn", created.getPatientName());
        assertEquals("2026-10-10", created.getAppointmentDate());
    }

    @Test
    @DisplayName("UC02 (BR-05): Từ chối đặt trùng khung giờ bác sĩ đã có lịch hẹn")
    void testCreateAppointment_DuplicateSlot_ThrowsBusinessRuleException() {
        CreateAppointmentRequest request = CreateAppointmentRequest.builder()
                .patientName("Lê Văn Nam")
                .phone("0933445566")
                .department("Khoa Tim Mạch")
                .doctorId("usr-doc-01")
                .doctorName("TS.BS Trần Minh Hoàng")
                .appointmentDate("2026-10-05")
                .timeSlot("09:00 - 09:30") // Trùng với apt-03
                .reasonForVisit("Đau ngực")
                .build();

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                appointmentService.createAppointment(request)
        );
        assertTrue(ex.getMessage().contains("SRS UC02 BR-05"));
    }

    @Test
    @DisplayName("UC03 & UC010: Dời lịch hẹn thành công")
    void testRescheduleAppointment_Success() {
        RescheduleAppointmentRequest request = RescheduleAppointmentRequest.builder()
                .newAppointmentDate("2026-10-12")
                .newTimeSlot("15:00 - 15:30")
                .reason("Bận công tác đột xuất")
                .build();

        AppointmentDto updated = appointmentService.rescheduleAppointment("apt-03", request);

        assertEquals("2026-10-12", updated.getAppointmentDate());
        assertEquals("15:00 - 15:30", updated.getTimeSlot());
        assertTrue(updated.getNotes().contains("Dời lịch: Bận công tác đột xuất"));
    }

    @Test
    @DisplayName("UC03: Không cho phép dời lịch hẹn đã tiếp nhận khám (CHECKED_IN)")
    void testRescheduleAppointment_CheckedIn_ThrowsException() {
        RescheduleAppointmentRequest request = RescheduleAppointmentRequest.builder()
                .newAppointmentDate("2026-10-12")
                .newTimeSlot("15:00 - 15:30")
                .build();

        // apt-01 đã ở trạng thái CHECKED_IN
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                appointmentService.rescheduleAppointment("apt-01", request)
        );
        assertTrue(ex.getMessage().contains("đã được tiếp nhận khám"));
    }

    @Test
    @DisplayName("UC03 & UC010: Hủy lịch hẹn thành công")
    void testCancelAppointment_Success() {
        CancelAppointmentRequest request = CancelAppointmentRequest.builder()
                .reason("Bệnh nhân khỏe lại, không cần khám")
                .build();

        AppointmentDto cancelled = appointmentService.cancelAppointment("apt-03", request);

        assertEquals(AppointmentStatus.CANCELLED, cancelled.getStatus());
        assertEquals("Bệnh nhân khỏe lại, không cần khám", cancelled.getCancelReason());
    }

    @Test
    @DisplayName("UC03: Không cho phép hủy lịch hẹn đã tiếp nhận khám (CHECKED_IN)")
    void testCancelAppointment_CheckedIn_ThrowsException() {
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                appointmentService.cancelAppointment("apt-01", new CancelAppointmentRequest("Muốn hủy"))
        );
        assertTrue(ex.getMessage().contains("đã được tiếp nhận khám"));
    }

    @Test
    @DisplayName("UC010: Tra cứu và lọc lịch hẹn theo tiêu chí")
    void testGetAppointments_Filter() {
        List<AppointmentDto> results = appointmentService.getAppointments("2026-10-05", "usr-doc-01", null, null, null);
        assertFalse(results.isEmpty());
        assertTrue(results.stream().allMatch(a -> a.getAppointmentDate().equals("2026-10-05")));
    }
}
