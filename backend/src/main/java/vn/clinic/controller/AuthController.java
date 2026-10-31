package vn.clinic.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.clinic.dto.ApiResponse;
import vn.clinic.dto.ForgotPasswordRequest;
import vn.clinic.dto.OtpResponse;
import vn.clinic.dto.ResetPasswordWithOtpRequest;
import vn.clinic.dto.VerifyOtpRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import vn.clinic.dto.LoginRequest;
import vn.clinic.dto.LoginResponse;
import vn.clinic.security.LoginService;
import vn.clinic.service.AuthService;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final LoginService loginService;

    public AuthController(AuthService authService, LoginService loginService) {
        this.authService = authService;
        this.loginService = loginService;
    }

    /** Đăng nhập bằng tên đăng nhập / email / SĐT và mật khẩu, trả về JWT. */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(loginService.login(request), "Đăng nhập thành công"));
    }

    /** Bệnh nhân tự đăng ký tài khoản, trả về JWT để vào hệ thống ngay. */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<LoginResponse>> register(@Valid @RequestBody vn.clinic.dto.RegisterPatientRequest request) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success(loginService.registerPatient(request), "Đăng ký tài khoản thành công"));
    }

    /** Đăng xuất: thu hồi token hiện tại (đưa vào blacklist Redis). */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@AuthenticationPrincipal Jwt jwt) {
        loginService.logout(jwt);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã đăng xuất"));
    }

    /** Thông tin người dùng trong token hiện tại. */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> me(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "id", String.valueOf(jwt.getClaimAsString("uid")),
                "username", jwt.getSubject(),
                "fullName", String.valueOf(jwt.getClaimAsString("name")),
                "role", String.valueOf(jwt.getClaimAsString("role")),
                "expiresAt", String.valueOf(jwt.getExpiresAt())), "OK"));
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
