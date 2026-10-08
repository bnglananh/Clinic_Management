package vn.clinic.dto;

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
public class PharmacyDrugDto {
    private String id;
    private String code;
    private String name;
    private String activeIngredient;
    private String strength;
    private String unit;
    private BigDecimal importPrice;
    private BigDecimal salePrice;
    private int stockQuantity;
    private int minAlertThreshold;
    private String batchNumber;
    private String expiryDate;
    private String manufacturer;
    private DrugStatus status;
    private boolean isCriticalStock; // Tồn kho <= 10 (SRS UC021 BR-21)
    private boolean isLowStock;      // Tồn kho <= minAlertThreshold (hoặc <= 30)
}
