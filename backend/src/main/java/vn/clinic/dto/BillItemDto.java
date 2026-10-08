package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.clinic.model.BillItemType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillItemDto {
    private String id;
    private BillItemType type;
    private String name;
    private String unit;
    private int quantity;
    private double unitPrice;
    private double amount;
    private String drugId;
}
