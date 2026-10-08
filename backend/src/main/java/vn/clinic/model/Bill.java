package vn.clinic.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Bill {
    private String id;                     // Ví dụ: bill-001
    private String billCode;               // Ví dụ: HD-2026-0041
    private String visitId;                // Lượt khám liên kết
    private String ticketNumber;           // STT khám (vd: A-011)
    private String patientId;              // Mã bệnh nhân (vd: p-004)
    private String patientCode;            // Mã BN hiển thị (vd: BN-2026-0885)
    private String patientName;            // Họ tên bệnh nhân
    private String phone;                  // SĐT bệnh nhân
    private String roomName;               // Phòng khám
    private String doctorName;             // Bác sĩ phụ trách

    @Builder.Default
    private List<BillItem> items = new ArrayList<>();

    private double consultationFee;        // Tiền khám chuyên khoa
    private double serviceFee;             // Tiền dịch vụ kỹ thuật / cận lâm sàng
    private double medicineFee;            // Tiền thuốc
    private double discountAmount;          // Tiền miễn giảm / bảo hiểm
    private double totalAmount;            // Tổng tiền thực thu

    private PaymentMethod paymentMethod;   // CASH / VIETQR
    private PaymentStatus paymentStatus;   // UNPAID / PENDING_CONFIRMATION / PAID / CANCELLED

    private Double cashReceived;           // Tiền mặt khách đưa
    private Double cashChange;             // Tiền thối lại cho khách
    private String vietQrReference;        // Mã giao dịch đối soát VietQR
    private String vietQrUrl;              // Link ảnh mã QR động VietQR

    private String paidAt;                 // Thời điểm thanh toán
    private String cashierName;            // Thu ngân tiếp nhận
    private String notes;                  // Ghi chú hóa đơn

    private boolean stockDeducted;         // Cờ xác nhận đã trừ kho thuốc (tránh trừ kho hai lần - UC021)

    private String createdAt;
    private String updatedAt;
}
