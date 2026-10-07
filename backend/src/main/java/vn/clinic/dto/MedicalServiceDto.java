package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalServiceDto {
    private String id;
    private String serviceCode;
    private String serviceName;
    private String category;
    private BigDecimal price;
    private String roomName;
    private String unit;
    private int estimatedDurationMinutes;
    private boolean active;
}
