package vn.clinic.service;

import vn.clinic.dto.ClinicDashboardStatsDto;
import vn.clinic.dto.DepartmentPerformanceDto;

import java.util.List;
import java.util.Map;

public interface ReportService {

    ClinicDashboardStatsDto getDashboardStats();

    List<DepartmentPerformanceDto> getDepartmentPerformance();

    Map<String, Object> exportExecutiveSummaryReport();
}
