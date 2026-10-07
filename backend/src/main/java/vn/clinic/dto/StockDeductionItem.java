package vn.clinic.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockDeductionItem {

    @NotBlank(message = "Mã thuốc / ID thuốc không được để trống")
    private String drugId;

    @Min(value = 1, message = "Số lượng trừ kho phải lớn hơn 0")
    private int quantity;
}
