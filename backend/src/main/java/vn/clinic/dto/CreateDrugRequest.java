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
public class CreateDrugRequest {

    @NotBlank(message = "Mã thuốc không được để trống (SRS UC020)")
    @Size(min = 2, max = 30, message = "Mã thuốc phải từ 2 đến 30 ký tự")
    private String code;

    @NotBlank(message = "Tên thuốc không được để trống (SRS UC020)")
    @Size(min = 2, max = 150, message = "Tên thuốc phải từ 2 đến 150 ký tự")
    private String name;

    @NotBlank(message = "Hoạt chất chính không được để trống")
    private String activeIngredient;

    @NotBlank(message = "Hàm lượng không được để trống")
    private String strength;

    @NotBlank(message = "Đơn vị tính không được để trống (Hộp, Vỉ, Viên...)")
    private String unit;

    @NotNull(message = "Giá nhập không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Giá nhập không được âm")
    private BigDecimal importPrice;

    @NotNull(message = "Giá bán không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Giá bán không được âm")
    private BigDecimal salePrice;

    @Min(value = 0, message = "Số lượng tồn ban đầu không được âm")
    private int stockQuantity;

    @Builder.Default
    @Min(value = 1, message = "Ngưỡng cảnh báo tồn kho tối thiểu phải lớn hơn hoặc bằng 1")
    private int minAlertThreshold = 10;

    private String batchNumber;

    private String expiryDate; // YYYY-MM-DD

    private String manufacturer;

    @Builder.Default
    private DrugStatus status = DrugStatus.ACTIVE;
}
