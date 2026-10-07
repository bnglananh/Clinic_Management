package vn.clinic;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import vn.clinic.dto.AssignRolePermissionsRequest;
import vn.clinic.dto.CreateStaffRequest;
import vn.clinic.dto.StaffAccountDto;
import vn.clinic.exception.BusinessRuleException;
import vn.clinic.exception.DuplicateResourceException;
import vn.clinic.model.AccountStatus;
import vn.clinic.model.UserRole;
import vn.clinic.repository.InMemoryStaffAccountRepository;
import vn.clinic.service.StaffAccountService;
import vn.clinic.service.StaffAccountServiceImpl;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("UC019: Quản lý tài khoản và phân quyền Tests")
class StaffAccountServiceTest {

    private InMemoryStaffAccountRepository repository;
    private StaffAccountService service;

    @BeforeEach
    void setUp() {
        repository = new InMemoryStaffAccountRepository();
        repository.initMockData();
        service = new StaffAccountServiceImpl(repository);
    }

    @Test
    @DisplayName("UC019 - Bước 2: Lấy danh sách tài khoản thành công và lọc theo vai trò")
    void testGetAllAccountsAndFilter() {
        List<StaffAccountDto> all = service.getAllAccounts(null, null);
        assertNotNull(all);
        assertEquals(7, all.size(), "Dữ liệu mock ban đầu phải có 7 tài khoản nhân viên");

        List<StaffAccountDto> doctors = service.getAllAccounts(UserRole.DOCTOR, null);
        assertEquals(3, doctors.size(), "Phải có đúng 3 bác sĩ");

        List<StaffAccountDto> searchResult = service.getAllAccounts(null, "Trần Minh Hoàng");
        assertEquals(1, searchResult.size());
        assertEquals("STAFF-01", searchResult.get(0).getId());
    }

    @Test
    @DisplayName("UC019 - Bước 3: Tạo mới tài khoản nhân viên thành công")
    void testCreateAccountSuccess() {
        CreateStaffRequest req = CreateStaffRequest.builder()
                .fullName("BS.CKI Phạm Tuấn Anh")
                .username("tuananh.pham")
                .email("tuananh.pham@smartclinic.vn")
                .phone("0918999888")
                .role(UserRole.DOCTOR)
                .department("Khoa Ngoại Tổng Quát")
                .title("Bác sĩ Ngoại khoa")
                .build();

        StaffAccountDto created = service.createAccount(req);
        assertNotNull(created);
        assertNotNull(created.getId());
        assertEquals("tuananh.pham", created.getUsername());
        assertEquals(AccountStatus.ACTIVE, created.getStatus());
        assertFalse(created.getPermissions().isEmpty(), "Phải được gán quyền mặc định của bác sĩ");
    }

    @Test
    @DisplayName("UC019 - Quy tắc 3.1: Cảnh báo trùng tên đăng nhập hoặc email")
    void testCreateAccountDuplicateUsernameOrEmail() {
        // Trùng username với STAFF-01
        CreateStaffRequest req1 = CreateStaffRequest.builder()
                .fullName("Trần Minh Hoàng 2")
                .username("hoang.tran")
                .email("hoang2@smartclinic.vn")
                .phone("0919111222")
                .role(UserRole.DOCTOR)
                .department("Khoa Tim Mạch")
                .build();

        assertThrows(DuplicateResourceException.class, () -> service.createAccount(req1),
                "Phải cảnh báo trùng tên đăng nhập (BR 3.1)");

        // Trùng email với STAFF-02
        CreateStaffRequest req2 = CreateStaffRequest.builder()
                .fullName("Người mới")
                .username("new.user")
                .email("lan.nguyen@smartclinic.vn")
                .phone("0919333444")
                .role(UserRole.DOCTOR)
                .department("Khoa Nội")
                .build();

        assertThrows(DuplicateResourceException.class, () -> service.createAccount(req2),
                "Phải cảnh báo trùng email");
    }

    @Test
    @DisplayName("UC019 - Khóa và mở khóa tài khoản nhân viên thông thường")
    void testToggleStatusStaff() {
        // STAFF-01 đang ACTIVE -> Khóa
        StaffAccountDto locked = service.toggleStatus("STAFF-01");
        assertEquals(AccountStatus.LOCKED, locked.getStatus());

        // STAFF-01 đang LOCKED -> Mở khóa
        StaffAccountDto unlocked = service.toggleStatus("STAFF-01");
        assertEquals(AccountStatus.ACTIVE, unlocked.getStatus());
    }

    @Test
    @DisplayName("UC019 - Quy tắc 3.3: Không cho phép khóa tài khoản quản trị viên cuối cùng của hệ thống")
    void testCannotLockLastAdminAccount() {
        // STAFF-06 là ADMIN duy nhất đang ACTIVE
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            service.toggleStatus("STAFF-06");
        });

        assertTrue(ex.getMessage().contains("cuối cùng"), "Thông báo phải chỉ rõ không thể khóa admin cuối cùng");
    }

    @Test
    @DisplayName("UC019 - Cho phép khóa Admin khi hệ thống còn Admin active khác")
    void testCanLockAdminWhenMultipleAdminsExist() {
        // Thêm Admin thứ 2
        CreateStaffRequest req = CreateStaffRequest.builder()
                .fullName("Admin Phụ")
                .username("admin.secondary")
                .email("admin2@smartclinic.vn")
                .phone("0988111222")
                .role(UserRole.ADMIN)
                .department("Ban Giám Đốc")
                .build();
        service.createAccount(req);

        // Lúc này có 2 Admin active, được phép khóa STAFF-06
        StaffAccountDto locked = service.toggleStatus("STAFF-06");
        assertEquals(AccountStatus.LOCKED, locked.getStatus());
    }

    @Test
    @DisplayName("UC019 - Bước 4 & 5: Gán vai trò và phân quyền (RBAC)")
    void testAssignRoleAndPermissions() {
        AssignRolePermissionsRequest req = AssignRolePermissionsRequest.builder()
                .role(UserRole.DOCTOR)
                .permissions(Set.of("EXAMINE_PATIENT", "PRESCRIBE_MEDICATION", "VIEW_MEDICAL_HISTORY"))
                .build();

        StaffAccountDto updated = service.assignRoleAndPermissions("STAFF-04", req);
        assertEquals(UserRole.DOCTOR, updated.getRole());
        assertEquals(3, updated.getPermissions().size());
        assertTrue(updated.getPermissions().contains("EXAMINE_PATIENT"));
    }

    @Test
    @DisplayName("UC019: Đặt lại mật khẩu tài khoản thành công")
    void testResetPassword() {
        assertDoesNotThrow(() -> service.resetPassword("STAFF-01", "NewPassword123@"));
    }
}
