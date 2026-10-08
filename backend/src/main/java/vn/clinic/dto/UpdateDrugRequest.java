package vn.clinic.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.clinic.model.DrugStatus;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDrugRequest {

    @NotBlank(message = "Tên thuốc không được để trống (SRS UC020)")
    @Size(min = 2, max = 150, message = "Tên thuốc phải từ 2 đến 150 ký tự")
    private String name;

    @NotBlank(message = "Hoạt chất chính không được để trống")
    private String activeIngredient;

    @NotBlank(message = "Hàm lượng không được để trống")
    private String strength;

    @NotBlank(message = "Đơn vị tính không được để trống")
    private String unit;

    @NotNull(message = "Giá nhập không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Giá nhập không được âm")
    private BigDecimal importPrice;

    @NotNull(message = "Giá bán không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Giá bán không được âm")
    private BigDecimal salePrice;

    @Min(value = 1, message = "Ngưỡng cảnh báo tồn tối thiểu phải >= 1")
    private int minAlertThreshold;

    private String batchNumber;

    private String expiryDate;

    private String manufacturer;

    private DrugStatus status;
}
