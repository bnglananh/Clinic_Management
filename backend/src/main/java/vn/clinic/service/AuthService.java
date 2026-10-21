package vn.clinic.service;

import vn.clinic.dto.ForgotPasswordRequest;
import vn.clinic.dto.OtpResponse;
import vn.clinic.dto.ResetPasswordWithOtpRequest;
import vn.clinic.dto.VerifyOtpRequest;

public interface AuthService {

    /**
     * Tiếp nhận yêu cầu quên mật khẩu, kiểm tra tài khoản, sinh mã OTP và gửi qua email.
     */
    OtpResponse requestForgotPasswordOtp(ForgotPasswordRequest request);

    /**
     * Xác thực tính hợp lệ của mã OTP.
     */
    boolean verifyOtp(VerifyOtpRequest request);

    /**
     * Đặt lại mật khẩu mới sau khi xác thực OTP hợp lệ.
     */
    void resetPasswordWithOtp(ResetPasswordWithOtpRequest request);
}
