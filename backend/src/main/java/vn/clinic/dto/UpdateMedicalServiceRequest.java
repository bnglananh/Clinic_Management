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

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMedicalServiceRequest {

    @NotBlank(message = "Tên dịch vụ kỹ thuật không được để trống (SRS UC022)")
    @Size(min = 2, max = 150, message = "Tên dịch vụ phải từ 2 đến 150 ký tự")
    private String serviceName;

    @NotBlank(message = "Phân loại dịch vụ không được để trống")
    private String category;

    @NotNull(message = "Đơn giá dịch vụ không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Đơn giá không được âm")
    private BigDecimal price;

    @NotBlank(message = "Phòng thực hiện dịch vụ không được để trống")
    private String roomName;

    @NotBlank(message = "Đơn vị tính không được để trống")
    private String unit;

    @Min(value = 1, message = "Thời lượng thực hiện ước tính phải lớn hơn 0 phút")
    private int estimatedDurationMinutes;

    private Boolean active;
}
