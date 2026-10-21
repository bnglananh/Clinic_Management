package vn.clinic.dto;

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
public class ResetPasswordWithOtpRequest {

    @NotBlank(message = "Vui lòng nhập địa chỉ email.")
    private String email;

    @NotBlank(message = "Vui lòng nhập mã OTP.")
    @Pattern(regexp = "^[0-9]{6}$", message = "Mã OTP phải bao gồm chính xác 6 chữ số.")
    private String otp;

    @NotBlank(message = "Mật khẩu mới không được để trống.")
    @Size(min = 6, message = "Mật khẩu mới phải có tối thiểu 6 ký tự.")
    private String newPassword;

    @NotBlank(message = "Xác nhận mật khẩu không được để trống.")
    private String confirmPassword;
}
