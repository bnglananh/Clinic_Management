package vn.clinic.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.clinic.dto.ApiResponse;
import vn.clinic.dto.CreateMedicalServiceRequest;
import vn.clinic.dto.MedicalServiceDto;
import vn.clinic.dto.UpdateMedicalServiceRequest;
import vn.clinic.dto.UpdateServicePriceRequest;
import vn.clinic.service.MedicalServiceService;

import java.util.List;

@RestController
@RequestMapping("/api/admin/services")
@RequiredArgsConstructor
public class MedicalServiceController {

    private final MedicalServiceService medicalServiceService;

    // =========================================================================
    // UC022: Quản lý danh mục dịch vụ kỹ thuật
    // =========================================================================

    @GetMapping
    public ResponseEntity<ApiResponse<List<MedicalServiceDto>>> getAllServices(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean activeOnly) {
        List<MedicalServiceDto> services = medicalServiceService.getAllServices(q, category, activeOnly);
        return ResponseEntity.ok(ApiResponse.success(services, "Lấy danh mục dịch vụ kỹ thuật thành công"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicalServiceDto>> getServiceById(@PathVariable String id) {
        MedicalServiceDto service = medicalServiceService.getServiceById(id);
        return ResponseEntity.ok(ApiResponse.success(service, "Lấy chi tiết dịch vụ thành công"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MedicalServiceDto>> createService(
            @Valid @RequestBody CreateMedicalServiceRequest request) {
        MedicalServiceDto created = medicalServiceService.createService(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Thêm mới dịch vụ kỹ thuật thành công"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicalServiceDto>> updateService(
            @PathVariable String id,
            @Valid @RequestBody UpdateMedicalServiceRequest request) {
        MedicalServiceDto updated = medicalServiceService.updateService(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật dịch vụ kỹ thuật thành công"));
    }

    @PatchMapping("/{id}/price")
    public ResponseEntity<ApiResponse<MedicalServiceDto>> updatePrice(
            @PathVariable String id,
            @Valid @RequestBody UpdateServicePriceRequest request) {
        MedicalServiceDto updated = medicalServiceService.updatePrice(id, request.getPrice());
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật bảng giá dịch vụ thành công"));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<MedicalServiceDto>> toggleStatus(@PathVariable String id) {
        MedicalServiceDto updated = medicalServiceService.toggleServiceStatus(id);
        String msg = updated.isActive()
                ? "Kích hoạt cung cấp dịch vụ thành công"
                : "Ngừng cung cấp dịch vụ thành công (SRS BR-24 & UC022 BR 3.2)";
        return ResponseEntity.ok(ApiResponse.success(updated, msg));
    }
}
