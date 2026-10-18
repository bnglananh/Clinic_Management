package vn.clinic.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.clinic.dto.ApiResponse;
import vn.clinic.dto.ChangePasswordRequest;
import vn.clinic.dto.UpdateProfileRequest;
import vn.clinic.dto.UserProfileDto;
import vn.clinic.service.UserProfileService;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    /**
     * Hiển thị thông tin cá nhân hiện tại
     */
    @GetMapping
    public ResponseEntity<ApiResponse<UserProfileDto>> getCurrentProfile(
            @RequestParam(required = false, defaultValue = "usr-pat-01") String userId) {
        UserProfileDto profile = userProfileService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(profile, "Lấy thông tin cá nhân thành công"));
    }

    /**
     * Xem hồ sơ theo mã người dùng
     */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserProfileDto>> getProfileById(@PathVariable String userId) {
        UserProfileDto profile = userProfileService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(profile, "Lấy thông tin cá nhân thành công"));
    }

    /**
     * Cập nhật thông tin cá nhân
     * Kiểm tra tính hợp lệ của dữ liệu
     */
    @PutMapping
    public ResponseEntity<ApiResponse<UserProfileDto>> updateProfile(
            @RequestParam(required = false, defaultValue = "usr-pat-01") String userId,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserProfileDto updated = userProfileService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật thông tin cá nhân thành công"));
    }

    /**
     * Thay đổi mật khẩu tài khoản cá nhân
     * Kiểm tra mật khẩu hiện tại
     * Kiểm tra yêu cầu bảo mật của mật khẩu mới
     */
    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestParam(required = false, defaultValue = "usr-pat-01") String userId,
            @Valid @RequestBody ChangePasswordRequest request) {
        userProfileService.changePassword(userId, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Đổi mật khẩu thành công"));
    }

    /**
     * Cập nhật ảnh đại diện cá nhân
     */
    @PostMapping("/avatar")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateAvatar(
            @RequestParam(required = false, defaultValue = "usr-pat-01") String userId,
            @RequestBody Map<String, String> payload) {
        String avatarUrl = payload.get("avatarUrl");
        UserProfileDto updated = userProfileService.updateAvatar(userId, avatarUrl);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật ảnh đại diện thành công"));
    }
}
