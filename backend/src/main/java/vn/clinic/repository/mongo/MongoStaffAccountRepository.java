package vn.clinic.repository.mongo;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Repository;
import vn.clinic.config.StorageMode;
import vn.clinic.model.AccountStatus;
import vn.clinic.model.StaffAccount;
import vn.clinic.model.UserRole;
import vn.clinic.repository.StaffAccountRepository;

import java.util.List;
import java.util.Optional;

@Repository
@StorageMode.NoSql
public class MongoStaffAccountRepository extends MongoSupport<StaffAccount> implements StaffAccountRepository {

    public static final String COLLECTION = "staff_accounts";
    private static final Sort DEFAULT_SORT = Sort.by("_id");

    public MongoStaffAccountRepository(MongoTemplate mongo) {
        super(mongo, StaffAccount.class, COLLECTION);
    }

    @Override
    public List<StaffAccount> findAll() {
        return all(DEFAULT_SORT);
    }

    @Override
    public Optional<StaffAccount> findById(String id) {
        return byId(id);
    }

    @Override
    public Optional<StaffAccount> findByUsername(String username) {
        if (username == null) return Optional.empty();
        return findOne(eqIgnoreCase("username", username));
    }

    @Override
    public Optional<StaffAccount> findByEmail(String email) {
        if (email == null) return Optional.empty();
        return findOne(eqIgnoreCase("email", email));
    }

    @Override
    public Optional<StaffAccount> findByPhone(String phone) {
        if (phone == null) return Optional.empty();
        return findOne(Criteria.where("phone").is(phone));
    }

    @Override
    public List<StaffAccount> findByRole(UserRole role) {
        if (role == null) return findAll();
        return find(Criteria.where("role").is(role), DEFAULT_SORT);
    }

    @Override
    public List<StaffAccount> findByStatus(AccountStatus status) {
        if (status == null) return findAll();
        return find(Criteria.where("status").is(status), DEFAULT_SORT);
    }

    @Override
    public long countByRoleAndStatus(UserRole role, AccountStatus status) {
        return count(Criteria.where("role").is(role).and("status").is(status));
    }

    @Override
    public StaffAccount save(StaffAccount account) {
        if (!hasText(account.getId())) {
            account.setId(nextFreeId("staff_id", "STAFF-%02d"));
        }
        return upsert(account);
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
        removeById(id);
    }
}
