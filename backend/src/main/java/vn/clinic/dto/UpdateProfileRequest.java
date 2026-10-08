package vn.clinic.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(min = 2, max = 100, message = "Họ và tên phải từ 2 đến 100 ký tự")
    private String fullName;

    private String dateOfBirth;

    private String gender;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "(84|0[3|5|7|8|9])+([0-9]{8})\\b", message = "Số điện thoại không đúng định dạng Việt Nam")
    private String phone;

    @NotBlank(message = "Địa chỉ email không được để trống")
    @Email(message = "Địa chỉ email không đúng định dạng hợp lệ")
    private String email;

    private String address;

    @Pattern(regexp = "^$|[0-9]{9,12}", message = "Số CCCD/CMND phải gồm 9 hoặc 12 chữ số")
    private String identityCardNumber;

    private String healthInsuranceNumber;

    private String bloodType;

    private String allergies;

    private String medicalNotes;

    private String emergencyContactName;

    private String emergencyContactPhone;

    private String avatarUrl;
}
