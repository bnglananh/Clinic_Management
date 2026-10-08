package vn.clinic.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.clinic.dto.*;
import vn.clinic.model.DrugStatus;
import vn.clinic.service.PharmacyService;

import java.util.List;

@RestController
@RequestMapping("/api/admin/pharmacy")
@RequiredArgsConstructor
public class PharmacyController {

    private final PharmacyService pharmacyService;

    // =========================================================================
    // UC020: Quản lý danh mục thuốc
    // =========================================================================

    @GetMapping("/drugs")
    public ResponseEntity<ApiResponse<List<PharmacyDrugDto>>> getAllDrugs(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) DrugStatus status) {
        List<PharmacyDrugDto> drugs = pharmacyService.getAllDrugs(q, status);
        return ResponseEntity.ok(ApiResponse.success(drugs, "Lấy danh sách thuốc thành công"));
    }

    @GetMapping("/drugs/{id}")
    public ResponseEntity<ApiResponse<PharmacyDrugDto>> getDrugById(@PathVariable String id) {
        PharmacyDrugDto drug = pharmacyService.getDrugById(id);
        return ResponseEntity.ok(ApiResponse.success(drug, "Lấy chi tiết thuốc thành công"));
    }

    @PostMapping("/drugs")
    public ResponseEntity<ApiResponse<PharmacyDrugDto>> createDrug(@Valid @RequestBody CreateDrugRequest request) {
        PharmacyDrugDto created = pharmacyService.createDrug(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Thêm mới thuốc vào danh mục thành công"));
    }

    @PutMapping("/drugs/{id}")
    public ResponseEntity<ApiResponse<PharmacyDrugDto>> updateDrug(
            @PathVariable String id,
            @Valid @RequestBody UpdateDrugRequest request) {
        PharmacyDrugDto updated = pharmacyService.updateDrug(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật thông tin thuốc thành công"));
    }

    @PatchMapping("/drugs/{id}/price")
    public ResponseEntity<ApiResponse<PharmacyDrugDto>> updatePrice(
            @PathVariable String id,
            @Valid @RequestBody UpdateDrugPriceRequest request) {
        PharmacyDrugDto updated = pharmacyService.updatePrice(id, request.getImportPrice(), request.getSalePrice());
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật giá thuốc thành công"));
    }

    @PatchMapping("/drugs/{id}/toggle-status")
    public ResponseEntity<ApiResponse<PharmacyDrugDto>> toggleDrugStatus(@PathVariable String id) {
        PharmacyDrugDto updated = pharmacyService.toggleDrugStatus(id);
        String msg = (updated.getStatus() == DrugStatus.ACTIVE)
                ? "Kích hoạt kinh doanh thuốc thành công"
                : "Chuyển trạng thái ngừng kinh doanh thuốc thành công (SRS BR-24)";
        return ResponseEntity.ok(ApiResponse.success(updated, msg));
    }

    // =========================================================================
    // UC021: Quản lý tồn kho thuốc
    // =========================================================================

    @PostMapping("/drugs/{id}/stock")
    public ResponseEntity<ApiResponse<PharmacyDrugDto>> adjustStock(
            @PathVariable String id,
            @Valid @RequestBody StockAdjustmentRequest request) {
        PharmacyDrugDto updated = pharmacyService.adjustStock(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật biến động tồn kho thuốc thành công"));
    }

    @PostMapping("/drugs/batch-deduct")
    public ResponseEntity<ApiResponse<Void>> batchDeductStock(@Valid @RequestBody BatchDeductStockRequest request) {
        pharmacyService.batchDeductStock(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Tự động trừ kho thuốc sau thanh toán viện phí thành công (SRS BR-19)"));
    }

    @GetMapping("/drugs/low-stock")
    public ResponseEntity<ApiResponse<List<PharmacyDrugDto>>> getLowStockDrugs(
            @RequestParam(required = false, defaultValue = "30") Integer threshold) {
        List<PharmacyDrugDto> drugs = pharmacyService.getLowStockDrugs(threshold);
        return ResponseEntity.ok(ApiResponse.success(drugs, "Lấy danh sách thuốc sắp hết hàng thành công"));
    }

    @GetMapping("/drugs/critical-stock")
    public ResponseEntity<ApiResponse<List<PharmacyDrugDto>>> getCriticalStockDrugs() {
        List<PharmacyDrugDto> drugs = pharmacyService.getCriticalStockDrugs();
        return ResponseEntity.ok(ApiResponse.success(drugs, "Lấy danh sách thuốc tồn kho nguy cấp (<= 10) thành công"));
    }

    @GetMapping("/drugs/{id}/transactions")
    public ResponseEntity<ApiResponse<List<StockTransactionDto>>> getStockTransactions(@PathVariable String id) {
        List<StockTransactionDto> list = pharmacyService.getStockTransactions(id);
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy lịch sử biến động kho thuốc thành công"));
    }
}
