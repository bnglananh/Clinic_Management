package vn.clinic.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.clinic.dto.ApiResponse;
import vn.clinic.dto.CreateMedicalRecordRequest;
import vn.clinic.dto.MedicalRecordDto;
import vn.clinic.service.MedicalRecordService;

import java.util.List;

@RestController
@RequestMapping("/api/records")
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    public MedicalRecordController(MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
    }

    // =========================================================================
    // Tra cứu lịch sử khám bệnh
    // =========================================================================

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<List<MedicalRecordDto>>> getPatientRecords(
            @PathVariable String patientId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Integer year) {
        List<MedicalRecordDto> list = medicalRecordService.getPatientRecords(patientId, keyword, department, year);
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy lịch sử khám bệnh thành công"));
    }

    // =========================================================================
    // Tra cứu chi tiết hồ sơ khám
    // =========================================================================

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicalRecordDto>> getRecordById(@PathVariable String id) {
        MedicalRecordDto record = medicalRecordService.getRecordById(id);
        return ResponseEntity.ok(ApiResponse.success(record, "Lấy chi tiết hồ sơ bệnh án thành công"));
    }

    @GetMapping("/code/{visitCode}")
    public ResponseEntity<ApiResponse<MedicalRecordDto>> getRecordByVisitCode(@PathVariable String visitCode) {
        MedicalRecordDto record = medicalRecordService.getRecordByVisitCode(visitCode);
        return ResponseEntity.ok(ApiResponse.success(record, "Tra cứu hồ sơ bệnh án theo mã lượt khám thành công"));
    }

    @GetMapping("/visit/{visitId}")
    public ResponseEntity<ApiResponse<MedicalRecordDto>> getRecordByVisitId(@PathVariable String visitId) {
        MedicalRecordDto record = medicalRecordService.getRecordByVisitId(visitId);
        return ResponseEntity.ok(ApiResponse.success(record, "Tra cứu hồ sơ bệnh án theo lượt khám thành công"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MedicalRecordDto>> createRecord(
            @Valid @RequestBody CreateMedicalRecordRequest request) {
        MedicalRecordDto created = medicalRecordService.createRecord(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Lưu hồ sơ bệnh án thành công"));
    }

    @PatchMapping("/{id}/lock")
    public ResponseEntity<ApiResponse<MedicalRecordDto>> lockRecord(@PathVariable String id) {
        MedicalRecordDto locked = medicalRecordService.lockRecord(id);
        return ResponseEntity.ok(ApiResponse.success(locked, "Khóa hồ sơ bệnh án thành công"));
    }
}
