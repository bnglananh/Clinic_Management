package vn.clinic.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePatientRequest {
    @NotBlank(message = "Số CCCD/Định danh cá nhân không được để trống (BR-03)")
    private String cccd;

    @NotBlank(message = "Họ và tên bệnh nhân không được để trống (SRS UC012)")
    private String fullName;

    @NotBlank(message = "Ngày sinh không được để trống (SRS UC012)")
    private String dateOfBirth;

    @NotBlank(message = "Giới tính không được để trống (SRS UC012)")
    private String gender;

    @NotBlank(message = "Số điện thoại không được để trống (BR-03)")
    private String phone;

    private String email;

    @NotBlank(message = "Địa chỉ liên hệ không được để trống (SRS UC012)")
    private String address;

    private String allergyHistory;
    private String bloodType;
    private String insuranceNumber;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String medicalNotes;
}
