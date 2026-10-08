package vn.clinic.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.clinic.dto.ApiResponse;
import vn.clinic.dto.ClinicDashboardStatsDto;
import vn.clinic.dto.DepartmentPerformanceDto;
import vn.clinic.service.ReportService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    // =========================================================================
    // UC024: Báo cáo thống kê điều hành & giám sát phòng khám
    // =========================================================================

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<ClinicDashboardStatsDto>> getDashboardStats() {
        ClinicDashboardStatsDto stats = reportService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success(stats, "Lấy số liệu báo cáo điều hành phòng khám thành công (SRS UC024)"));
    }

    @GetMapping("/departments")
    public ResponseEntity<ApiResponse<List<DepartmentPerformanceDto>>> getDepartmentPerformance() {
        List<DepartmentPerformanceDto> list = reportService.getDepartmentPerformance();
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy hiệu suất tiếp nhận & doanh thu theo chuyên khoa thành công"));
    }

    @GetMapping("/export")
    public ResponseEntity<ApiResponse<Map<String, Object>>> exportExecutiveReport() {
        Map<String, Object> report = reportService.exportExecutiveSummaryReport();
        return ResponseEntity.ok(ApiResponse.success(report, "Xuất dữ liệu báo cáo viện phí & vận hành thành công (SRS UC024)"));
    }
}
