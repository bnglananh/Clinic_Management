package vn.clinic.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import vn.clinic.model.AccountStatus;
import vn.clinic.model.Permission;
import vn.clinic.model.StaffAccount;
import vn.clinic.model.UserRole;
import vn.clinic.repository.PatientProfileRepository;
import vn.clinic.repository.StaffAccountRepository;

import java.time.LocalDate;
import java.util.stream.Collectors;

/**
 * Khi khởi động:
 * <ol>
 *   <li>Bảo đảm có 3 tài khoản nhân viên demo khớp với trang đăng nhập (letan / bacsi / admin);
 *       mã bác sĩ usr-doc-01 trùng với dữ liệu lịch hẹn và hàng đợi mẫu.</li>
 *   <li>Băm BCrypt mọi mật khẩu còn lưu dạng chữ thường / hash giả, mặc định là "123456" (chỉ dùng cho demo).</li>
 * </ol>
 */
@Slf4j
@Component
@Order(10)
public class DemoAccountInitializer implements ApplicationRunner {

    static final String DEMO_PASSWORD = "123456";

    private final StaffAccountRepository staffRepository;
    private final PatientProfileRepository patientRepository;

    public DemoAccountInitializer(StaffAccountRepository staffRepository, PatientProfileRepository patientRepository) {
        this.staffRepository = staffRepository;
        this.patientRepository = patientRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        ensureStaff("usr-rec-01", "letan", "Nguyễn Thị Mai", UserRole.RECEPTIONIST,
                "letan@smartclinic.vn", "0903123456", "Trưởng nhóm Tiếp đón & Thu ngân", "Khoa Khám Bệnh");
        ensureStaff("usr-doc-01", "bacsi", "TS.BS Trần Minh Hoàng", UserRole.DOCTOR,
                "bacsi@smartclinic.vn", "0912345678", "Bác sĩ Chuyên khoa II - Tim mạch", "Phòng Khám Nội 101");
        ensureStaff("usr-adm-01", "admin", "Lê Hoàng Sơn", UserRole.ADMIN,
                "admin@smartclinic.vn", "0988777666", "Quản trị viên Hệ thống Y tế", "Ban Giám Đốc & CNTT");

        int upgraded = 0;
        for (StaffAccount s : staffRepository.findAll()) {
            if (!Passwords.isBcrypt(s.getPassword())) {
                s.setPassword(Passwords.hash(DEMO_PASSWORD));
                staffRepository.save(s);
                upgraded++;
            }
        }
        for (var p : patientRepository.findAll()) {
            if (!Passwords.isBcrypt(p.getPassword())) {
                p.setPassword(Passwords.hash(DEMO_PASSWORD));
                patientRepository.save(p);
                upgraded++;
            }
        }
        if (upgraded > 0) {
            log.info("[Auth] Đã băm BCrypt {} mật khẩu mẫu (mật khẩu demo: {})", upgraded, DEMO_PASSWORD);
        }
    }

    private void ensureStaff(String id, String username, String fullName, UserRole role,
                             String email, String phone, String title, String department) {
        if (staffRepository.findById(id).isPresent() || staffRepository.existsByUsername(username)) return;
        staffRepository.save(StaffAccount.builder()
                .id(id).username(username).password(Passwords.hash(DEMO_PASSWORD))
                .fullName(fullName).email(email).phone(phone).role(role)
                .department(department).title(title).status(AccountStatus.ACTIVE)
                .permissions(Permission.getDefaultPermissions(role).stream().map(Enum::name).collect(Collectors.toSet()))
                .createdAt(LocalDate.now().toString()).updatedAt(LocalDate.now().toString())
                .build());
        log.info("[Auth] Tạo tài khoản demo {} ({})", username, role);
    }
}
