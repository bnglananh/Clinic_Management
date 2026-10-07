package vn.clinic.service;

import vn.clinic.dto.*;
import vn.clinic.model.UserRole;

import java.util.List;

public interface StaffAccountService {

    List<StaffAccountDto> getAllAccounts(UserRole role, String searchQuery);

    StaffAccountDto getAccountById(String id);

    StaffAccountDto createAccount(CreateStaffRequest request);

    StaffAccountDto updateAccount(String id, UpdateStaffRequest request);

    StaffAccountDto toggleStatus(String id);

    StaffAccountDto assignRoleAndPermissions(String id, AssignRolePermissionsRequest request);

    void resetPassword(String id, String newPassword);

    List<RolePermissionInfo> getRolesAndPermissionsMetadata();
}
