package vn.clinic;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import vn.clinic.controller.NotificationController;
import vn.clinic.controller.UserProfileController;
import vn.clinic.dto.ChangePasswordRequest;
import vn.clinic.dto.SendNotificationRequest;
import vn.clinic.dto.UpdateProfileRequest;
import vn.clinic.exception.GlobalExceptionHandler;
import vn.clinic.model.NotificationType;
import vn.clinic.repository.InMemoryNotificationRepository;
import vn.clinic.repository.InMemoryPatientProfileRepository;
import vn.clinic.service.NotificationServiceImpl;
import vn.clinic.service.UserProfileServiceImpl;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("UC01 & UC08: UserProfileController & NotificationController Endpoints Tests")
class UserProfileAndNotificationControllerTest {

    private MockMvc profileMockMvc;
    private MockMvc notifMockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        InMemoryPatientProfileRepository profileRepo = new InMemoryPatientProfileRepository();
        profileRepo.initMockData();
        UserProfileServiceImpl profileService = new UserProfileServiceImpl(profileRepo);
        UserProfileController profileController = new UserProfileController(profileService);

        profileMockMvc = MockMvcBuilders.standaloneSetup(profileController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        InMemoryNotificationRepository notifRepo = new InMemoryNotificationRepository();
        notifRepo.initMockData();
        NotificationServiceImpl notifService = new NotificationServiceImpl(notifRepo);
        NotificationController notifController = new NotificationController(notifService);

        notifMockMvc = MockMvcBuilders.standaloneSetup(notifController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        objectMapper = new ObjectMapper();
    }

    // --- Tests for UC01 (Profile) ---
    @Test
    @DisplayName("GET /api/profile - Lấy thông tin cá nhân hiện tại")
    void testGetCurrentProfile() throws Exception {
        profileMockMvc.perform(get("/api/profile")
                        .param("userId", "usr-pat-01")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Phạm Văn An"))
                .andExpect(jsonPath("$.data.phone").value("0977889900"));
    }

    @Test
    @DisplayName("PUT /api/profile - Cập nhật thông tin cá nhân")
    void testUpdateProfile() throws Exception {
        UpdateProfileRequest req = UpdateProfileRequest.builder()
                .fullName("Phạm Văn An (Updated)")
                .phone("0977889900")
                .email("an.pham.test@smartclinic.vn")
                .dateOfBirth("1990-05-15")
                .gender("NAM")
                .build();

        profileMockMvc.perform(put("/api/profile")
                        .param("userId", "usr-pat-01")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Phạm Văn An (Updated)"));
    }

    @Test
    @DisplayName("PUT /api/profile/change-password - Đổi mật khẩu thành công")
    void testChangePasswordSuccess() throws Exception {
        ChangePasswordRequest req = ChangePasswordRequest.builder()
                .currentPassword("password123")
                .newPassword("brandNewPassword123")
                .confirmPassword("brandNewPassword123")
                .build();

        profileMockMvc.perform(put("/api/profile/change-password")
                        .param("userId", "usr-pat-01")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message", containsString("thành công")));
    }

    // --- Tests for UC08 (Notifications) ---
    @Test
    @DisplayName("GET /api/notifications - Lấy danh sách thông báo")
    void testGetNotifications() throws Exception {
        notifMockMvc.perform(get("/api/notifications")
                        .param("userId", "usr-pat-01")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(5)));
    }

    @Test
    @DisplayName("GET /api/notifications/summary - Lấy tóm tắt và số lượng chưa đọc")
    void testGetNotificationSummary() throws Exception {
        notifMockMvc.perform(get("/api/notifications/summary")
                        .param("userId", "usr-pat-01")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.total").value(5))
                .andExpect(jsonPath("$.data.unreadCount").value(2));
    }

    @Test
    @DisplayName("PATCH /api/notifications/NOTIF-01/read - Đánh dấu một thông báo là đã đọc")
    void testMarkNotificationAsRead() throws Exception {
        notifMockMvc.perform(patch("/api/notifications/NOTIF-01/read")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.read").value(true));
    }

    @Test
    @DisplayName("PATCH /api/notifications/mark-all-read - Đánh dấu tất cả thông báo là đã đọc")
    void testMarkAllNotificationsAsRead() throws Exception {
        notifMockMvc.perform(patch("/api/notifications/mark-all-read")
                        .param("userId", "usr-pat-01")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("POST /api/notifications - Gửi thông báo sự kiện mới")
    void testSendNewNotification() throws Exception {
        SendNotificationRequest req = SendNotificationRequest.builder()
                .userId("usr-pat-01")
                .title("Thông báo khám mới")
                .content("Bác sĩ đã tạo đơn thuốc điện tử cho bạn.")
                .type(NotificationType.MEDICAL_RECORD)
                .referenceId("PRES-2026-099")
                .build();

        notifMockMvc.perform(post("/api/notifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Thông báo khám mới"));
    }
}
