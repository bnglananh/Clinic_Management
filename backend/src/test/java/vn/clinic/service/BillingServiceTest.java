package vn.clinic.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.clinic.dto.*;
import vn.clinic.exception.BusinessRuleException;
import vn.clinic.model.*;
import vn.clinic.repository.BillRepository;
import vn.clinic.repository.InMemoryBillRepository;
import vn.clinic.repository.PatientProfileRepository;
import vn.clinic.repository.PharmacyDrugRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BillingServiceTest {

    private BillRepository billRepository;

    @Mock
    private PharmacyService pharmacyService;

    @Mock
    private PharmacyDrugRepository pharmacyDrugRepository;

    @Mock
    private PatientProfileRepository patientProfileRepository;

    @Mock
    private NotificationService notificationService;

    private BillingService billingService;

    @BeforeEach
    void setUp() {
        billRepository = new InMemoryBillRepository();
        ((InMemoryBillRepository) billRepository).init();

        billingService = new BillingServiceImpl(
                billRepository,
                pharmacyService,
                pharmacyDrugRepository,
                patientProfileRepository,
                notificationService
        );
    }

    @Test
    @DisplayName("UC013: Lập hóa đơn viện phí tự động tính tiền khám, dịch vụ, thuốc và tổng tiền")
    void testCreateBill_SuccessCalculatesAllFees() {
        List<CreateBillRequest.CreateBillItemRequest> items = new ArrayList<>();
        items.add(CreateBillRequest.CreateBillItemRequest.builder()
                .type(BillItemType.CONSULTATION)
                .name("Khám Nội Tim Mạch")
                .unit("Lượt")
                .quantity(1)
                .unitPrice(200000)
                .build());
        items.add(CreateBillRequest.CreateBillItemRequest.builder()
                .type(BillItemType.SERVICE)
                .name("Siêu âm ổ bụng")
                .unit("Lần")
                .quantity(1)
                .unitPrice(300000)
                .build());
        items.add(CreateBillRequest.CreateBillItemRequest.builder()
                .type(BillItemType.MEDICINE)
                .name("Panadol Extra")
                .unit("Vỉ")
                .quantity(2)
                .unitPrice(50000)
                .drugId("DRUG-02")
                .build());

        CreateBillRequest request = CreateBillRequest.builder()
                .visitId("vis-test-01")
                .ticketNumber("A-099")
                .patientId("p-001")
                .roomName("Phòng 101")
                .doctorName("TS.BS Trần Minh Hoàng")
                .items(items)
                .discountAmount(50000)
                .notes("Hóa đơn test")
                .build();

        BillDto created = billingService.createBill(request);

        assertNotNull(created);
        assertNotNull(created.getBillCode());
        assertEquals(200000, created.getConsultationFee());
        assertEquals(300000, created.getServiceFee());
        assertEquals(100000, created.getMedicineFee());
        assertEquals(50000, created.getDiscountAmount());
        // 200k + 300k + 100k - 50k = 550k
        assertEquals(550000, created.getTotalAmount());
        assertEquals(PaymentStatus.UNPAID, created.getPaymentStatus());
        assertFalse(created.isStockDeducted());
    }

    @Test
    @DisplayName("UC013: Thu tiền mặt tính đúng tiền thối và chuyển trạng thái PAID")
    void testProcessCashPayment_SuccessAndCalculatesChange() {
        ProcessPaymentRequest payReq = ProcessPaymentRequest.builder()
                .paymentMethod(PaymentMethod.CASH)
                .cashReceived(1100000.0) // Tổng bill-001 là 1.020.000 ₫
                .cashierName("Lê Thu Ngân")
                .build();

        BillDto paidBill = billingService.processCashPayment("bill-001", payReq);

        assertNotNull(paidBill);
        assertEquals(PaymentStatus.PAID, paidBill.getPaymentStatus());
        assertEquals(PaymentMethod.CASH, paidBill.getPaymentMethod());
        assertEquals(1100000.0, paidBill.getCashReceived());
        assertEquals(80000.0, paidBill.getCashChange()); // 1.100.000 - 1.020.000 = 80.000
        assertTrue(paidBill.isStockDeducted());
        verify(pharmacyService, times(1)).batchDeductStock(any());
    }

    @Test
    @DisplayName("UC013: Khách đưa thiếu tiền mặt phải ném BusinessRuleException")
    void testProcessCashPayment_InsufficientCashThrowsException() {
        ProcessPaymentRequest payReq = ProcessPaymentRequest.builder()
                .paymentMethod(PaymentMethod.CASH)
                .cashReceived(500000.0) // Nhỏ hơn 1.020.000 ₫
                .build();

        assertThrows(BusinessRuleException.class, () -> billingService.processCashPayment("bill-001", payReq));
    }

    @Test
    @DisplayName("UC013: Khởi tạo mã VietQR động thành công kèm thông tin chuyển khoản")
    void testGenerateVietQr_Success() {
        VietQrResponseDto qr = billingService.generateVietQr("bill-001");

        assertNotNull(qr);
        assertEquals("bill-001", qr.getBillId());
        assertEquals("HD-2026-0041", qr.getBillCode());
        assertEquals(1020000.0, qr.getAmount());
        assertTrue(qr.getQrImageUrl().contains("vietqr.io"));
        assertTrue(qr.getQrImageUrl().contains("1020000"));

        BillDto updated = billingService.getBillById("bill-001");
        assertEquals(PaymentStatus.PENDING_CONFIRMATION, updated.getPaymentStatus());
    }

    @Test
    @DisplayName("UC013 & UC021: Thu ngân xác nhận VietQR và kích hoạt trừ kho thuốc tự động")
    void testConfirmVietQrPayment_SuccessAndTriggersStockDeduction() {
        ConfirmVietQrRequest confirmReq = ConfirmVietQrRequest.builder()
                .vietQrReference("VCB-TEST-999")
                .cashierName("Nguyễn Thị Mai")
                .notes("Đã nhận tiền tài khoản")
                .build();

        BillDto confirmed = billingService.confirmVietQrPayment("bill-001", confirmReq);

        assertEquals(PaymentStatus.PAID, confirmed.getPaymentStatus());
        assertEquals(PaymentMethod.VIETQR, confirmed.getPaymentMethod());
        assertEquals("VCB-TEST-999", confirmed.getVietQrReference());
        assertTrue(confirmed.isStockDeducted());
        verify(pharmacyService, times(1)).batchDeductStock(any());
    }

    @Test
    @DisplayName("UC021: Tránh trừ kho hai lần nếu hóa đơn đã được trừ kho trước đó")
    void testAvoidsDoubleDeduction() {
        // bill-002 đã là PAID và stockDeducted = true
        Bill bill002 = billRepository.findById("bill-002").orElseThrow();
        assertTrue(bill002.isStockDeducted());

        // Cố tình gọi lại xác nhận thanh toán trên hóa đơn đã PAID -> phải chặn
        assertThrows(BusinessRuleException.class, () ->
                billingService.confirmVietQrPayment("bill-002", new ConfirmVietQrRequest()));

        // batchDeductStock không bao giờ được gọi cho bill-002
        verify(pharmacyService, never()).batchDeductStock(any());
    }

    @Test
    @DisplayName("UC07: Bệnh nhân xem danh sách hóa đơn viện phí cá nhân")
    void testGetBillsByPatientId_ReturnsPatientBills() {
        // bill-001 thuộc về p-004
        List<BillDto> patientBills = billingService.getBillsByPatientId("p-004");

        assertNotNull(patientBills);
        assertFalse(patientBills.isEmpty());
        assertEquals("p-004", patientBills.get(0).getPatientId());
        assertEquals("HD-2026-0041", patientBills.get(0).getBillCode());
    }

    @Test
    @DisplayName("UC013: Thống kê thu ngân viện phí (doanh thu, hóa đơn chờ/đã thanh toán, tỷ lệ VietQR)")
    void testGetBillingSummary() {
        BillingSummaryDto summary = billingService.getBillingSummary();

        assertNotNull(summary);
        assertTrue(summary.getPaidTodayTotal() > 0); // 880k (bill-002) + 640k (bill-003) = 1.520.000 ₫
        assertEquals(1, summary.getPendingCount()); // bill-001 (UNPAID)
        assertEquals(2, summary.getPaidCount());    // bill-002, bill-003 (PAID)
        assertEquals(50.0, summary.getVietQrPercentage()); // 1/2 = 50%
    }
}
