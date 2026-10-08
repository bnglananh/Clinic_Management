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
import vn.clinic.model.BillItemType;
import vn.clinic.model.PaymentMethod;
import vn.clinic.model.PaymentStatus;
import vn.clinic.service.BillingService;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BillingControllerTest {

    @Mock
    private BillingService billingService;

    private BillingController billingController;

    @BeforeEach
    void setUp() {
        billingController = new BillingController(billingService);
    }

    @Test
    @DisplayName("GET /api/billing: Lấy danh sách hóa đơn viện phí")
    void testGetAllBills() {
        BillDto b1 = BillDto.builder()
                .id("bill-001")
                .billCode("HD-2026-0041")
                .patientName("Đặng Kim Chi")
                .totalAmount(1020000)
                .paymentStatus(PaymentStatus.UNPAID)
                .build();

        when(billingService.getAllBills(null, null)).thenReturn(List.of(b1));

        ResponseEntity<ApiResponse<List<BillDto>>> response = billingController.getAllBills(null, null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().size());
        assertEquals("HD-2026-0041", response.getBody().getData().get(0).getBillCode());
    }

    @Test
    @DisplayName("POST /api/billing: Tạo hóa đơn mới thành công (UC013)")
    void testCreateBill() {
        CreateBillRequest req = CreateBillRequest.builder()
                .visitId("vis-001")
                .patientId("p-001")
                .items(List.of(CreateBillRequest.CreateBillItemRequest.builder()
                        .type(BillItemType.CONSULTATION)
                        .name("Khám Nội")
                        .quantity(1)
                        .unitPrice(200000)
                        .unit("Lượt")
                        .build()))
                .build();

        BillDto created = BillDto.builder()
                .id("bill-new")
                .billCode("HD-2026-0045")
                .totalAmount(200000)
                .paymentStatus(PaymentStatus.UNPAID)
                .build();

        when(billingService.createBill(any())).thenReturn(created);

        ResponseEntity<ApiResponse<BillDto>> response = billingController.createBill(req);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("HD-2026-0045", response.getBody().getData().getBillCode());
    }

    @Test
    @DisplayName("POST /api/billing/{id}/pay-cash: Thu tiền mặt thành công (UC013 & UC021)")
    void testProcessCashPayment() {
        ProcessPaymentRequest payReq = ProcessPaymentRequest.builder()
                .paymentMethod(PaymentMethod.CASH)
                .cashReceived(1100000.0)
                .cashierName("Lê Thu Ngân")
                .build();

        BillDto paid = BillDto.builder()
                .id("bill-001")
                .billCode("HD-2026-0041")
                .paymentStatus(PaymentStatus.PAID)
                .paymentMethod(PaymentMethod.CASH)
                .cashReceived(1100000.0)
                .cashChange(80000.0)
                .stockDeducted(true)
                .build();

        when(billingService.processCashPayment(eq("bill-001"), any())).thenReturn(paid);

        ResponseEntity<ApiResponse<BillDto>> response = billingController.processCashPayment("bill-001", payReq);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(PaymentStatus.PAID, response.getBody().getData().getPaymentStatus());
        assertEquals(80000.0, response.getBody().getData().getCashChange());
        assertTrue(response.getBody().getData().isStockDeducted());
    }

    @Test
    @DisplayName("POST /api/billing/{id}/vietqr: Tạo mã VietQR động thành công (UC013)")
    void testGenerateVietQr() {
        VietQrResponseDto qr = VietQrResponseDto.builder()
                .billId("bill-001")
                .billCode("HD-2026-0041")
                .amount(1020000)
                .qrImageUrl("https://img.vietqr.io/image/VCB-0903123456-compact2.png")
                .status("PENDING_CONFIRMATION")
                .build();

        when(billingService.generateVietQr("bill-001")).thenReturn(qr);

        ResponseEntity<ApiResponse<VietQrResponseDto>> response = billingController.generateVietQr("bill-001");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertNotNull(response.getBody().getData().getQrImageUrl());
    }

    @Test
    @DisplayName("POST /api/billing/{id}/confirm-vietqr: Thu ngân xác nhận VietQR (UC013 & UC021)")
    void testConfirmVietQrPayment() {
        ConfirmVietQrRequest confirmReq = ConfirmVietQrRequest.builder()
                .vietQrReference("VCB-TEST-888")
                .cashierName("Nguyễn Thị Mai")
                .build();

        BillDto confirmed = BillDto.builder()
                .id("bill-001")
                .billCode("HD-2026-0041")
                .paymentStatus(PaymentStatus.PAID)
                .paymentMethod(PaymentMethod.VIETQR)
                .vietQrReference("VCB-TEST-888")
                .stockDeducted(true)
                .build();

        when(billingService.confirmVietQrPayment(eq("bill-001"), any())).thenReturn(confirmed);

        ResponseEntity<ApiResponse<BillDto>> response = billingController.confirmVietQrPayment("bill-001", confirmReq);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(PaymentStatus.PAID, response.getBody().getData().getPaymentStatus());
        assertEquals("VCB-TEST-888", response.getBody().getData().getVietQrReference());
        assertTrue(response.getBody().getData().isStockDeducted());
    }

    @Test
    @DisplayName("GET /api/billing/patient/{patientId}: Bệnh nhân theo dõi hóa đơn cá nhân (UC07)")
    void testGetBillsByPatientId() {
        BillDto b = BillDto.builder()
                .id("bill-001")
                .patientId("p-004")
                .billCode("HD-2026-0041")
                .totalAmount(1020000)
                .build();

        when(billingService.getBillsByPatientId("p-004")).thenReturn(List.of(b));

        ResponseEntity<ApiResponse<List<BillDto>>> response = billingController.getBillsByPatientId("p-004");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().size());
        assertEquals("p-004", response.getBody().getData().get(0).getPatientId());
    }

    @Test
    @DisplayName("GET /api/billing/summary: Thống kê thu ngân viện phí")
    void testGetBillingSummary() {
        BillingSummaryDto summary = BillingSummaryDto.builder()
                .paidTodayTotal(1520000)
                .pendingCount(1)
                .paidCount(2)
                .vietQrPercentage(50.0)
                .build();

        when(billingService.getBillingSummary()).thenReturn(summary);

        ResponseEntity<ApiResponse<BillingSummaryDto>> response = billingController.getBillingSummary();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1520000.0, response.getBody().getData().getPaidTodayTotal());
    }
}
