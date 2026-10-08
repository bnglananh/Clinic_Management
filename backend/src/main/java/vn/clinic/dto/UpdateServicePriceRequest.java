package vn.clinic.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateServicePriceRequest {

    @NotNull(message = "Đơn giá mới không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Đơn giá mới không được âm")
    private BigDecimal price;
}
