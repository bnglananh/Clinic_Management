package vn.clinic.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    public EmailServiceImpl(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
    }

    @Override
    public void sendOtpEmail(String toEmail, String recipientName, String otpCode, long expiryMinutes) {
        String safeName = (recipientName != null && !recipientName.isBlank()) ? recipientName : "Quý khách";
        String htmlContent = buildOtpHtmlTemplate(safeName, otpCode, expiryMinutes);
        String subject = "[Smart Clinic] Mã OTP xác thực khôi phục mật khẩu: " + otpCode;

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        boolean sentSuccessfully = false;

        if (mailSender != null) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setTo(toEmail);
                helper.setSubject(subject);
                helper.setText(htmlContent, true);
                mailSender.send(message);
                sentSuccessfully = true;
                log.info("Email OTP đã được gửi thành công qua SMTP tới: {}", toEmail);
            } catch (Exception e) {
                log.warn("Không thể gửi email qua SMTP (Sẽ dùng mô phỏng): {}. Chi tiết: {}", toEmail, e.getMessage());
            }
        }

        if (!sentSuccessfully) {
            // Ghi log định dạng thư điện tử rõ ràng để người phát triển và kiểm thử dễ quan sát
            log.info("\n" +
                    "========================================================================================\n" +
                    " [MÔ PHỎNG GỬI EMAIL XÁC THỰC OTP - SMART CLINIC EMR] \n" +
                    " Gửi đến: {} ({})\n" +
                    " Tiêu đề: {}\n" +
                    " MÃ OTP XÁC THỰC: [ {} ]\n" +
                    " Thời hạn hiệu lực: {} phút\n" +
                    "========================================================================================",
                    toEmail, safeName, subject, otpCode, expiryMinutes);
        }
    }

    private String buildOtpHtmlTemplate(String recipientName, String otpCode, long expiryMinutes) {
        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <title>Mã OTP Đặt Lại Mật Khẩu</title>
                </head>
                <body style="margin: 0; padding: 24px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8F9FA; color: #2D3748;">
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #E2E8F0;">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 28px 32px; background: linear-gradient(135deg, #0E4A55 0%%, #1D2B36 100%%); text-align: center;">
                                <div style="display: inline-block; padding: 6px 12px; background: rgba(236,200,128,0.15); border: 1px solid rgba(236,200,128,0.4); border-radius: 20px; color: #ECC880; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; margin-bottom: 8px;">
                                    SMART CLINIC EMR SYSTEM
                                </div>
                                <h1 style="margin: 0; color: #FFFFFF; font-size: 20px; font-weight: 600;">Yêu Cầu Đặt Lại Mật Khẩu</h1>
                            </td>
                        </tr>
                        <!-- Body -->
                        <tr>
                            <td style="padding: 32px 32px 24px 32px;">
                                <p style="font-size: 15px; line-height: 1.6; margin-top: 0;">Xin chào <strong>%s</strong>,</p>
                                <p style="font-size: 14px; line-height: 1.6; color: #4A5568;">
                                    Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản phòng khám của bạn. Vui lòng sử dụng mã xác thực (OTP) dưới đây để tiếp tục quá trình đổi mật khẩu:
                                </p>
                                
                                <!-- OTP Box -->
                                <div style="margin: 28px 0; text-align: center;">
                                    <div style="display: inline-block; padding: 16px 36px; background: #F0FDF4; border: 2px dashed #0E4A55; border-radius: 10px;">
                                        <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0E4A55; font-family: monospace;">%s</span>
                                    </div>
                                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #718096;">
                                        Mã có hiệu lực trong vòng <strong>%d phút</strong>.
                                    </p>
                                </div>

                                <p style="font-size: 13px; line-height: 1.6; color: #E53E3E; background: #FFF5F5; padding: 12px 16px; border-radius: 6px; border-left: 4px solid #E53E3E;">
                                    <strong>Cảnh báo bảo mật:</strong> Không chia sẻ mã OTP này cho bất kỳ ai, kể cả nhân viên phòng khám. Nếu bạn không thực hiện yêu cầu này, vui lòng liên hệ ngay với quản trị viên để bảo vệ tài khoản.
                                </p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 20px 32px; background-color: #F7FAFC; border-top: 1px solid #EDF2F7; text-align: center; font-size: 12px; color: #A0AEC0;">
                                <p style="margin: 0;">Phòng Khám Thông Minh Smart Clinic &bull; Cổng Thông Tin Hồ Sơ Bệnh Án Điện Tử</p>
                                <p style="margin: 4px 0 0 0;">Email hỗ trợ: support@smartclinic.vn &bull; Hotline: 1900 6868</p>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(recipientName, otpCode, expiryMinutes);
    }
}
