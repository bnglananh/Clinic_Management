package vn.clinic.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.clinic.dto.*;
import vn.clinic.exception.BusinessRuleException;
import vn.clinic.exception.DuplicateResourceException;
import vn.clinic.exception.ResourceNotFoundException;
import vn.clinic.model.AccountStatus;
import vn.clinic.model.Permission;
import vn.clinic.model.StaffAccount;
import vn.clinic.model.UserRole;
import vn.clinic.repository.StaffAccountRepository;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StaffAccountServiceImpl implements StaffAccountService {

    private final StaffAccountRepository repository;

    @Override
    public List<StaffAccountDto> getAllAccounts(UserRole role, String searchQuery) {
        List<StaffAccount> list = (role != null) ? repository.findByRole(role) : repository.findAll();

        if (searchQuery != null && !searchQuery.isBlank()) {
            String query = searchQuery.trim().toLowerCase();
            list = list.stream().filter(acc ->
                    (acc.getFullName() != null && acc.getFullName().toLowerCase().contains(query)) ||
                    (acc.getUsername() != null && acc.getUsername().toLowerCase().contains(query)) ||
                    (acc.getEmail() != null && acc.getEmail().toLowerCase().contains(query)) ||
                    (acc.getPhone() != null && acc.getPhone().contains(query)) ||
                    (acc.getId() != null && acc.getId().toLowerCase().contains(query)) ||
                    (acc.getDepartment() != null && acc.getDepartment().toLowerCase().contains(query))
            ).collect(Collectors.toList());
        }

        // Sort by ID descending or newly created
        list.sort((a, b) -> b.getId().compareTo(a.getId()));

        return list.stream()
                .map(StaffAccountDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public StaffAccountDto getAccountById(String id) {
        StaffAccount account = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản nhân viên có mã: " + id));
        return StaffAccountDto.fromEntity(account);
    }

    @Override
    public StaffAccountDto createAccount(CreateStaffRequest request) {
        log.info("Creating new staff account: username={}, email={}", request.getUsername(), request.getEmail());

        // SRS UC019 BR 3.1: Kiểm tra trùng tên đăng nhập
        if (repository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Tên đăng nhập '" + request.getUsername() + "' đã được sử dụng trong hệ thống.");
        }

        // Kiểm tra trùng email
        if (repository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Địa chỉ email '" + request.getEmail() + "' đã được đăng ký.");
        }

        // Kiểm tra trùng số điện thoại
        if (repository.existsByPhone(request.getPhone())) {
            throw new DuplicateResourceException("Số điện thoại '" + request.getPhone() + "' đã được sử dụng.");
        }

        // Xác định quyền hạn (permissions)
        Set<String> assignedPermissions = request.getPermissions();
        if (assignedPermissions == null || assignedPermissions.isEmpty()) {
            assignedPermissions = Permission.getDefaultPermissions(request.getRole()).stream()
                    .map(Enum::name)
                    .collect(Collectors.toSet());
        }

        String today = LocalDate.now().format(DateTimeFormatter.ISO_DATE);

        StaffAccount newAccount = StaffAccount.builder()
                .username(request.getUsername().trim())
                .password("$2a$10$defaultMockHashedPassword") // Mock encrypted password
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .phone(request.getPhone().trim())
                .role(request.getRole())
                .department(request.getDepartment().trim())
                .title(request.getTitle() != null ? request.getTitle().trim() : "")
                .status(AccountStatus.ACTIVE)
                .permissions(assignedPermissions)
                .createdAt(today)
                .updatedAt(today)
                .build();

        StaffAccount saved = repository.save(newAccount);
        log.info("Staff account created successfully: id={}, username={}", saved.getId(), saved.getUsername());
        return StaffAccountDto.fromEntity(saved);
    }

    @Override
    public StaffAccountDto updateAccount(String id, UpdateStaffRequest request) {
        StaffAccount account = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản nhân viên có mã: " + id));

        // Kiểm tra email không được trùng với tài khoản khác
        repository.findByEmail(request.getEmail()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new DuplicateResourceException("Địa chỉ email '" + request.getEmail() + "' đã thuộc về nhân viên khác.");
            }
        });

        // Kiểm tra số điện thoại không trùng với tài khoản khác
        repository.findByPhone(request.getPhone()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new DuplicateResourceException("Số điện thoại '" + request.getPhone() + "' đã thuộc về nhân viên khác.");
            }
        });

        account.setFullName(request.getFullName().trim());
        account.setEmail(request.getEmail().trim().toLowerCase());
        account.setPhone(request.getPhone().trim());
        account.setRole(request.getRole());
        account.setDepartment(request.getDepartment().trim());
        account.setTitle(request.getTitle() != null ? request.getTitle().trim() : "");

        if (request.getPermissions() != null && !request.getPermissions().isEmpty()) {
            account.setPermissions(request.getPermissions());
        }

        account.setUpdatedAt(LocalDate.now().format(DateTimeFormatter.ISO_DATE));
        StaffAccount updated = repository.save(account);
        return StaffAccountDto.fromEntity(updated);
    }

    @Override
    public StaffAccountDto toggleStatus(String id) {
        StaffAccount account = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản nhân viên có mã: " + id));

        // SRS UC019 BR 3.3: "Hệ thống không cho phép khóa tài khoản quản trị viên cuối cùng có quyền quản trị hệ thống."
        if (account.getRole() == UserRole.ADMIN && account.getStatus() == AccountStatus.ACTIVE) {
            long activeAdminCount = repository.countByRoleAndStatus(UserRole.ADMIN, AccountStatus.ACTIVE);
            if (activeAdminCount <= 1) {
                log.warn("Attempted to lock the last active admin account: id={}, username={}", account.getId(), account.getUsername());
                throw new BusinessRuleException("Không thể khóa tài khoản quản trị viên cuối cùng của hệ thống. Bắt buộc phải duy trì ít nhất một Quản trị viên đang hoạt động (SRS BR 3.3).");
            }
        }

        AccountStatus newStatus = (account.getStatus() == AccountStatus.ACTIVE)
                ? AccountStatus.LOCKED
                : AccountStatus.ACTIVE;

        account.setStatus(newStatus);
        account.setUpdatedAt(LocalDate.now().format(DateTimeFormatter.ISO_DATE));
        StaffAccount saved = repository.save(account);

        log.info("Toggled account status: id={}, newStatus={}", saved.getId(), saved.getStatus());
        return StaffAccountDto.fromEntity(saved);
    }

    @Override
    public StaffAccountDto assignRoleAndPermissions(String id, AssignRolePermissionsRequest request) {
        StaffAccount account = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản nhân viên có mã: " + id));

        account.setRole(request.getRole());

        // Kiểm tra quyền được cấp (SRS BR 4.1)
        Set<String> newPermissions = request.getPermissions();
        if (newPermissions == null || newPermissions.isEmpty()) {
            newPermissions = Permission.getDefaultPermissions(request.getRole()).stream()
                    .map(Enum::name)
                    .collect(Collectors.toSet());
        }

        account.setPermissions(newPermissions);
        account.setUpdatedAt(LocalDate.now().format(DateTimeFormatter.ISO_DATE));
        StaffAccount saved = repository.save(account);

        return StaffAccountDto.fromEntity(saved);
    }

    @Override
    public void resetPassword(String id, String newPassword) {
        StaffAccount account = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản nhân viên có mã: " + id));

        // Cập nhật mật khẩu mới (mã hóa mock)
        account.setPassword("$2a$10$newResetMockPassword");
        account.setUpdatedAt(LocalDate.now().format(DateTimeFormatter.ISO_DATE));
        repository.save(account);
        log.info("Reset password for account: id={}", id);
    }

    @Override
    public List<RolePermissionInfo> getRolesAndPermissionsMetadata() {
        List<RolePermissionInfo> list = new ArrayList<>();
        for (UserRole role : UserRole.values()) {
            if (role == UserRole.PATIENT) continue; // Only staff roles in UC019
            Set<Permission> defaultPerms = Permission.getDefaultPermissions(role);
            List<RolePermissionInfo.PermissionItem> permItems = defaultPerms.stream()
                    .map(p -> RolePermissionInfo.PermissionItem.builder()
                            .code(p.name())
                            .description(p.getDescription())
                            .build())
                    .collect(Collectors.toList());

            list.add(RolePermissionInfo.builder()
                    .role(role.name())
                    .description(role.getDescription())
                    .defaultPermissions(permItems)
                    .build());
        }
        return list;
    }
}
