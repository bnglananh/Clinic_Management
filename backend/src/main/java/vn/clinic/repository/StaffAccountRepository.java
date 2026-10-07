package vn.clinic.repository;

import vn.clinic.model.AccountStatus;
import vn.clinic.model.StaffAccount;
import vn.clinic.model.UserRole;

import java.util.List;
import java.util.Optional;

public interface StaffAccountRepository {
    List<StaffAccount> findAll();

    Optional<StaffAccount> findById(String id);

    Optional<StaffAccount> findByUsername(String username);

    Optional<StaffAccount> findByEmail(String email);

    Optional<StaffAccount> findByPhone(String phone);

    List<StaffAccount> findByRole(UserRole role);

    List<StaffAccount> findByStatus(AccountStatus status);

    long countByRoleAndStatus(UserRole role, AccountStatus status);

    StaffAccount save(StaffAccount account);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    void deleteById(String id);
}
