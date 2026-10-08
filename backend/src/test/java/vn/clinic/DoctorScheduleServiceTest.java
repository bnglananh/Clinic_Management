package vn.clinic;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import vn.clinic.dto.CreateScheduleRequest;
import vn.clinic.dto.DoctorScheduleDto;
import vn.clinic.dto.UpdateScheduleRequest;
import vn.clinic.exception.BusinessRuleException;
import vn.clinic.exception.ResourceNotFoundException;
import vn.clinic.model.ScheduleStatus;
import vn.clinic.model.WorkShift;
import vn.clinic.repository.InMemoryDoctorScheduleRepository;
import vn.clinic.repository.InMemoryStaffAccountRepository;
import vn.clinic.service.DoctorScheduleService;
import vn.clinic.service.DoctorScheduleServiceImpl;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("UC023: Quản lý lịch làm việc bác sĩ Tests")
class DoctorScheduleServiceTest {

    private InMemoryDoctorScheduleRepository scheduleRepository;
    private InMemoryStaffAccountRepository staffRepository;
    private DoctorScheduleService scheduleService;

    @BeforeEach
    void setUp() {
        scheduleRepository = new InMemoryDoctorScheduleRepository();
        scheduleRepository.init();

        staffRepository = new InMemoryStaffAccountRepository();
        staffRepository.initMockData();

        scheduleService = new DoctorScheduleServiceImpl(scheduleRepository, staffRepository);
    }

    @Test
    @DisplayName("UC023 - Bước 2: Lấy danh sách lịch làm việc theo ngày và bác sĩ thành công")
    void testGetAllSchedules() {
        List<DoctorScheduleDto> all = scheduleService.getAllSchedules(null, null, null);
        assertEquals(6, all.size());

        List<DoctorScheduleDto> doctorSchedules = scheduleService.getAllSchedules(null, "STAFF-01", null);
        assertEquals(2, doctorSchedules.size()); // BS Hoàng có 2 ca trong ngày baseDate
    }

    @Test
    @DisplayName("UC023: Lấy chi tiết ca làm việc theo ID thành công")
    void testGetScheduleById_Success() {
        DoctorScheduleDto s = scheduleService.getScheduleById("SCH-01");
        assertNotNull(s);
        assertEquals("TS.BS Trần Minh Hoàng", s.getDoctorName());
        assertEquals(WorkShift.MORNING, s.getShift());
        assertEquals(25, s.getMaxPatients());
        assertEquals(18, s.getBookedPatients());
    }

    @Test
    @DisplayName("UC023: Lấy lịch không tồn tại ném lỗi 404")
    void testGetScheduleById_NotFound() {
        assertThrows(ResourceNotFoundException.class, () -> scheduleService.getScheduleById("SCH-999"));
    }

    @Test
    @DisplayName("UC023 - BR 4.1: Phân ca trùng thời gian cho cùng 1 bác sĩ bị từ chối")
    void testCreateSchedule_DoctorConflict_ThrowsException() {
        LocalDate today = LocalDate.now();
        // STAFF-01 đã có ca MORNING hôm nay (SCH-01)
        CreateScheduleRequest req = CreateScheduleRequest.builder()
                .doctorId("STAFF-01")
                .doctorName("TS.BS Trần Minh Hoàng")
                .specialty("Tim Mạch")
                .roomName("Phòng khám Nội 105") // khác phòng nhưng trùng bác sĩ và ca
                .date(today)
                .shift(WorkShift.MORNING)
                .maxPatients(20)
                .build();

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> scheduleService.createSchedule(req));
        assertTrue(ex.getMessage().contains("Bác sĩ đã có lịch trực trong ca"));
    }

    @Test
    @DisplayName("UC023 - BR 4.1: Phân ca trùng phòng khám trong cùng 1 ca bị từ chối")
    void testCreateSchedule_RoomConflict_ThrowsException() {
        LocalDate today = LocalDate.now();
        // Phòng 'Phòng khám Nội 101' đã được xếp cho BS Hoàng ca MORNING
        CreateScheduleRequest req = CreateScheduleRequest.builder()
                .doctorId("STAFF-05")
                .doctorName("BS. Phạm Thu Hương")
                .specialty("Nội Tổng Quát")
                .roomName("Phòng khám Nội 101") // Trùng phòng khám
                .date(today)
                .shift(WorkShift.MORNING)
                .maxPatients(20)
                .build();

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> scheduleService.createSchedule(req));
        assertTrue(ex.getMessage().contains("đã có bác sĩ"));
    }

    @Test
    @DisplayName("UC023: Tạo ca làm việc mới hợp lệ thành công")
    void testCreateSchedule_Success() {
        LocalDate tomorrow = LocalDate.now().plusDays(2);
        CreateScheduleRequest req = CreateScheduleRequest.builder()
                .doctorId("STAFF-01")
                .specialty("Tim Mạch")
                .roomName("Phòng khám VIP 01")
                .date(tomorrow)
                .shift(WorkShift.MORNING)
                .maxPatients(30)
                .build();

        DoctorScheduleDto created = scheduleService.createSchedule(req);
        assertNotNull(created.getId());
        assertEquals("TS.BS Trần Minh Hoàng", created.getDoctorName());
        assertEquals(ScheduleStatus.CONFIRMED, created.getStatus());
        assertEquals(30, created.getMaxPatients());
    }

    @Test
    @DisplayName("UC023: Cập nhật ca làm việc với số lượng tối đa nhỏ hơn số đã đặt bị từ chối")
    void testUpdateSchedule_MaxPatientsLessThanBooked_ThrowsException() {
        // SCH-01 đã có 18 bệnh nhân đặt hẹn (bookedPatients = 18)
        UpdateScheduleRequest req = UpdateScheduleRequest.builder()
                .roomName("Phòng khám Nội 101")
                .maxPatients(10) // < 18
                .status(ScheduleStatus.CONFIRMED)
                .build();

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> scheduleService.updateSchedule("SCH-01", req));
        assertTrue(ex.getMessage().contains("không được nhỏ hơn số lượt đã đặt hẹn trước"));
    }

    @Test
    @DisplayName("UC023: Chuyển trạng thái nghỉ phép (LEAVE) cho ca làm việc thành công")
    void testToggleScheduleStatus_Success() {
        DoctorScheduleDto toggled = scheduleService.toggleScheduleStatus("SCH-01");
        assertEquals(ScheduleStatus.LEAVE, toggled.getStatus());

        DoctorScheduleDto reConfirmed = scheduleService.toggleScheduleStatus("SCH-01");
        assertEquals(ScheduleStatus.CONFIRMED, reConfirmed.getStatus());
    }

    @Test
    @DisplayName("UC023 - BR 3.1: Không cho phép xóa ca làm việc đã có bệnh nhân đặt hẹn")
    void testDeleteSchedule_WithBookedPatients_ThrowsException() {
        // SCH-01 có 18 bệnh nhân đặt hẹn
        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> scheduleService.deleteSchedule("SCH-01"));
        assertTrue(ex.getMessage().contains("Không thể xóa ca làm việc đã có"));
    }

    @Test
    @DisplayName("UC023: Xóa ca làm việc chưa có ai đặt hẹn thành công")
    void testDeleteSchedule_NoBookedPatients_Success() {
        // SCH-06 có bookedPatients = 0
        scheduleService.deleteSchedule("SCH-06");
        assertThrows(ResourceNotFoundException.class, () -> scheduleService.getScheduleById("SCH-06"));
    }
}
