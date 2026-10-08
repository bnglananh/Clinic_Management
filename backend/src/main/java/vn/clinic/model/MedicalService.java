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
public class MedicalService {
    private String id;
    private String serviceCode;
    private String serviceName;
    private String category; // 'KHÁM BỆNH' | 'XÉT NGHIỆM' | 'CHẨN ĐOÁN HÌNH ẢNH' | 'CẬN LÂM SÀNG' | 'THỦ THUẬT'
    private BigDecimal price;
    private String roomName;
    private String unit;
    private int estimatedDurationMinutes;
    private boolean active; // SRS BR-24: Soft toggle, no physical delete
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
