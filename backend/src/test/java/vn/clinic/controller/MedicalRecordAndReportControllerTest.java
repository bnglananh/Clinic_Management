package vn.clinic.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import vn.clinic.dto.*;
import vn.clinic.service.MedicalRecordService;
import vn.clinic.service.ReportService;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MedicalRecordAndReportControllerTest {

    @Mock
    private MedicalRecordService medicalRecordService;

    @Mock
    private ReportService reportService;

    private MedicalRecordController medicalRecordController;
    private ReportController reportController;

    @BeforeEach
    void setUp() {
        medicalRecordController = new MedicalRecordController(medicalRecordService);
        reportController = new ReportController(reportService);
    }

    @Test
    @DisplayName("GET /api/records/patient/{patientId}: Lịch sử khám bệnh (UC06)")
    void testGetPatientRecords() {
        MedicalRecordDto dto = MedicalRecordDto.builder()
                .id("REC-01")
                .visitCode("EMR-2026-0012")
                .patientId("p-004")
                .department("Khoa Tim Mạch")
                .build();

        when(medicalRecordService.getPatientRecords("p-004", null, null, null))
                .thenReturn(List.of(dto));

        ResponseEntity<ApiResponse<List<MedicalRecordDto>>> res =
                medicalRecordController.getPatientRecords("p-004", null, null, null);

        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertNotNull(res.getBody());
        assertEquals("EMR-2026-0012", res.getBody().getData().get(0).getVisitCode());
    }

    @Test
    @DisplayName("GET /api/records/{id}: Chi tiết hồ sơ khám (UC05)")
    void testGetRecordById() {
        MedicalRecordDto dto = MedicalRecordDto.builder()
                .id("REC-01")
                .visitCode("EMR-2026-0012")
                .doctorName("Trần Minh Hoàng")
                .build();

        when(medicalRecordService.getRecordById("REC-01")).thenReturn(dto);

        ResponseEntity<ApiResponse<MedicalRecordDto>> res = medicalRecordController.getRecordById("REC-01");

        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertNotNull(res.getBody());
        assertEquals("Trần Minh Hoàng", res.getBody().getData().getDoctorName());
    }

    @Test
    @DisplayName("GET /api/reports/dashboard: Báo cáo giám sát phòng khám (UC024)")
    void testGetDashboardStats() {
        ClinicDashboardStatsDto stats = ClinicDashboardStatsDto.builder()
                .revenueToday(42850000.0)
                .visitsToday(48)
                .criticalStockCount(3)
                .build();

        when(reportService.getDashboardStats()).thenReturn(stats);

        ResponseEntity<ApiResponse<ClinicDashboardStatsDto>> res = reportController.getDashboardStats();

        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertNotNull(res.getBody());
        assertEquals(42850000.0, res.getBody().getData().getRevenueToday());
        assertEquals(48, res.getBody().getData().getVisitsToday());
    }

    @Test
    @DisplayName("GET /api/reports/export: Xuất báo cáo viện phí & vận hành (UC024)")
    void testExportExecutiveReport() {
        Map<String, Object> map = Map.of("reportTitle", "Báo cáo điều hành");
        when(reportService.exportExecutiveSummaryReport()).thenReturn(map);

        ResponseEntity<ApiResponse<Map<String, Object>>> res = reportController.exportExecutiveReport();

        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertNotNull(res.getBody());
        assertEquals("Báo cáo điều hành", res.getBody().getData().get("reportTitle"));
    }
}
