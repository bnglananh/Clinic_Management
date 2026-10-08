package vn.clinic.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.clinic.dto.ClinicDashboardStatsDto;
import vn.clinic.dto.DepartmentPerformanceDto;
import vn.clinic.repository.*;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    private BillRepository billRepository;
    private QueueTicketRepository queueTicketRepository;
    private AppointmentRepository appointmentRepository;
    private PharmacyDrugRepository pharmacyDrugRepository;
    private StaffAccountRepository staffAccountRepository;

    private ReportService reportService;

    @BeforeEach
    void setUp() {
        billRepository = new InMemoryBillRepository();
        ((InMemoryBillRepository) billRepository).init();

        queueTicketRepository = new InMemoryQueueTicketRepository();
        ((InMemoryQueueTicketRepository) queueTicketRepository).initMockData();

        appointmentRepository = new InMemoryAppointmentRepository();
        ((InMemoryAppointmentRepository) appointmentRepository).initMockData();

        pharmacyDrugRepository = new InMemoryPharmacyDrugRepository();
        ((InMemoryPharmacyDrugRepository) pharmacyDrugRepository).init();

        staffAccountRepository = new InMemoryStaffAccountRepository();
        ((InMemoryStaffAccountRepository) staffAccountRepository).initMockData();

        reportService = new ReportServiceImpl(
                billRepository,
                queueTicketRepository,
                appointmentRepository,
                pharmacyDrugRepository,
                staffAccountRepository
        );
    }

    @Test
    @DisplayName("UC024: Thống kê bảng điều khiển giám sát phòng khám (Doanh thu, Lượt khám, Kho dược, Bác sĩ)")
    void testGetDashboardStats_Success() {
        ClinicDashboardStatsDto stats = reportService.getDashboardStats();

        assertNotNull(stats);
        assertTrue(stats.getRevenueToday() > 0);
        assertTrue(stats.getVisitsToday() > 0);
        assertTrue(stats.getCriticalStockCount() > 0); // Có thuốc <= 10
        assertTrue(stats.getActiveDoctorsCount() > 0);
        assertNotNull(stats.getDepartments());
        assertFalse(stats.getDepartments().isEmpty());
    }

    @Test
    @DisplayName("UC024: Hiệu suất tiếp nhận và doanh thu theo chuyên khoa")
    void testGetDepartmentPerformance_Success() {
        List<DepartmentPerformanceDto> depts = reportService.getDepartmentPerformance();

        assertNotNull(depts);
        assertEquals(4, depts.size());
        assertEquals("Khoa Tim Mạch", depts.get(0).getDepartment());
        assertEquals(38.0, depts.get(0).getPercentage());
    }

    @Test
    @DisplayName("UC024: Xuất báo cáo viện phí & vận hành tổng hợp")
    void testExportExecutiveSummaryReport_Success() {
        Map<String, Object> report = reportService.exportExecutiveSummaryReport();

        assertNotNull(report);
        assertTrue(report.containsKey("reportTitle"));
        assertTrue(report.containsKey("revenueSummary"));
        assertTrue(report.containsKey("visitSummary"));
        assertTrue(report.containsKey("pharmacyAlerts"));
    }
}
