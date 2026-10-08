package vn.clinic.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.clinic.dto.*;
import vn.clinic.model.PaymentStatus;
import vn.clinic.service.BillingService;

import java.util.List;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    // =========================================================================
    // UC013: Quản lý hóa đơn & Thu ngân
    // =========================================================================

    @GetMapping
    public ResponseEntity<ApiResponse<List<BillDto>>> getAllBills(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) PaymentStatus status) {
        List<BillDto> list = billingService.getAllBills(search, status);
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy danh sách hóa đơn viện phí thành công"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BillDto>> getBillById(@PathVariable String id) {
        BillDto bill = billingService.getBillById(id);
        return ResponseEntity.ok(ApiResponse.success(bill, "Lấy thông tin chi tiết hóa đơn thành công"));
    }

    @GetMapping("/code/{billCode}")
    public ResponseEntity<ApiResponse<BillDto>> getBillByCode(@PathVariable String billCode) {
        BillDto bill = billingService.getBillByCode(billCode);
        return ResponseEntity.ok(ApiResponse.success(bill, "Tra cứu hóa đơn theo mã thành công"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BillDto>> createBill(@Valid @RequestBody CreateBillRequest request) {
        BillDto created = billingService.createBill(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Lập hóa đơn viện phí thành công (UC013)"));
    }

    @PostMapping("/{id}/pay-cash")
    public ResponseEntity<ApiResponse<BillDto>> processCashPayment(
            @PathVariable String id,
            @Valid @RequestBody ProcessPaymentRequest request) {
        BillDto paidBill = billingService.processCashPayment(id, request);
        return ResponseEntity.ok(ApiResponse.success(paidBill,
                "Thu tiền mặt thành công. Tự động kích hoạt trừ tồn kho thuốc (UC013 & UC021)"));
    }

    @PostMapping("/{id}/vietqr")
    public ResponseEntity<ApiResponse<VietQrResponseDto>> generateVietQr(@PathVariable String id) {
        VietQrResponseDto qr = billingService.generateVietQr(id);
        return ResponseEntity.ok(ApiResponse.success(qr, "Tạo mã thanh toán VietQR động thành công (UC013)"));
    }

    @PostMapping("/{id}/confirm-vietqr")
    public ResponseEntity<ApiResponse<BillDto>> confirmVietQrPayment(
            @PathVariable String id,
            @RequestBody(required = false) ConfirmVietQrRequest request) {
        BillDto paidBill = billingService.confirmVietQrPayment(id, request);
        return ResponseEntity.ok(ApiResponse.success(paidBill,
                "Thu ngân xác nhận nhận tiền VietQR thành công. Tự động kích hoạt trừ tồn kho thuốc (UC013 & UC021)"));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<BillingSummaryDto>> getBillingSummary() {
        BillingSummaryDto summary = billingService.getBillingSummary();
        return ResponseEntity.ok(ApiResponse.success(summary, "Lấy thống kê sổ thu ngân viện phí thành công"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<BillDto>> cancelBill(
            @PathVariable String id,
            @RequestParam(required = false) String reason) {
        BillDto cancelled = billingService.cancelBill(id, reason);
        return ResponseEntity.ok(ApiResponse.success(cancelled, "Hủy hóa đơn viện phí thành công"));
    }

    // =========================================================================
    // UC07: Bệnh nhân theo dõi hóa đơn cá nhân
    // =========================================================================

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<List<BillDto>>> getBillsByPatientId(@PathVariable String patientId) {
        List<BillDto> patientBills = billingService.getBillsByPatientId(patientId);
        return ResponseEntity.ok(ApiResponse.success(patientBills, "Lấy danh sách hóa đơn của bệnh nhân thành công (UC07)"));
    }
}
