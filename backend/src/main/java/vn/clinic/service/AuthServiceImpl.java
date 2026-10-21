package vn.clinic.service;

import lombok.extern.slf4j.Slf4j;
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

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class AuthServiceImpl implements AuthService {

    private static final long OTP_EXPIRY_SECONDS = 300; // 5 phút
    private static final int MAX_FAILED_ATTEMPTS = 5;

    private final PatientProfileRepository patientProfileRepository;
    private final StaffAccountRepository staffAccountRepository;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    // Lưu trữ thông tin OTP theo địa chỉ email dạng in thường
    private final Map<String, OtpEntry> otpStorage = new ConcurrentHashMap<>();

    public AuthServiceImpl(PatientProfileRepository patientProfileRepository,
                           StaffAccountRepository staffAccountRepository,
                           EmailService emailService) {
        this.patientProfileRepository = patientProfileRepository;
        this.staffAccountRepository = staffAccountRepository;
        this.emailService = emailService;
    }

    private static class OtpEntry {
        final String otpCode;
        final Instant expiryTime;
        int failedAttempts;

        OtpEntry(String otpCode, Instant expiryTime) {
            this.otpCode = otpCode;
            this.expiryTime = expiryTime;
            this.failedAttempts = 0;
        }
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

        // Lưu vào bộ nhớ tạm thời
        Instant expiryTime = Instant.now().plusSeconds(OTP_EXPIRY_SECONDS);
        otpStorage.put(targetEmail.toLowerCase(), new OtpEntry(otpCode, expiryTime));

        // Gửi email
        emailService.sendOtpEmail(targetEmail, fullName, otpCode, OTP_EXPIRY_SECONDS / 60);

        log.info("Yêu cầu OTP quên mật khẩu thành công cho email: {}", targetEmail);

        return OtpResponse.builder()
                .email(targetEmail)
                .expiresInSeconds(OTP_EXPIRY_SECONDS)
                .message("Mã xác thực OTP đã được gửi đến hộp thư " + maskEmail(targetEmail) + ". Vui lòng kiểm tra email để tiếp tục.")
                .devOtp(otpCode) // Hỗ trợ trải nghiệm nhanh
                .build();
    }

    @Override
    public boolean verifyOtp(VerifyOtpRequest request) {
        String emailKey = request.getEmail().trim().toLowerCase();
        OtpEntry entry = otpStorage.get(emailKey);

        if (entry == null) {
            throw new BusinessRuleException("Yêu cầu xác thực OTP không tồn tại hoặc đã hết hạn. Vui lòng gửi lại yêu cầu mới.");
        }

        if (Instant.now().isAfter(entry.expiryTime)) {
            otpStorage.remove(emailKey);
            throw new BusinessRuleException("Mã OTP đã hết hiệu lực (quá 5 phút). Vui lòng yêu cầu mã OTP mới.");
        }

        if (!entry.otpCode.equals(request.getOtp().trim())) {
            entry.failedAttempts++;
            if (entry.failedAttempts >= MAX_FAILED_ATTEMPTS) {
                otpStorage.remove(emailKey);
                throw new BusinessRuleException("Bạn đã nhập sai mã OTP quá " + MAX_FAILED_ATTEMPTS + " lần. Yêu cầu đã bị hủy để đảm bảo an toàn.");
            }
            throw new BusinessRuleException("Mã OTP không chính xác. Bạn còn " + (MAX_FAILED_ATTEMPTS - entry.failedAttempts) + " lần thử.");
        }

        return true;
    }

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
            patient.setPassword(request.getNewPassword());
            patient.setUpdatedAt(LocalDate.now().format(DateTimeFormatter.ISO_DATE));
            patientProfileRepository.save(patient);
            updated = true;
            log.info("Đặt lại mật khẩu thành công cho bệnh nhân: {}", patient.getUsername());
        }

        // Cập nhật cho Nhân viên y tế nếu có
        Optional<StaffAccount> staffOpt = staffAccountRepository.findByEmail(targetEmail);
        if (staffOpt.isPresent()) {
            StaffAccount staff = staffOpt.get();
            staff.setPassword(request.getNewPassword());
            staff.setUpdatedAt(LocalDate.now().format(DateTimeFormatter.ISO_DATE));
            staffAccountRepository.save(staff);
            updated = true;
            log.info("Đặt lại mật khẩu thành công cho nhân viên: {}", staff.getUsername());
        }

        if (!updated) {
            throw new ResourceNotFoundException("Không tìm thấy tài khoản gắn với email: " + targetEmail);
        }

        // Xóa mã OTP sau khi đổi mật khẩu thành công để tránh tái sử dụng
        otpStorage.remove(targetEmail);
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
