package vn.clinic.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionItem {
    private String name;         // Tên thuốc biệt dược (vd: Amlor, Nexium)
    private String strength;     // Hàm lượng (vd: 5mg, 20mg)
    private String dosage;       // Cách dùng / Liều lượng (vd: 1 viên/ngày buổi sáng)
    private int quantity;        // Số lượng cấp
    private String unit;         // Đơn vị (Viên, Hộp, Vỉ)
    private String instructions; // Lời dặn uống thuốc
}
