package vn.clinic.service;

import vn.clinic.audit.Audited;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.clinic.dto.ForgotPasswordRequest;
import vn.clinic.dto.OtpResponse;
import vn.clinic.dto.ResetPasswordWithOtpRequest;
import vn.clinic.dto.VerifyOtpRequest;
import vn.clinic.exception.BusinessRuleException;
import vn.clinic.exception.ResourceNotFoundException;
import vn.clinic.model.PatientProfile;
import vn.clinic.model.StaffAccount;
import vn.clinic.repository.PatientProfileRepository;
import vn.clinic.repository.StaffAccountRepository;
import vn.clinic.store.OtpStore;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Slf4j
@Service
public class AuthServiceImpl implements AuthService {

    private static final long OTP_EXPIRY_SECONDS = 300; // 5 phút
    private static final int MAX_FAILED_ATTEMPTS = 5;

    private final PatientProfileRepository patientProfileRepository;
    private final StaffAccountRepository staffAccountRepository;
    private final EmailService emailService;
    private final OtpStore otpStore;
    private final boolean exposeDevOtp;
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * @param otpStore     nơi lưu OTP có thời hạn (Redis khi chạy thật)
     * @param exposeDevOtp true = trả mã OTP trong response để demo khi chưa cấu hình SMTP.
     *                     Mặc định false vì lộ OTP cho phép chiếm tài khoản chỉ bằng email.
     */
    public AuthServiceImpl(PatientProfileRepository patientProfileRepository,
                           StaffAccountRepository staffAccountRepository,
                           EmailService emailService,
                           OtpStore otpStore,
                           @Value("${clinic.auth.expose-dev-otp:false}") boolean exposeDevOtp) {
        this.patientProfileRepository = patientProfileRepository;
        this.staffAccountRepository = staffAccountRepository;
        this.emailService = emailService;
        this.otpStore = otpStore;
        this.exposeDevOtp = exposeDevOtp;
    }

    @Override
    public OtpResponse requestForgotPasswordOtp(ForgotPasswordRequest request) {
        String identifier = request.getEmail().trim();
        String targetEmail;
        String fullName;

        // 1. Tìm kiếm trong hồ sơ Bệnh nhân
        Optional<PatientProfile> patientOpt = patientProfileRepository.findByEmail(identifier);
        if (patientOpt.isEmpty()) {
            patientOpt = patientProfileRepository.findByUsername(identifier);
        }
        if (patientOpt.isEmpty()) {
            patientOpt = patientProfileRepository.findByPhone(identifier);
        }

        if (patientOpt.isPresent()) {
            PatientProfile patient = patientOpt.get();
            targetEmail = patient.getEmail();
            fullName = patient.getFullName();
        } else {
            // 2. Tìm kiếm trong tài khoản Nhân viên Y tế
            Optional<StaffAccount> staffOpt = staffAccountRepository.findByEmail(identifier);
            if (staffOpt.isEmpty()) {
                staffOpt = staffAccountRepository.findByUsername(identifier);
            }
            if (staffOpt.isEmpty()) {
                staffOpt = staffAccountRepository.findByPhone(identifier);
            }

            if (staffOpt.isPresent()) {
                StaffAccount staff = staffOpt.get();
                targetEmail = staff.getEmail();
                fullName = staff.getFullName();
            } else {
                log.warn("Không tìm thấy tài khoản với thông tin: {}", identifier);
                throw new ResourceNotFoundException("Không tìm thấy tài khoản tương ứng với thông tin '" + identifier + "'. Vui lòng kiểm tra lại email hoặc số điện thoại.");
            }
        }

        if (targetEmail == null || targetEmail.isBlank()) {
            throw new BusinessRuleException("Tài khoản chưa cập nhật địa chỉ email. Vui lòng liên hệ ban quản trị phòng khám để được hỗ trợ.");
        }

        // Sinh mã OTP ngẫu nhiên 6 chữ số
        int randomCode = secureRandom.nextInt(900000) + 100000;
        String otpCode = String.valueOf(randomCode);

        // Lưu vào Redis với TTL – hết hạn sẽ tự biến mất
        otpStore.save(targetEmail, otpCode, Duration.ofSeconds(OTP_EXPIRY_SECONDS));

        // Gửi email
        emailService.sendOtpEmail(targetEmail, fullName, otpCode, OTP_EXPIRY_SECONDS / 60);

        log.info("Yêu cầu OTP quên mật khẩu thành công cho email: {}", targetEmail);

        return OtpResponse.builder()
                .email(targetEmail)
                .expiresInSeconds(OTP_EXPIRY_SECONDS)
                .message("Mã xác thực OTP đã được gửi đến hộp thư " + maskEmail(targetEmail) + ". Vui lòng kiểm tra email để tiếp tục.")
                .devOtp(exposeDevOtp ? otpCode : null)
                .build();
    }

