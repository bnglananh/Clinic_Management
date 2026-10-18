package vn.clinic.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.clinic.dto.*;
import vn.clinic.service.PatientService;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    // =========================================================================
    // Tra cứu danh sách hồ sơ bệnh nhân (Tìm kiếm theo họ tên, CCCD, SĐT, mã BN)
    // =========================================================================

    @GetMapping
    public ResponseEntity<ApiResponse<List<PatientDto>>> getPatients(
            @RequestParam(required = false) String q) {
        List<PatientDto> patients = patientService.searchPatients(q);
        return ResponseEntity.ok(ApiResponse.success(patients, "Tra cứu danh sách bệnh nhân thành công"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PatientDto>> getPatientById(@PathVariable String id) {
        PatientDto patient = patientService.getPatientById(id);
        return ResponseEntity.ok(ApiResponse.success(patient, "Lấy thông tin chi tiết bệnh nhân thành công"));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<PatientDto>> getPatientByCode(@PathVariable String code) {
        PatientDto patient = patientService.getPatientByCode(code);
        return ResponseEntity.ok(ApiResponse.success(patient, "Tra cứu hồ sơ bệnh nhân theo mã thành công"));
    }

    // =========================================================================
    // Tạo mới hồ sơ bệnh nhân
    // Kiểm tra tính duy nhất (trùng CCCD hoặc SĐT) trước khi tạo mới
    // =========================================================================

    @PostMapping
    public ResponseEntity<ApiResponse<PatientDto>> createPatient(
            @Valid @RequestBody CreatePatientRequest request) {
        PatientDto created = patientService.createPatient(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Tạo mới hồ sơ bệnh nhân thành công"));
    }

    // =========================================================================
    // Cập nhật thông tin hành chính, CCCD, SĐT, tiền sử dị ứng
    // =========================================================================

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PatientDto>> updatePatient(
            @PathVariable String id,
            @Valid @RequestBody UpdatePatientRequest request) {
        PatientDto updated = patientService.updatePatient(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật hồ sơ bệnh nhân thành công"));
    }

    // =========================================================================
    // Tra cứu lịch sử khám bệnh & lịch hẹn của bệnh nhân
    // =========================================================================

    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<PatientHistorySummaryDto>> getPatientHistory(@PathVariable String id) {
        PatientHistorySummaryDto history = patientService.getPatientHistory(id);
        return ResponseEntity.ok(ApiResponse.success(history, "Lấy lịch sử khám bệnh của bệnh nhân thành công"));
    }
}
