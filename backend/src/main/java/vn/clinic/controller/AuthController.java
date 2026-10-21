package vn.clinic.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.clinic.dto.ApiResponse;
import vn.clinic.dto.ForgotPasswordRequest;
import vn.clinic.dto.OtpResponse;
import vn.clinic.dto.ResetPasswordWithOtpRequest;
import vn.clinic.dto.VerifyOtpRequest;
import vn.clinic.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Yêu cầu gửi mã OTP qua email để khôi phục mật khẩu.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<OtpResponse>> requestForgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        OtpResponse response = authService.requestForgotPasswordOtp(request);
        return ResponseEntity.ok(ApiResponse.success(response, response.getMessage()));
    }

    /**
     * Kiểm tra tính hợp lệ của mã OTP.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Boolean>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {
        boolean valid = authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success(valid, "Xác thực mã OTP thành công. Vui lòng thiết lập mật khẩu mới."));
    }

    /**
     * Đặt lại mật khẩu mới sau khi xác thực OTP thành công.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordWithOtpRequest request) {
        authService.resetPasswordWithOtp(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới."));
    }
}
