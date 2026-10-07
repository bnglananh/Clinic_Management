package vn.clinic.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.clinic.dto.*;
import vn.clinic.model.UserRole;
import vn.clinic.service.StaffAccountService;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class StaffAccountController {

    private final StaffAccountService staffAccountService;

    /**
     * UC019 - Bước 2: Hiển thị danh sách tài khoản nhân viên (hỗ trợ lọc theo vai trò và tìm kiếm)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StaffAccountDto>>> getAllAccounts(
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false, name = "q") String searchQuery) {
        List<StaffAccountDto> list = staffAccountService.getAllAccounts(role, searchQuery);
        return ResponseEntity.ok(ApiResponse.success(list, "Lấy danh sách tài khoản nhân viên thành công"));
    }

    /**
     * UC019: Xem chi tiết tài khoản nhân viên theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StaffAccountDto>> getAccountById(@PathVariable String id) {
        StaffAccountDto account = staffAccountService.getAccountById(id);
        return ResponseEntity.ok(ApiResponse.success(account, "Lấy thông tin tài khoản thành công"));
    }

    /**
     * UC019 - Bước 3: Tạo mới tài khoản nhân viên
     * BR 3.1: Kiểm tra trùng thông tin đăng nhập
     */
    @PostMapping
    public ResponseEntity<ApiResponse<StaffAccountDto>> createAccount(
            @Valid @RequestBody CreateStaffRequest request) {
        StaffAccountDto created = staffAccountService.createAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Tạo tài khoản nhân viên thành công"));
    }

    /**
     * UC019 - Bước 3 & 6: Cập nhật thông tin tài khoản
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StaffAccountDto>> updateAccount(
            @PathVariable String id,
            @Valid @RequestBody UpdateStaffRequest request) {
        StaffAccountDto updated = staffAccountService.updateAccount(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật thông tin nhân viên thành công"));
    }

    /**
     * UC019 - Bước 3: Khóa hoặc mở khóa tài khoản
     * BR 3.2: Tài khoản bị khóa không thể đăng nhập
     * BR 3.3: Không cho phép khóa tài khoản quản trị viên cuối cùng
     */
    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<ApiResponse<StaffAccountDto>> toggleAccountStatus(@PathVariable String id) {
        StaffAccountDto result = staffAccountService.toggleStatus(id);
        String action = result.getStatus().name().equals("ACTIVE") ? "mở khóa" : "khóa";
        return ResponseEntity.ok(ApiResponse.success(result, "Đã " + action + " tài khoản thành công"));
    }

    /**
     * UC019 - Bước 4 & 5: Gán vai trò và phân quyền (RBAC)
     */
    @PutMapping("/{id}/permissions")
    public ResponseEntity<ApiResponse<StaffAccountDto>> assignRoleAndPermissions(
            @PathVariable String id,
            @Valid @RequestBody AssignRolePermissionsRequest request) {
        StaffAccountDto updated = staffAccountService.assignRoleAndPermissions(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật vai trò và phân quyền thành công"));
    }

    /**
     * UC019: Đặt lại mật khẩu nhân viên
     */
    @PostMapping("/{id}/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @PathVariable String id,
            @RequestParam(required = false) String newPassword) {
        staffAccountService.resetPassword(id, newPassword);
        return ResponseEntity.ok(ApiResponse.success(null, "Đặt lại mật khẩu tài khoản thành công"));
    }

    /**
     * UC019: Danh mục vai trò và quyền hạn RBAC của hệ thống
     */
    @GetMapping("/roles-permissions")
    public ResponseEntity<ApiResponse<List<RolePermissionInfo>>> getRolesAndPermissionsMetadata() {
        List<RolePermissionInfo> metadata = staffAccountService.getRolesAndPermissionsMetadata();
        return ResponseEntity.ok(ApiResponse.success(metadata, "Lấy danh mục vai trò và quyền hạn thành công"));
    }
}
