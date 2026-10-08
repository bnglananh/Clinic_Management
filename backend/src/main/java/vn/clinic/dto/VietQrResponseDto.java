package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VietQrResponseDto {
    private String billId;
    private String billCode;
    private double amount;
    private String bankCode;
    private String accountNumber;
    private String accountName;
    private String description;
    private String qrImageUrl;
    private String status;
}
