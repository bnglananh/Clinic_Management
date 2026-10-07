package vn.clinic;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import vn.clinic.dto.ChangePasswordRequest;
import vn.clinic.dto.UpdateProfileRequest;
import vn.clinic.dto.UserProfileDto;
import vn.clinic.exception.BusinessRuleException;
import vn.clinic.exception.DuplicateResourceException;
import vn.clinic.exception.ResourceNotFoundException;
import vn.clinic.repository.InMemoryPatientProfileRepository;
import vn.clinic.service.UserProfileService;
import vn.clinic.service.UserProfileServiceImpl;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("UC01: Quản lý tài khoản cá nhân Tests")
class UserProfileServiceTest {

    private InMemoryPatientProfileRepository repository;
    private UserProfileService service;

    @BeforeEach
    void setUp() {
        repository = new InMemoryPatientProfileRepository();
        repository.initMockData();
        service = new UserProfileServiceImpl(repository);
    }

    @Test
    @DisplayName("UC01 - Bước 2: Hiển thị thông tin cá nhân hiện tại thành công")
    void testGetProfileSuccess() {
        UserProfileDto profile = service.getProfile("usr-pat-01");
        assertNotNull(profile);
        assertEquals("Phạm Văn An", profile.getFullName());
        assertEquals("0977889900", profile.getPhone());
        assertEquals("an.pham@gmail.com", profile.getEmail());
        assertEquals("O+", profile.getBloodType());
    }

    @Test
    @DisplayName("UC01: Báo lỗi khi không tìm thấy người dùng")
    void testGetProfileNotFound() {
        assertThrows(ResourceNotFoundException.class, () -> service.getProfile("non-existent-id"));
    }

    @Test
    @DisplayName("UC01 - Bước 3, 5, 7: Cập nhật thông tin cá nhân thành công")
    void testUpdateProfileSuccess() {
        UpdateProfileRequest req = UpdateProfileRequest.builder()
                .fullName("Phạm Văn An (Đã đổi)")
                .phone("0977889900")
                .email("an.pham.new@gmail.com")
                .dateOfBirth("1990-05-15")
                .gender("NAM")
                .address("456 Hai Bà Trưng, Quận 3, TP. Hồ Chí Minh")
                .bloodType("O+")
                .allergies("Không còn dị ứng")
                .build();

        UserProfileDto updated = service.updateProfile("usr-pat-01", req);
        assertEquals("Phạm Văn An (Đã đổi)", updated.getFullName());
        assertEquals("an.pham.new@gmail.com", updated.getEmail());
        assertEquals("456 Hai Bà Trưng, Quận 3, TP. Hồ Chí Minh", updated.getAddress());
    }

    @Test
    @DisplayName("UC01 - Quy tắc 3.1: Không cho phép cập nhật email trùng với người khác")
    void testUpdateProfileDuplicateEmail() {
        // usr-pat-02 đang dùng email huong.tran@gmail.com
        UpdateProfileRequest req = UpdateProfileRequest.builder()
                .fullName("Phạm Văn An")
                .phone("0977889900")
                .email("huong.tran@gmail.com") // Trùng email của usr-pat-02
                .build();

        assertThrows(DuplicateResourceException.class, () -> service.updateProfile("usr-pat-01", req));
    }

    @Test
    @DisplayName("UC01 - Bước 4: Đổi mật khẩu thành công")
    void testChangePasswordSuccess() {
        ChangePasswordRequest req = ChangePasswordRequest.builder()
                .currentPassword("password123")
                .newPassword("newSecurePassword456")
                .confirmPassword("newSecurePassword456")
                .build();

        assertDoesNotThrow(() -> service.changePassword("usr-pat-01", req));
    }

    @Test
    @DisplayName("UC01 - Quy tắc 4.1: Báo lỗi khi mật khẩu hiện tại không chính xác")
    void testChangePasswordIncorrectCurrentPassword() {
        ChangePasswordRequest req = ChangePasswordRequest.builder()
                .currentPassword("wrongPassword")
                .newPassword("newPassword123")
                .confirmPassword("newPassword123")
                .build();

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            service.changePassword("usr-pat-01", req);
        });
        assertTrue(ex.getMessage().contains("không chính xác"));
    }

    @Test
    @DisplayName("UC01: Báo lỗi khi mật khẩu mới và xác nhận mật khẩu không khớp")
    void testChangePasswordMismatchConfirm() {
        ChangePasswordRequest req = ChangePasswordRequest.builder()
                .currentPassword("password123")
                .newPassword("newPassword123")
                .confirmPassword("differentPassword")
                .build();

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            service.changePassword("usr-pat-01", req);
        });
        assertTrue(ex.getMessage().contains("không trùng khớp"));
    }

    @Test
    @DisplayName("UC01 - Quy tắc 4.2: Báo lỗi khi mật khẩu mới trùng mật khẩu cũ")
    void testChangePasswordSameAsOld() {
        ChangePasswordRequest req = ChangePasswordRequest.builder()
                .currentPassword("password123")
                .newPassword("password123")
                .confirmPassword("password123")
                .build();

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            service.changePassword("usr-pat-01", req);
        });
        assertTrue(ex.getMessage().contains("không được trùng"));
    }

    @Test
    @DisplayName("UC01 - Quy tắc 4.2: Báo lỗi khi mật khẩu mới ngắn hơn 6 ký tự")
    void testChangePasswordTooShort() {
        ChangePasswordRequest req = ChangePasswordRequest.builder()
                .currentPassword("password123")
                .newPassword("12345")
                .confirmPassword("12345")
                .build();

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            service.changePassword("usr-pat-01", req);
        });
        assertTrue(ex.getMessage().contains("tối thiểu 6 ký tự"));
    }
}
