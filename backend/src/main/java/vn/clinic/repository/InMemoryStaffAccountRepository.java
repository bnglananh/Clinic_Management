package vn.clinic.repository;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Repository;
import vn.clinic.model.AccountStatus;
import vn.clinic.model.Permission;
import vn.clinic.model.StaffAccount;
import vn.clinic.model.UserRole;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class InMemoryStaffAccountRepository implements StaffAccountRepository {

    private final Map<String, StaffAccount> storage = new ConcurrentHashMap<>();

    @PostConstruct
    public void initMockData() {
        // Seed initial mock accounts aligned with frontend mock data
        save(StaffAccount.builder()
                .id("STAFF-01")
                .username("hoang.tran")
                .password("$2a$10$eMockPasswordHash01")
                .fullName("TS.BS Trần Minh Hoàng")
                .email("hoang.tran@smartclinic.vn")
                .phone("0912345678")
                .role(UserRole.DOCTOR)
                .department("Khoa Tim Mạch")
                .title("Bác sĩ Chuyên khoa II - Trưởng khoa")
                .status(AccountStatus.ACTIVE)
                .permissions(Permission.getDefaultPermissions(UserRole.DOCTOR).stream()
                        .map(Enum::name).collect(Collectors.toSet()))
                .lastLoginAt("2026-10-06 07:30")
                .createdAt("2024-01-15")
                .updatedAt("2024-01-15")
                .build());

        save(StaffAccount.builder()
                .id("STAFF-02")
                .username("mai.lan")
                .password("$2a$10$eMockPasswordHash02")
                .fullName("ThS.BS Nguyễn Thị Mai Lan")
                .email("lan.nguyen@smartclinic.vn")
                .phone("0908112233")
                .role(UserRole.DOCTOR)
                .department("Khoa Nội Tổng Quát")
                .title("Thạc sĩ Bác sĩ Nội trú")
                .status(AccountStatus.ACTIVE)
                .permissions(Permission.getDefaultPermissions(UserRole.DOCTOR).stream()
                        .map(Enum::name).collect(Collectors.toSet()))
                .lastLoginAt("2026-10-05 13:45")
                .createdAt("2024-03-20")
                .updatedAt("2024-03-20")
                .build());

        save(StaffAccount.builder()
                .id("STAFF-03")
                .username("hung.le")
                .password("$2a$10$eMockPasswordHash03")
                .fullName("BS.CKI Lê Quốc Hưng")
                .email("hung.le@smartclinic.vn")
                .phone("0934556677")
                .role(UserRole.DOCTOR)
                .department("Khoa Tiêu Hóa")
                .title("Bác sĩ CKI Tiêu hóa - Gan mật")
                .status(AccountStatus.ACTIVE)
                .permissions(Permission.getDefaultPermissions(UserRole.DOCTOR).stream()
                        .map(Enum::name).collect(Collectors.toSet()))
                .lastLoginAt("2026-10-05 08:15")
                .createdAt("2024-05-10")
                .updatedAt("2024-05-10")
                .build());

        save(StaffAccount.builder()
                .id("STAFF-04")
                .username("mai.nguyen")
                .password("$2a$10$eMockPasswordHash04")
                .fullName("Nguyễn Thị Mai")
                .email("mai.nguyen@smartclinic.vn")
                .phone("0903123456")
                .role(UserRole.RECEPTIONIST)
                .department("Quầy Tiếp Đón & Thu Ngân")
                .title("Trưởng nhóm Lễ tân & Thu ngân")
                .status(AccountStatus.ACTIVE)
                .permissions(Permission.getDefaultPermissions(UserRole.RECEPTIONIST).stream()
                        .map(Enum::name).collect(Collectors.toSet()))
                .lastLoginAt("2026-10-06 07:00")
                .createdAt("2024-02-01")
                .updatedAt("2024-02-01")
                .build());

        save(StaffAccount.builder()
                .id("STAFF-05")
                .username("huong.pham")
                .password("$2a$10$eMockPasswordHash05")
                .fullName("Phạm Thu Hương")
                .email("huong.pham@smartclinic.vn")
                .phone("0978998877")
                .role(UserRole.RECEPTIONIST)
                .department("Quầy Tiếp Đón & Thu Ngân")
                .title("Nhân viên Tiếp đón bệnh nhân")
                .status(AccountStatus.ACTIVE)
                .permissions(Permission.getDefaultPermissions(UserRole.RECEPTIONIST).stream()
                        .map(Enum::name).collect(Collectors.toSet()))
                .lastLoginAt("2026-10-05 17:00")
                .createdAt("2024-06-15")
                .updatedAt("2024-06-15")
                .build());

        // System Administrator (UC019: Last remaining admin protection test)
        save(StaffAccount.builder()
                .id("STAFF-06")
                .username("son.le")
                .password("$2a$10$eMockPasswordHash06")
                .fullName("Lê Hoàng Sơn")
                .email("son.le@smartclinic.vn")
                .phone("0988777666")
                .role(UserRole.ADMIN)
                .department("Ban Giám Đốc & CNTT")
                .title("Giám đốc Vận hành & Quản trị Hệ thống")
                .status(AccountStatus.ACTIVE)
                .permissions(Permission.getDefaultPermissions(UserRole.ADMIN).stream()
                        .map(Enum::name).collect(Collectors.toSet()))
                .lastLoginAt("2026-10-06 08:00")
                .createdAt("2023-11-01")
                .updatedAt("2023-11-01")
                .build());

        // Locked account (UC019: Test lock / unlock)
        save(StaffAccount.builder()
                .id("STAFF-07")
                .username("duy.tran")
                .password("$2a$10$eMockPasswordHash07")
                .fullName("Trần Quốc Duy")
                .email("duy.tran@smartclinic.vn")
                .phone("0945332211")
                .role(UserRole.RECEPTIONIST)
                .department("Quầy Tiếp Đón")
                .title("Nhân viên Lễ tân (Tạm khóa)")
                .status(AccountStatus.LOCKED)
                .permissions(Permission.getDefaultPermissions(UserRole.RECEPTIONIST).stream()
                        .map(Enum::name).collect(Collectors.toSet()))
                .lastLoginAt("2026-09-20 11:30")
                .createdAt("2024-04-12")
                .updatedAt("2024-04-12")
                .build());
    }

    @Override
    public List<StaffAccount> findAll() {
        return new ArrayList<>(storage.values());
    }

    @Override
    public Optional<StaffAccount> findById(String id) {
        return Optional.ofNullable(storage.get(id));
    }

    @Override
    public Optional<StaffAccount> findByUsername(String username) {
        if (username == null) return Optional.empty();
        return storage.values().stream()
                .filter(a -> username.equalsIgnoreCase(a.getUsername()))
                .findFirst();
    }

    @Override
    public Optional<StaffAccount> findByEmail(String email) {
        if (email == null) return Optional.empty();
        return storage.values().stream()
                .filter(a -> email.equalsIgnoreCase(a.getEmail()))
                .findFirst();
    }

    @Override
    public Optional<StaffAccount> findByPhone(String phone) {
        if (phone == null) return Optional.empty();
        return storage.values().stream()
                .filter(a -> phone.equals(a.getPhone()))
                .findFirst();
    }

    @Override
    public List<StaffAccount> findByRole(UserRole role) {
        if (role == null) return findAll();
        return storage.values().stream()
                .filter(a -> a.getRole() == role)
                .collect(Collectors.toList());
    }

    @Override
    public List<StaffAccount> findByStatus(AccountStatus status) {
        if (status == null) return findAll();
        return storage.values().stream()
                .filter(a -> a.getStatus() == status)
                .collect(Collectors.toList());
    }

    @Override
    public long countByRoleAndStatus(UserRole role, AccountStatus status) {
        return storage.values().stream()
                .filter(a -> a.getRole() == role && a.getStatus() == status)
                .count();
    }

    @Override
    public StaffAccount save(StaffAccount account) {
        if (account.getId() == null || account.getId().isBlank()) {
            int nextIndex = storage.size() + 1;
            String newId = String.format("STAFF-%02d", nextIndex);
            while (storage.containsKey(newId)) {
                nextIndex++;
                newId = String.format("STAFF-%02d", nextIndex);
            }
            account.setId(newId);
        }
        storage.put(account.getId(), account);
        return account;
    }

    @Override
    public boolean existsByUsername(String username) {
        return findByUsername(username).isPresent();
    }

    @Override
    public boolean existsByEmail(String email) {
        return findByEmail(email).isPresent();
    }

    @Override
    public boolean existsByPhone(String phone) {
        return findByPhone(phone).isPresent();
    }

    @Override
    public void deleteById(String id) {
        storage.remove(id);
    }
}
