package vn.clinic.service;

public interface EmailService {

    /**
     * Gửi email chứa mã xác thực OTP phục vụ khôi phục / đặt lại mật khẩu.
     *
     * @param toEmail       địa chỉ người nhận
     * @param recipientName họ tên người nhận
     * @param otpCode       mã OTP 6 số
     * @param expiryMinutes thời gian hiệu lực tính bằng phút
     */
    void sendOtpEmail(String toEmail, String recipientName, String otpCode, long expiryMinutes);
}
