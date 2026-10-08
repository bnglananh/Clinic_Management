package vn.clinic.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchDeductStockRequest {

    private String invoiceId;

    @Builder.Default
    private String performedBy = "cashier";

    @NotEmpty(message = "Danh sách thuốc cần trừ kho không được để trống")
    @Valid
    private List<StockDeductionItem> items;
}
