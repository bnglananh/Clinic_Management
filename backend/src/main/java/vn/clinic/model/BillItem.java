package vn.clinic.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillItem {
    private String id;
    private BillItemType type;
    private String name;
    private String unit;
    private int quantity;
    private double unitPrice;
    private double amount;
    private String drugId; // Tùy chọn: liên kết tới PharmacyDrug để trừ tồn kho khi là MEDICINE
}
