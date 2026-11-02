package vn.clinic.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.clinic.dto.ApiResponse;
import vn.clinic.dto.PrescriptionSafetyReport;
import vn.clinic.dto.PrescriptionSafetyRequest;
import vn.clinic.service.PrescriptionSafetyService;
import vn.clinic.store.DrugKnowledgeGraph;

import java.util.List;

/** Cảnh báo an toàn kê đơn dựa trên đồ thị dược lý Neo4j. */
@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionSafetyController {

    private final PrescriptionSafetyService safetyService;

    public PrescriptionSafetyController(PrescriptionSafetyService safetyService) {
        this.safetyService = safetyService;
    }

    /** Kiểm tra tương tác thuốc, chống chỉ định theo bệnh nền và dị ứng. */
    @PostMapping("/safety-check")
    public ResponseEntity<ApiResponse<PrescriptionSafetyReport>> check(@Valid @RequestBody PrescriptionSafetyRequest request) {
        PrescriptionSafetyReport report = safetyService.check(request);
        String message = report.isBlocking()
                ? "Đơn thuốc có cảnh báo nghiêm trọng, cần bác sĩ xác nhận trước khi lưu"
                : "Đã kiểm tra an toàn đơn thuốc";
        return ResponseEntity.ok(ApiResponse.success(report, message));
    }

    /** Gợi ý thuốc thay thế cùng chỉ định nhưng không tương tác với các thuốc còn lại trong đơn. */
    @GetMapping("/alternatives")
    public ResponseEntity<ApiResponse<List<DrugKnowledgeGraph.Alternative>>> alternatives(
            @RequestParam String drug,
            @RequestParam(required = false) List<String> avoid,
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(ApiResponse.success(
                safetyService.alternatives(drug, avoid, limit), "Gợi ý thuốc thay thế"));
    }
}
