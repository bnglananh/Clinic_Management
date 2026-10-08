package vn.clinic.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PharmacyDrug {
    private String id;
    private String code;
    private String name;
    private String activeIngredient;
    private String strength;
    private String unit;
    private BigDecimal importPrice;
    private BigDecimal salePrice;
    private int stockQuantity;
    private int minAlertThreshold; // Default 10 (SRS BR-21)
    private String batchNumber;
    private String expiryDate; // YYYY-MM-DD
    private String manufacturer;
    private DrugStatus status; // ACTIVE or DISCONTINUED
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
