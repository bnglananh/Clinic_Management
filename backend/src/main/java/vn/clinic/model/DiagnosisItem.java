package vn.clinic.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiagnosisItem {
    private String code;     // Mã ICD-10 (vd: I10, E78.2)
    private String nameVi;   // Tên bệnh tiếng Việt theo chuẩn WHO/Bộ Y Tế
    private boolean isPrimary; // Chẩn đoán chính
}
