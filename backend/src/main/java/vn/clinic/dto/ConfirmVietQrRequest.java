package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmVietQrRequest {
    private String vietQrReference; // Mã giao dịch đối soát ngân hàng
    private String cashierName;      // Tên thu ngân thực hiện xác nhận
    private String notes;
}
