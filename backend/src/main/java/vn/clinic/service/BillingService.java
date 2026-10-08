package vn.clinic.service;

import vn.clinic.dto.*;
import vn.clinic.model.PaymentStatus;

import java.util.List;

public interface BillingService {

    List<BillDto> getAllBills(String search, PaymentStatus status);

    BillDto getBillById(String id);

    BillDto getBillByCode(String billCode);

    BillDto createBill(CreateBillRequest request);

    VietQrResponseDto generateVietQr(String billId);

    BillDto processCashPayment(String billId, ProcessPaymentRequest request);

    BillDto confirmVietQrPayment(String billId, ConfirmVietQrRequest request);

    List<BillDto> getBillsByPatientId(String patientId);

    BillingSummaryDto getBillingSummary();

    BillDto cancelBill(String billId, String reason);
}
