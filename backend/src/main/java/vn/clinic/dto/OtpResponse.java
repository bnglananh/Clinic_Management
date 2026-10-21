package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpResponse {
    private String email;
    private long expiresInSeconds;
    private String message;
    private String devOtp; // Hiển thị mã phục vụ kiểm thử nhanh trong môi trường phát triển
}
