package vn.clinic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.clinic.model.BillItemType;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBillRequest {

    @NotBlank(message = "Mã lượt khám không được để trống")
    private String visitId;

    private String ticketNumber;

    @NotBlank(message = "Mã bệnh nhân không được để trống")
    private String patientId;

    private String roomName;
    private String doctorName;

    @NotEmpty(message = "Danh sách các khoản viện phí không được để trống")
    private List<CreateBillItemRequest> items;

    @Builder.Default
    private double discountAmount = 0.0;

    private String notes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateBillItemRequest {
        private BillItemType type;
        private String name;
        private String unit;
        private int quantity;
        private double unitPrice;
        private String drugId; // Tùy chọn nếu là thuốc để hỗ trợ trừ kho
    }
}
