package vn.clinic.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import vn.clinic.dto.CreateAppointmentRequest;
import vn.clinic.dto.SlotLockRequest;
import vn.clinic.exception.BusinessRuleException;
import vn.clinic.repository.InMemoryAppointmentRepository;
import vn.clinic.repository.InMemoryNotificationRepository;
import vn.clinic.repository.InMemoryPatientProfileRepository;
import vn.clinic.store.memory.InMemoryStores;

import static org.junit.jupiter.api.Assertions.*;

class SlotLockAndCounterTest {

    private AppointmentServiceImpl appointmentService;
    private InMemoryStores.InMemorySlotLockStore locks;

    @BeforeEach
    void setUp() {
        InMemoryAppointmentRepository appointments = new InMemoryAppointmentRepository();
        appointments.initMockData();
        InMemoryPatientProfileRepository patients = new InMemoryPatientProfileRepository();
        patients.initMockData();
        locks = new InMemoryStores.InMemorySlotLockStore();
        appointmentService = new AppointmentServiceImpl(appointments, patients,
                new NotificationServiceImpl(new InMemoryNotificationRepository()),
                locks, new InMemoryStores.InMemoryLeaderboard());
    }

    private static SlotLockRequest lock(String owner) {
        return new SlotLockRequest("usr-doc-01", "2026-12-01", "09:00 - 09:30", owner);
    }

    private static CreateAppointmentRequest booking(String patientId, String phone) {
        return CreateAppointmentRequest.builder()
                .patientId(patientId).patientName("Bệnh nhân thử").phone(phone)
                .department("Khoa Tim Mạch").doctorId("usr-doc-01").doctorName("TS.BS Trần Minh Hoàng")
                .appointmentDate("2026-12-01").timeSlot("09:00 - 09:30").reasonForVisit("Khám")
                .build();
    }

    @Test
    @DisplayName("Người thứ hai không giữ được slot đang bị giữ, cũng không đặt lịch được")
    void secondPatientCannotTakeHeldSlot() {
        assertEquals(600, appointmentService.lockSlot(lock("usr-pat-01")).getExpiresInSeconds(), 1);
        assertThrows(BusinessRuleException.class, () -> appointmentService.lockSlot(lock("usr-pat-02")));
        assertThrows(BusinessRuleException.class,
                () -> appointmentService.createAppointment(booking("usr-pat-02", "0988223344")));
    }

    @Test
    @DisplayName("Người giữ slot đặt lịch thành công, khóa được nhả và bảng xếp hạng tăng")
    void holderBooksAndLockIsReleased() {
        appointmentService.lockSlot(lock("usr-pat-01"));
        appointmentService.createAppointment(booking("usr-pat-01", "0977889900"));

        assertTrue(locks.currentOwner("usr-doc-01", "2026-12-01", "09:00 - 09:30").isEmpty());
        assertEquals(1, appointmentService.getDoctorLeaderboard("2026-12", 5).get(0).getScore());
    }

    @Test
    @DisplayName("Bộ đếm số thứ tự khởi tạo từ số phiếu có sẵn rồi tăng dần")
    void ticketCounterStartsFromExistingCount() {
        InMemoryStores.InMemoryTicketCounter counter = new InMemoryStores.InMemoryTicketCounter();
        assertEquals(13, counter.next("A", "2026-12-01", () -> 12));
        assertEquals(14, counter.next("A", "2026-12-01", () -> 12));
        assertEquals(1, counter.next("A", "2026-12-02", () -> 0));
    }
}
