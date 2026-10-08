package vn.clinic.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.clinic.dto.*;
import vn.clinic.exception.BusinessRuleException;
import vn.clinic.exception.ResourceNotFoundException;
import vn.clinic.model.*;
import vn.clinic.repository.BillRepository;
import vn.clinic.repository.PatientProfileRepository;
import vn.clinic.repository.PharmacyDrugRepository;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BillingServiceImpl implements BillingService {

    private final BillRepository billRepository;
    private final PharmacyService pharmacyService;
    private final PharmacyDrugRepository pharmacyDrugRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final NotificationService notificationService;

    private static final String BANK_CODE = "VCB";
    private static final String ACCOUNT_NO = "0903123456";
    private static final String ACCOUNT_NAME = "PHONG KHAM SMART CLINIC";

    @Override
    public List<BillDto> getAllBills(String search, PaymentStatus status) {
        List<Bill> list = (status != null)
                ? billRepository.findByPaymentStatus(status)
                : billRepository.findAll();

        if (search != null && !search.isBlank()) {
            String lower = search.trim().toLowerCase();
            list = list.stream()
                    .filter(b -> (b.getBillCode() != null && b.getBillCode().toLowerCase().contains(lower))
                            || (b.getPatientName() != null && b.getPatientName().toLowerCase().contains(lower))
                            || (b.getPatientCode() != null && b.getPatientCode().toLowerCase().contains(lower))
                            || (b.getPhone() != null && b.getPhone().contains(lower))
                            || (b.getTicketNumber() != null && b.getTicketNumber().toLowerCase().contains(lower)))
                    .collect(Collectors.toList());
        }

        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public BillDto getBillById(String id) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn với mã ID: " + id));
        return mapToDto(bill);
    }

    @Override
    public BillDto getBillByCode(String billCode) {
        Bill bill = billRepository.findByBillCode(billCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn với số hiệu: " + billCode));
        return mapToDto(bill);
    }

    @Override
    public BillDto createBill(CreateBillRequest request) {
        String patientCode = "BN-" + (int)(Math.random() * 9000 + 1000);
        String patientName = "Bệnh nhân mới";
        String phone = "--";

        // Tra cứu thông tin bệnh nhân từ hồ sơ
        if (request.getPatientId() != null) {
            Optional<PatientProfile> patientOpt = patientProfileRepository.findById(request.getPatientId());
            if (patientOpt.isEmpty()) {
                patientOpt = patientProfileRepository.findByPatientCode(request.getPatientId());
            }
            if (patientOpt.isPresent()) {
                PatientProfile p = patientOpt.get();
                patientCode = p.getPatientCode();
                patientName = p.getFullName();
                phone = p.getPhone();
            }
        }

        // Tạo mã hóa đơn định dạng HD-2026-xxxx
        String billCode = generateNextBillCode();

        double consultationFee = 0.0;
        double serviceFee = 0.0;
        double medicineFee = 0.0;
        List<BillItem> billItems = new ArrayList<>();

        if (request.getItems() != null) {
            int itemIndex = 1;
            for (CreateBillRequest.CreateBillItemRequest itemReq : request.getItems()) {
                double amount = itemReq.getUnitPrice() * itemReq.getQuantity();
                if (itemReq.getType() == BillItemType.CONSULTATION) {
                    consultationFee += amount;
                } else if (itemReq.getType() == BillItemType.SERVICE) {
                    serviceFee += amount;
                } else if (itemReq.getType() == BillItemType.MEDICINE) {
                    medicineFee += amount;
                }

                billItems.add(BillItem.builder()
                        .id("bi-" + itemIndex++)
                        .type(itemReq.getType())
                        .name(itemReq.getName())
                        .unit(itemReq.getUnit())
                        .quantity(itemReq.getQuantity())
                        .unitPrice(itemReq.getUnitPrice())
                        .amount(amount)
                        .drugId(itemReq.getDrugId())
                        .build());
            }
        }

        double totalAmount = Math.max(0.0, consultationFee + serviceFee + medicineFee - request.getDiscountAmount());
        String nowStr = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        Bill bill = Bill.builder()
                .id("bill-" + UUID.randomUUID().toString().substring(0, 8))
                .billCode(billCode)
                .visitId(request.getVisitId())
                .ticketNumber(request.getTicketNumber() != null ? request.getTicketNumber() : "A-" + (int)(Math.random() * 90 + 10))
                .patientId(request.getPatientId())
                .patientCode(patientCode)
                .patientName(patientName)
                .phone(phone)
                .roomName(request.getRoomName() != null ? request.getRoomName() : "Phòng Khám Đa Khoa")
                .doctorName(request.getDoctorName() != null ? request.getDoctorName() : "Bác sĩ phụ trách")
                .items(billItems)
                .consultationFee(consultationFee)
                .serviceFee(serviceFee)
                .medicineFee(medicineFee)
                .discountAmount(request.getDiscountAmount())
                .totalAmount(totalAmount)
                .paymentStatus(PaymentStatus.UNPAID)
                .stockDeducted(false)
                .notes(request.getNotes())
                .createdAt(nowStr)
                .updatedAt(nowStr)
                .build();

        Bill saved = billRepository.save(bill);
        log.info("Tạo mới hóa đơn viện phí: {} cho bệnh nhân {} (Tổng tiền: {})",
                saved.getBillCode(), saved.getPatientName(), saved.getTotalAmount());
        return mapToDto(saved);
    }

    @Override
    public VietQrResponseDto generateVietQr(String billId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn: " + billId));

        if (bill.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BusinessRuleException("Hóa đơn " + bill.getBillCode() + " đã được thanh toán hoàn tất");
        }

        String description = bill.getBillCode() + " " + bill.getPatientCode();
        String encodedDesc = URLEncoder.encode(description, StandardCharsets.UTF_8);
        String qrUrl = String.format("https://img.vietqr.io/image/%s-%s-compact2.png?amount=%d&addInfo=%s&accountName=%s",
                BANK_CODE, ACCOUNT_NO, (long) bill.getTotalAmount(), encodedDesc, URLEncoder.encode(ACCOUNT_NAME, StandardCharsets.UTF_8));

        // Cập nhật trạng thái chuyển sang PENDING_CONFIRMATION để thu ngân theo dõi đối soát
        bill.setPaymentMethod(PaymentMethod.VIETQR);
        bill.setPaymentStatus(PaymentStatus.PENDING_CONFIRMATION);
        bill.setVietQrUrl(qrUrl);
        bill.setUpdatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        billRepository.save(bill);

        return VietQrResponseDto.builder()
                .billId(bill.getId())
                .billCode(bill.getBillCode())
                .amount(bill.getTotalAmount())
                .bankCode(BANK_CODE)
                .accountNumber(ACCOUNT_NO)
                .accountName(ACCOUNT_NAME)
                .description(description)
                .qrImageUrl(qrUrl)
                .status("PENDING_CONFIRMATION")
                .build();
    }

    @Override
    public BillDto processCashPayment(String billId, ProcessPaymentRequest request) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn: " + billId));

        if (bill.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BusinessRuleException("Hóa đơn " + bill.getBillCode() + " đã được thanh toán trước đó (SRS BR-19)");
        }

        if (request.getCashReceived() == null || request.getCashReceived() < bill.getTotalAmount()) {
            throw new BusinessRuleException(String.format("Số tiền khách đưa (%.0f ₫) không đủ để thanh toán tổng tiền hóa đơn (%.0f ₫)",
                    request.getCashReceived() != null ? request.getCashReceived() : 0.0, bill.getTotalAmount()));
        }

        double cashChange = request.getCashReceived() - bill.getTotalAmount();
        String nowStr = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        bill.setPaymentMethod(PaymentMethod.CASH);
        bill.setPaymentStatus(PaymentStatus.PAID);
        bill.setCashReceived(request.getCashReceived());
        bill.setCashChange(cashChange);
        bill.setCashierName(request.getCashierName() != null ? request.getCashierName() : "Nguyễn Thị Mai");
        bill.setPaidAt(nowStr);
        bill.setUpdatedAt(nowStr);
        if (request.getNotes() != null) {
            bill.setNotes(request.getNotes());
        }

        // UC021: Kích hoạt tự động trừ kho thuốc và bảo vệ không trừ hai lần
        deductMedicineStockIfEligible(bill);

        Bill saved = billRepository.save(bill);
        notifyPatientOnPaymentSuccess(saved);

        log.info("Thu tiền mặt thành công hóa đơn {}: Thu={}, Thối={}", saved.getBillCode(), request.getCashReceived(), cashChange);
        return mapToDto(saved);
    }

    @Override
    public BillDto confirmVietQrPayment(String billId, ConfirmVietQrRequest request) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn: " + billId));

        if (bill.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BusinessRuleException("Hóa đơn " + bill.getBillCode() + " đã được xác nhận thanh toán trước đó (SRS BR-19)");
        }

        String nowStr = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        String ref = (request != null && request.getVietQrReference() != null && !request.getVietQrReference().isBlank())
                ? request.getVietQrReference()
                : "VCB-MB-" + System.currentTimeMillis() % 100000000;

        bill.setPaymentMethod(PaymentMethod.VIETQR);
        bill.setPaymentStatus(PaymentStatus.PAID);
        bill.setVietQrReference(ref);
        bill.setCashierName((request != null && request.getCashierName() != null) ? request.getCashierName() : "Nguyễn Thị Mai");
        bill.setPaidAt(nowStr);
        bill.setUpdatedAt(nowStr);
        if (request != null && request.getNotes() != null) {
            bill.setNotes(request.getNotes());
        }

        // UC021: Kích hoạt tự động trừ kho thuốc và bảo vệ không trừ hai lần
        deductMedicineStockIfEligible(bill);

        Bill saved = billRepository.save(bill);
        notifyPatientOnPaymentSuccess(saved);

        log.info("Thu ngân xác nhận thanh toán VietQR thành công hóa đơn {}: Ref={}", saved.getBillCode(), ref);
        return mapToDto(saved);
    }

    @Override
    public List<BillDto> getBillsByPatientId(String patientId) {
        List<Bill> list = billRepository.findByPatientId(patientId);
        // Nếu không tìm thấy theo patientId, thử tìm theo patientCode
        if (list.isEmpty()) {
            list = billRepository.findAll().stream()
                    .filter(b -> patientId.equalsIgnoreCase(b.getPatientCode()) || patientId.equalsIgnoreCase(b.getPatientId()))
                    .collect(Collectors.toList());
        }
        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public BillingSummaryDto getBillingSummary() {
        List<Bill> all = billRepository.findAll();
        double paidTodayTotal = all.stream()
                .filter(b -> b.getPaymentStatus() == PaymentStatus.PAID)
                .mapToDouble(Bill::getTotalAmount)
                .sum();

        long pendingCount = all.stream()
                .filter(b -> b.getPaymentStatus() == PaymentStatus.UNPAID || b.getPaymentStatus() == PaymentStatus.PENDING_CONFIRMATION)
                .count();

        long paidCount = all.stream()
                .filter(b -> b.getPaymentStatus() == PaymentStatus.PAID)
                .count();

        long vietQrPaidCount = all.stream()
                .filter(b -> b.getPaymentStatus() == PaymentStatus.PAID && b.getPaymentMethod() == PaymentMethod.VIETQR)
                .count();

        double vietQrPercentage = (paidCount > 0) ? ((double) vietQrPaidCount / paidCount) * 100.0 : 0.0;

        double totalOutstanding = all.stream()
                .filter(b -> b.getPaymentStatus() == PaymentStatus.UNPAID || b.getPaymentStatus() == PaymentStatus.PENDING_CONFIRMATION)
                .mapToDouble(Bill::getTotalAmount)
                .sum();

        return BillingSummaryDto.builder()
                .paidTodayTotal(paidTodayTotal)
                .pendingCount(pendingCount)
                .paidCount(paidCount)
                .vietQrPercentage(Math.round(vietQrPercentage * 10.0) / 10.0)
                .totalOutstanding(totalOutstanding)
                .build();
    }

    @Override
    public BillDto cancelBill(String billId, String reason) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn: " + billId));

        if (bill.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BusinessRuleException("Không thể hủy hóa đơn đã thanh toán. Vui lòng lập biên bản hoàn phí.");
        }

        bill.setPaymentStatus(PaymentStatus.CANCELLED);
        bill.setNotes("Đã hủy hóa đơn: " + (reason != null ? reason : "Yêu cầu từ thu ngân"));
        bill.setUpdatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        Bill saved = billRepository.save(bill);
        return mapToDto(saved);
    }

    // =========================================================================
    // UC021: Nghiệp vụ trừ kho thuốc tự động & phòng ngừa trừ kho 2 lần
    // =========================================================================

    private void deductMedicineStockIfEligible(Bill bill) {
        // BR-19 & UC021: Kiểm tra cờ idempotency - Tránh trừ kho 2 lần
        if (bill.isStockDeducted()) {
            log.info("Hóa đơn {} đã được trừ kho thuốc trước đó. Bỏ qua để tránh trừ kho hai lần (UC021)", bill.getBillCode());
            return;
        }

        List<StockDeductionItem> deductionItems = new ArrayList<>();
        if (bill.getItems() != null) {
            for (BillItem item : bill.getItems()) {
                if (item.getType() == BillItemType.MEDICINE) {
                    String drugId = item.getDrugId();
                    if (drugId == null || drugId.isBlank()) {
                        drugId = resolveDrugIdByName(item.getName());
                    }

                    if (drugId != null) {
                        deductionItems.add(StockDeductionItem.builder()
                                .drugId(drugId)
                                .quantity(item.getQuantity())
                                .build());
                    } else {
                        log.warn("Không tìm thấy thuốc tương ứng trong kho cho mục '{}'", item.getName());
                    }
                }
            }
        }

        if (!deductionItems.isEmpty()) {
            try {
                pharmacyService.batchDeductStock(BatchDeductStockRequest.builder()
                        .invoiceId(bill.getBillCode())
                        .items(deductionItems)
                        .performedBy(bill.getCashierName() != null ? bill.getCashierName() : "cashier")
                        .build());
                log.info("Đã trừ tồn kho tự động {} mặt hàng thuốc cho hóa đơn {} (SRS BR-19 & UC021)",
                        deductionItems.size(), bill.getBillCode());
            } catch (Exception ex) {
                log.error("Lỗi khi trừ kho thuốc cho hóa đơn {}: {}", bill.getBillCode(), ex.getMessage(), ex);
                // Vẫn ghi nhận thanh toán nhưng ghi chú lại
                bill.setNotes((bill.getNotes() != null ? bill.getNotes() + " | " : "") + "Lỗi trừ kho: " + ex.getMessage());
            }
        }

        // Đánh dấu đã trừ kho hoàn tất
        bill.setStockDeducted(true);
    }

    private String resolveDrugIdByName(String medicineName) {
        if (medicineName == null) return null;
        String lower = medicineName.toLowerCase();
        for (PharmacyDrug d : pharmacyDrugRepository.findAll()) {
            if (lower.contains(d.getName().toLowerCase()) || d.getName().toLowerCase().contains(lower)) {
                return d.getId();
            }
        }
        return null;
    }

    private void notifyPatientOnPaymentSuccess(Bill bill) {
        try {
            notificationService.sendNotification(SendNotificationRequest.builder()
                    .userId(bill.getPatientId())
                    .title("Thanh toán viện phí thành công")
                    .content(String.format("Hóa đơn %s với tổng số tiền %s ₫ đã được thanh toán hoàn tất. Cảm ơn quý khách!",
                            bill.getBillCode(), new java.text.DecimalFormat("#,###").format(bill.getTotalAmount())))
                    .type(NotificationType.BILLING)
                    .referenceId(bill.getId())
                    .channel("IN_APP")
                    .build());
        } catch (Exception ex) {
            log.warn("Không thể gửi thông báo cho bệnh nhân {}: {}", bill.getPatientId(), ex.getMessage());
        }
    }

    private String generateNextBillCode() {
        int nextNum = 42;
        String candidate = String.format("HD-2026-%04d", nextNum);
        while (billRepository.findByBillCode(candidate).isPresent()) {
            nextNum++;
            candidate = String.format("HD-2026-%04d", nextNum);
        }
        return candidate;
    }

    private BillDto mapToDto(Bill b) {
        List<BillItemDto> itemDtos = (b.getItems() != null)
                ? b.getItems().stream()
                .map(i -> BillItemDto.builder()
                        .id(i.getId())
                        .type(i.getType())
                        .name(i.getName())
                        .unit(i.getUnit())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .amount(i.getAmount())
                        .drugId(i.getDrugId())
                        .build())
                .collect(Collectors.toList())
                : Collections.emptyList();

        return BillDto.builder()
                .id(b.getId())
                .billCode(b.getBillCode())
                .visitId(b.getVisitId())
                .ticketNumber(b.getTicketNumber())
                .patientId(b.getPatientId())
                .patientCode(b.getPatientCode())
                .patientName(b.getPatientName())
                .phone(b.getPhone())
                .roomName(b.getRoomName())
                .doctorName(b.getDoctorName())
                .items(itemDtos)
                .consultationFee(b.getConsultationFee())
                .serviceFee(b.getServiceFee())
                .medicineFee(b.getMedicineFee())
                .discountAmount(b.getDiscountAmount())
                .totalAmount(b.getTotalAmount())
                .paymentMethod(b.getPaymentMethod())
                .paymentStatus(b.getPaymentStatus())
                .cashReceived(b.getCashReceived())
                .cashChange(b.getCashChange())
                .vietQrReference(b.getVietQrReference())
                .vietQrUrl(b.getVietQrUrl())
                .paidAt(b.getPaidAt())
                .cashierName(b.getCashierName())
                .notes(b.getNotes())
                .stockDeducted(b.isStockDeducted())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
