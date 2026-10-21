package vn.clinic;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import vn.clinic.dto.ForgotPasswordRequest;
import vn.clinic.dto.OtpResponse;
import vn.clinic.dto.ResetPasswordWithOtpRequest;
import vn.clinic.dto.VerifyOtpRequest;
import vn.clinic.exception.BusinessRuleException;
import vn.clinic.exception.ResourceNotFoundException;
import vn.clinic.model.PatientProfile;
import vn.clinic.repository.InMemoryPatientProfileRepository;
import vn.clinic.repository.InMemoryStaffAccountRepository;
import vn.clinic.service.AuthServiceImpl;
import vn.clinic.service.EmailService;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("AuthService: Quên mật khẩu & Gửi mã OTP qua mail Tests")
class AuthServiceTest {

    private AuthServiceImpl authService;
    private InMemoryPatientProfileRepository patientRepo;
    private InMemoryStaffAccountRepository staffRepo;
    private String capturedOtp;
    private String capturedEmail;

    @BeforeEach
    void setUp() {
        patientRepo = new InMemoryPatientProfileRepository();
        patientRepo.initMockData();

        staffRepo = new InMemoryStaffAccountRepository();
        staffRepo.initMockData();

        EmailService mockEmailService = (toEmail, recipientName, otpCode, expiryMinutes) -> {
            capturedEmail = toEmail;
            capturedOtp = otpCode;
        };

        authService = new AuthServiceImpl(patientRepo, staffRepo, mockEmailService);
    }

    @Test
    @DisplayName("Yêu cầu gửi OTP thành công cho email bệnh nhân hợp lệ")
    void testRequestOtpSuccessPatient() {
        ForgotPasswordRequest req = ForgotPasswordRequest.builder()
                .email("an.pham@gmail.com")
                .build();

        OtpResponse res = authService.requestForgotPasswordOtp(req);

        assertNotNull(res);
        assertEquals("an.pham@gmail.com", res.getEmail());
        assertEquals(300, res.getExpiresInSeconds());
        assertNotNull(capturedOtp);
        assertEquals(6, capturedOtp.length());
        assertEquals("an.pham@gmail.com", capturedEmail);
    }

    @Test
    @DisplayName("Yêu cầu gửi OTP thành công bằng username bác sĩ")
    void testRequestOtpSuccessStaffByUsername() {
        ForgotPasswordRequest req = ForgotPasswordRequest.builder()
                .email("hoang.tran")
                .build();

        OtpResponse res = authService.requestForgotPasswordOtp(req);

        assertNotNull(res);
        assertEquals("hoang.tran@smartclinic.vn", res.getEmail());
        assertNotNull(capturedOtp);
    }

    @Test
    @DisplayName("Yêu cầu gửi OTP thất bại khi không tìm thấy tài khoản")
    void testRequestOtpUserNotFound() {
        ForgotPasswordRequest req = ForgotPasswordRequest.builder()
                .email("notfound@gmail.com")
                .build();

        assertThrows(ResourceNotFoundException.class, () -> authService.requestForgotPasswordOtp(req));
    }

    @Test
    @DisplayName("Xác thực OTP thành công")
    void testVerifyOtpSuccess() {
        authService.requestForgotPasswordOtp(new ForgotPasswordRequest("an.pham@gmail.com"));

        VerifyOtpRequest verifyReq = new VerifyOtpRequest("an.pham@gmail.com", capturedOtp);
        boolean result = authService.verifyOtp(verifyReq);

        assertTrue(result);
    }

    @Test
    @DisplayName("Xác thực OTP thất bại do sai mã OTP")
    void testVerifyOtpWrongCode() {
        authService.requestForgotPasswordOtp(new ForgotPasswordRequest("an.pham@gmail.com"));

        VerifyOtpRequest verifyReq = new VerifyOtpRequest("an.pham@gmail.com", "999999");
        assertThrows(BusinessRuleException.class, () -> authService.verifyOtp(verifyReq));
    }

    @Test
    @DisplayName("Đặt lại mật khẩu thành công bằng OTP")
    void testResetPasswordWithOtpSuccess() {
        authService.requestForgotPasswordOtp(new ForgotPasswordRequest("an.pham@gmail.com"));

        ResetPasswordWithOtpRequest resetReq = ResetPasswordWithOtpRequest.builder()
                .email("an.pham@gmail.com")
                .otp(capturedOtp)
                .newPassword("newSecurePass2026")
                .confirmPassword("newSecurePass2026")
                .build();

        assertDoesNotThrow(() -> authService.resetPasswordWithOtp(resetReq));

        PatientProfile updatedPatient = patientRepo.findByEmail("an.pham@gmail.com").orElseThrow();
        assertEquals("newSecurePass2026", updatedPatient.getPassword());

        // Sau khi đã đổi mật khẩu, mã OTP phải bị hủy
        assertThrows(BusinessRuleException.class, () -> authService.verifyOtp(new VerifyOtpRequest("an.pham@gmail.com", capturedOtp)));
    }

    @Test
    @DisplayName("Đặt lại mật khẩu thất bại khi mật khẩu xác nhận không khớp")
    void testResetPasswordMismatch() {
        authService.requestForgotPasswordOtp(new ForgotPasswordRequest("an.pham@gmail.com"));

        ResetPasswordWithOtpRequest resetReq = ResetPasswordWithOtpRequest.builder()
                .email("an.pham@gmail.com")
                .otp(capturedOtp)
                .newPassword("newSecurePass2026")
                .confirmPassword("differentPassword")
                .build();

        assertThrows(BusinessRuleException.class, () -> authService.resetPasswordWithOtp(resetReq));
    }
}
