package vn.clinic.repository;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Repository;
import vn.clinic.model.Bill;
import vn.clinic.model.BillItem;
import vn.clinic.model.BillItemType;
import vn.clinic.model.PaymentMethod;
import vn.clinic.model.PaymentStatus;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class InMemoryBillRepository implements BillRepository {

    private final Map<String, Bill> store = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        // bill-001: HD-2026-0041 (Đặng Kim Chi - Đang chờ thanh toán tại quầy)
        List<BillItem> items1 = new ArrayList<>();
        items1.add(BillItem.builder()
                .id("bi-01")
                .type(BillItemType.CONSULTATION)
                .name("Khám chuyên khoa Tim Mạch (TS.BS)")
                .unit("Lượt")
                .quantity(1)
                .unitPrice(250000)
                .amount(250000)
                .build());
        items1.add(BillItem.builder()
                .id("bi-02")
                .type(BillItemType.SERVICE)
                .name("Điện tâm đồ vi tính (ECG 12 cần)")
                .unit("Lần")
                .quantity(1)
                .unitPrice(150000)
                .amount(150000)
                .build());
        items1.add(BillItem.builder()
                .id("bi-03")
                .type(BillItemType.SERVICE)
                .name("Siêu âm tim màu Doppler tim")
                .unit("Lần")
                .quantity(1)
                .unitPrice(200000)
                .amount(200000)
                .build());
        items1.add(BillItem.builder()
                .id("bi-04")
                .type(BillItemType.MEDICINE)
                .name("Amlodipine 5mg (Amlor)")
                .unit("Viên")
                .quantity(30)
                .unitPrice(4000)
                .amount(120000)
                .drugId("DRUG-04") // Liên kết tồn kho
                .build());
        items1.add(BillItem.builder()
                .id("bi-05")
                .type(BillItemType.MEDICINE)
                .name("Glucophage 850mg (Metformin)")
                .unit("Viên")
                .quantity(30)
                .unitPrice(10000)
                .amount(300000)
                .drugId("DRUG-05") // Liên kết tồn kho
                .build());

        save(Bill.builder()
                .id("bill-001")
                .billCode("HD-2026-0041")
                .visitId("vis-001")
                .ticketNumber("A-011")
                .patientId("p-004")
                .patientCode("BN-2026-0885")
                .patientName("Đặng Kim Chi")
                .phone("0977 445 678")
                .roomName("Phòng Khám Nội 101")
                .doctorName("TS.BS Trần Minh Hoàng")
                .items(items1)
                .consultationFee(250000)
                .serviceFee(350000)
                .medicineFee(420000)
                .discountAmount(0)
                .totalAmount(1020000)
                .paymentStatus(PaymentStatus.UNPAID)
                .notes("Bệnh nhân chờ thanh toán tại quầy thu ngân")
                .stockDeducted(false)
                .createdAt("2026-10-05T08:25:00Z")
                .updatedAt("2026-10-05T08:25:00Z")
                .build());

        // bill-002: HD-2026-0040 (Lê Thị Thu Thảo - Đã thanh toán qua VietQR)
        List<BillItem> items2 = new ArrayList<>();
        items2.add(BillItem.builder()
                .id("bi-10")
                .type(BillItemType.CONSULTATION)
                .name("Khám tổng quát định kỳ")
                .unit("Lượt")
                .quantity(1)
                .unitPrice(200000)
                .amount(200000)
                .build());
        items2.add(BillItem.builder()
                .id("bi-11")
                .type(BillItemType.SERVICE)
                .name("Xét nghiệm Tổng phân tích tế bào máu ngoại vi")
                .unit("Lần")
                .quantity(1)
                .unitPrice(250000)
                .amount(250000)
                .build());
        items2.add(BillItem.builder()
                .id("bi-12")
                .type(BillItemType.SERVICE)
                .name("Siêu âm ổ bụng tổng quát")
                .unit("Lần")
                .quantity(1)
                .unitPrice(300000)
                .amount(300000)
                .build());
        items2.add(BillItem.builder()
                .id("bi-13")
                .type(BillItemType.MEDICINE)
                .name("Panadol Extra 500mg")
                .unit("Hộp 15 vỉ")
                .quantity(1)
                .unitPrice(180000)
                .amount(180000)
                .drugId("DRUG-02")
                .build());

        save(Bill.builder()
                .id("bill-002")
                .billCode("HD-2026-0040")
                .visitId("vis-000")
                .ticketNumber("A-010")
                .patientId("p-002")
                .patientCode("BN-2026-0892")
                .patientName("Lê Thị Thu Thảo")
                .phone("0918 334 556")
                .roomName("Phòng Khám Nội 101")
                .doctorName("TS.BS Trần Minh Hoàng")
                .items(items2)
                .consultationFee(200000)
                .serviceFee(550000)
                .medicineFee(180000)
                .discountAmount(50000)
                .totalAmount(880000)
                .paymentMethod(PaymentMethod.VIETQR)
                .paymentStatus(PaymentStatus.PAID)
                .vietQrReference("VCB-MB-202610058823")
                .cashierName("Nguyễn Thị Mai")
                .paidAt("2026-10-05T08:05:00Z")
                .notes("Đã xuất hóa đơn VAT điện tử")
                .stockDeducted(true)
                .createdAt("2026-10-05T07:50:00Z")
                .updatedAt("2026-10-05T08:05:00Z")
                .build());

        // bill-003: HD-2026-0039 (Trần Đại Nghĩa - Đã thanh toán Tiền mặt)
        List<BillItem> items3 = new ArrayList<>();
        items3.add(BillItem.builder()
                .id("bi-20")
                .type(BillItemType.CONSULTATION)
                .name("Khám chuyên khoa Tai Mũi Họng")
                .unit("Lượt")
                .quantity(1)
                .unitPrice(200000)
                .amount(200000)
                .build());
        items3.add(BillItem.builder()
                .id("bi-21")
                .type(BillItemType.SERVICE)
                .name("Nội soi tai mũi họng ống mềm")
                .unit("Lần")
                .quantity(1)
                .unitPrice(150000)
                .amount(150000)
                .build());
        items3.add(BillItem.builder()
                .id("bi-22")
                .type(BillItemType.MEDICINE)
                .name("Augmentin 1g")
                .unit("Hộp 14 viên")
                .quantity(1)
                .unitPrice(290000)
                .amount(290000)
                .drugId("DRUG-01")
                .build());

        save(Bill.builder()
                .id("bill-003")
                .billCode("HD-2026-0039")
                .visitId("vis-old-01")
                .ticketNumber("B-004")
                .patientId("p-003")
                .patientCode("BN-2026-0888")
                .patientName("Trần Đại Nghĩa")
                .phone("0988 122 345")
                .roomName("Phòng Tai Mũi Họng 104")
                .doctorName("ThS.BS Vũ Hải Đăng")
                .items(items3)
                .consultationFee(200000)
                .serviceFee(150000)
                .medicineFee(290000)
                .discountAmount(0)
                .totalAmount(640000)
                .paymentMethod(PaymentMethod.CASH)
                .paymentStatus(PaymentStatus.PAID)
                .cashReceived(700000.0)
                .cashChange(60000.0)
                .cashierName("Nguyễn Thị Mai")
                .paidAt("2026-10-05T07:40:00Z")
                .notes("Khách thanh toán đủ tiền mặt tại quầy")
                .stockDeducted(true)
                .createdAt("2026-10-05T07:30:00Z")
                .updatedAt("2026-10-05T07:40:00Z")
                .build());
    }

    @Override
    public Optional<Bill> findById(String id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public Optional<Bill> findByBillCode(String billCode) {
        if (billCode == null) return Optional.empty();
        return store.values().stream()
                .filter(b -> billCode.equalsIgnoreCase(b.getBillCode()))
                .findFirst();
    }

    @Override
    public List<Bill> findAll() {
        return store.values().stream()
                .sorted(Comparator.comparing(Bill::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<Bill> findByPaymentStatus(PaymentStatus status) {
        return store.values().stream()
                .filter(b -> b.getPaymentStatus() == status)
                .sorted(Comparator.comparing(Bill::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<Bill> findByPatientId(String patientId) {
        if (patientId == null) return Collections.emptyList();
        return store.values().stream()
                .filter(b -> patientId.equals(b.getPatientId()))
                .sorted(Comparator.comparing(Bill::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<Bill> findByVisitId(String visitId) {
        if (visitId == null) return Collections.emptyList();
        return store.values().stream()
                .filter(b -> visitId.equals(b.getVisitId()))
                .collect(Collectors.toList());
    }

    @Override
    public Bill save(Bill bill) {
        if (bill.getId() == null) {
            bill.setId("bill-" + UUID.randomUUID().toString().substring(0, 8));
        }
        store.put(bill.getId(), bill);
        return bill;
    }

    @Override
    public void deleteById(String id) {
        store.remove(id);
    }

    @Override
    public long countByPaymentStatus(PaymentStatus status) {
        return store.values().stream()
                .filter(b -> b.getPaymentStatus() == status)
                .count();
    }
}
