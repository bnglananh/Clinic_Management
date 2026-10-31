package vn.clinic.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Yêu cầu kiểm tra an toàn đơn thuốc trước khi bác sĩ lưu bệnh án. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionSafetyRequest {

    /** Mã thuốc, tên biệt dược hoặc tên có chứa hoạt chất, ví dụ "ASP81", "Plavix 75mg", "Amlor (Amlodipine)". */
    @NotEmpty(message = "Đơn thuốc cần ít nhất một thuốc để kiểm tra")
    private List<String> drugs;

    /** Mã bệnh nhân – để lấy tiền sử dị ứng và chẩn đoán cũ từ MongoDB. */
    private String patientId;

    /** Chẩn đoán ICD-10 của lượt khám hiện tại. */
    private List<String> icdCodes;

    /** Dị ứng bổ sung nhập tay (ngoài hồ sơ). */
    private List<String> allergies;
}
