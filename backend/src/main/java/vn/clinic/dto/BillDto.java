package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.clinic.model.PaymentMethod;
import vn.clinic.model.PaymentStatus;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillDto {
    private String id;
    private String billCode;
    private String visitId;
    private String ticketNumber;
    private String patientId;
    private String patientCode;
    private String patientName;
    private String phone;
    private String roomName;
    private String doctorName;

    private List<BillItemDto> items;

    private double consultationFee;
    private double serviceFee;
    private double medicineFee;
    private double discountAmount;
    private double totalAmount;

    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;

    private Double cashReceived;
    private Double cashChange;
    private String vietQrReference;
    private String vietQrUrl;

    private String paidAt;
    private String cashierName;
    private String notes;

    private boolean stockDeducted;

    private String createdAt;
    private String updatedAt;
}
