package vn.clinic.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.clinic.model.StockTransactionType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockAdjustmentRequest {

    @NotNull(message = "Loại biến động kho không được để trống (IMPORT, EXPORT, ADJUSTMENT)")
    private StockTransactionType type;

    @Min(value = 1, message = "Số lượng điều chỉnh kho phải lớn hơn 0 (SRS UC021 BR 4.1)")
    private int quantity;

    @NotBlank(message = "Lý do biến động kho không được để trống (SRS UC021 BR-22)")
    private String reason;

    private String batchNumber;

    private String expiryDate;

    @Builder.Default
    private String performedBy = "admin";
}
