package vn.clinic.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicalServiceOrder {
    private String category; // CẬN LÂM SÀNG, XÉT NGHIỆM, CHẨN ĐOÁN HÌNH ẢNH
    private String name;     // Tên dịch vụ kỹ thuật
    private String result;   // Kết quả y khoa / kết luận
    private Double price;    // Giá dịch vụ
    private String status;   // COMPLETED / PENDING
}