    @Override
    public boolean verifyOtp(VerifyOtpRequest request) {
        String emailKey = request.getEmail().trim().toLowerCase();
        // Key Redis tự hết hạn sau 5 phút, nên "không tìm thấy" bao gồm cả trường hợp đã quá hạn
        OtpStore.OtpRecord entry = otpStore.find(emailKey)
                .orElseThrow(() -> new BusinessRuleException(
                        "Mã OTP không tồn tại hoặc đã hết hiệu lực (quá 5 phút). Vui lòng yêu cầu mã OTP mới."));

        if (!entry.code().equals(request.getOtp().trim())) {
            int failed = otpStore.incrementFailedAttempts(emailKey);
            if (failed >= MAX_FAILED_ATTEMPTS) {
                otpStore.delete(emailKey);
                throw new BusinessRuleException("Bạn đã nhập sai mã OTP quá " + MAX_FAILED_ATTEMPTS + " lần. Yêu cầu đã bị hủy để đảm bảo an toàn.");
            }
            throw new BusinessRuleException("Mã OTP không chính xác. Bạn còn " + (MAX_FAILED_ATTEMPTS - failed) + " lần thử.");
        }

        return true;
    }

    @Audited(entity = "AUTH", action = "RESET_PASSWORD_OTP", id = "request.email", summary = "Đặt lại mật khẩu bằng OTP")
    @Override
    public void resetPasswordWithOtp(ResetPasswordWithOtpRequest request) {
        // Xác thực mã OTP trước
        verifyOtp(new VerifyOtpRequest(request.getEmail(), request.getOtp()));

        // Kiểm tra khớp mật khẩu
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessRuleException("Mật khẩu mới và xác nhận mật khẩu không trùng khớp.");
        }

        if (request.getNewPassword().length() < 6) {
            throw new BusinessRuleException("Mật khẩu mới phải có tối thiểu 6 ký tự để bảo đảm an toàn.");
        }

        String targetEmail = request.getEmail().trim().toLowerCase();
        boolean updated = false;

        // Cập nhật cho Bệnh nhân nếu có
        Optional<PatientProfile> patientOpt = patientProfileRepository.findByEmail(targetEmail);
        if (patientOpt.isPresent()) {
            PatientProfile patient = patientOpt.get();
            patient.setPassword(vn.clinic.security.Passwords.hash(request.getNewPassword()));
            patient.setUpdatedAt(LocalDate.now().format(DateTimeFormatter.ISO_DATE));
            patientProfileRepository.save(patient);
            updated = true;
            log.info("Đặt lại mật khẩu thành công cho bệnh nhân: {}", patient.getUsername());
        }

        // Cập nhật cho Nhân viên y tế nếu có
        Optional<StaffAccount> staffOpt = staffAccountRepository.findByEmail(targetEmail);
        if (staffOpt.isPresent()) {
            StaffAccount staff = staffOpt.get();
            staff.setPassword(vn.clinic.security.Passwords.hash(request.getNewPassword()));
            staff.setUpdatedAt(LocalDate.now().format(DateTimeFormatter.ISO_DATE));
            staffAccountRepository.save(staff);
            updated = true;
            log.info("Đặt lại mật khẩu thành công cho nhân viên: {}", staff.getUsername());
        }

        if (!updated) {
            throw new ResourceNotFoundException("Không tìm thấy tài khoản gắn với email: " + targetEmail);
        }

        // Xóa mã OTP sau khi đổi mật khẩu thành công để tránh tái sử dụng
        otpStore.delete(targetEmail);
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return email;
        }
        int atIndex = email.indexOf("@");
        String name = email.substring(0, atIndex);
        String domain = email.substring(atIndex);
        if (name.length() <= 3) {
            return name.charAt(0) + "***" + domain;
        }
        return name.substring(0, 2) + "***" + name.charAt(name.length() - 1) + domain;
    }
}
