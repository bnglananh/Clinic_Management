package vn.clinic;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import vn.clinic.controller.AuthController;
import vn.clinic.dto.ForgotPasswordRequest;
import vn.clinic.dto.ResetPasswordWithOtpRequest;
import vn.clinic.dto.VerifyOtpRequest;
import vn.clinic.exception.GlobalExceptionHandler;
import vn.clinic.repository.InMemoryPatientProfileRepository;
import vn.clinic.repository.InMemoryStaffAccountRepository;
import vn.clinic.service.AuthServiceImpl;
import vn.clinic.service.EmailService;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("AuthController: REST Endpoints Quên mật khẩu & OTP Tests")
class AuthControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private String capturedOtp;

    @BeforeEach
    void setUp() {
        InMemoryPatientProfileRepository patientRepo = new InMemoryPatientProfileRepository();
        patientRepo.initMockData();

        InMemoryStaffAccountRepository staffRepo = new InMemoryStaffAccountRepository();
        staffRepo.initMockData();

        EmailService mockEmailService = (toEmail, recipientName, otpCode, expiryMinutes) -> {
            capturedOtp = otpCode;
        };

        AuthServiceImpl authService = new AuthServiceImpl(patientRepo, staffRepo, mockEmailService);
        AuthController authController = new AuthController(authService);

        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("POST /api/auth/forgot-password - Thành công")
    void testRequestForgotPasswordSuccess() throws Exception {
        ForgotPasswordRequest req = new ForgotPasswordRequest("an.pham@gmail.com");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is("an.pham@gmail.com")))
                .andExpect(jsonPath("$.data.expiresInSeconds", is(300)))
                .andExpect(jsonPath("$.data.devOtp", notNullValue()));
    }

    @Test
    @DisplayName("POST /api/auth/forgot-password - Email không tồn tại báo lỗi 404")
    void testRequestForgotPasswordNotFound() throws Exception {
        ForgotPasswordRequest req = new ForgotPasswordRequest("unknown@example.com");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("POST /api/auth/verify-otp - Thành công")
    void testVerifyOtpSuccess() throws Exception {
        // Gửi yêu cầu OTP trước
        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new ForgotPasswordRequest("an.pham@gmail.com"))));

        VerifyOtpRequest verifyReq = new VerifyOtpRequest("an.pham@gmail.com", capturedOtp);

        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is(true)));
    }

    @Test
    @DisplayName("POST /api/auth/reset-password - Đổi mật khẩu thành công")
    void testResetPasswordSuccess() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new ForgotPasswordRequest("an.pham@gmail.com"))));

        ResetPasswordWithOtpRequest resetReq = ResetPasswordWithOtpRequest.builder()
                .email("an.pham@gmail.com")
                .otp(capturedOtp)
                .newPassword("Password2026@")
                .confirmPassword("Password2026@")
                .build();

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }
}
