package vn.clinic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyOtpRequest {

    @NotBlank(message = "Vui lòng nhập địa chỉ email.")
    private String email;

    @NotBlank(message = "Vui lòng nhập mã OTP.")
    @Pattern(regexp = "^[0-9]{6}$", message = "Mã OTP phải bao gồm chính xác 6 chữ số.")
    private String otp;
}
