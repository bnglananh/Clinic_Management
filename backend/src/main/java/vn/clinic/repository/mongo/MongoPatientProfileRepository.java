package vn.clinic.repository.mongo;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Repository;
import vn.clinic.config.StorageMode;
import vn.clinic.model.PatientProfile;
import vn.clinic.repository.PatientProfileRepository;

import java.util.List;
import java.util.Optional;

@Repository
@StorageMode.NoSql
public class MongoPatientProfileRepository extends MongoSupport<PatientProfile> implements PatientProfileRepository {

    public static final String COLLECTION = "patients";
    private static final Sort DEFAULT_SORT = Sort.by("_id");

    public MongoPatientProfileRepository(MongoTemplate mongo) {
        super(mongo, PatientProfile.class, COLLECTION);
    }

    @Override
    public List<PatientProfile> findAll() {
        return all(DEFAULT_SORT);
    }

    @Override
    public Optional<PatientProfile> findById(String id) {
        return byId(id);
    }

    @Override
    public Optional<PatientProfile> findByUsername(String username) {
        if (username == null) return Optional.empty();
        return findOne(eqIgnoreCase("username", username));
    }

    @Override
    public Optional<PatientProfile> findByEmail(String email) {
        if (email == null) return Optional.empty();
        return findOne(eqIgnoreCase("email", email));
    }

    @Override
    public Optional<PatientProfile> findByPhone(String phone) {
        if (phone == null) return Optional.empty();
        return findOne(phoneEquals("phone", phone));
    }

    @Override
    public Optional<PatientProfile> findByPatientCode(String patientCode) {
        if (patientCode == null) return Optional.empty();
        return findOne(eqIgnoreCase("patientCode", patientCode));
    }

    @Override
    public Optional<PatientProfile> findByIdentityCardNumber(String identityCardNumber) {
        if (identityCardNumber == null) return Optional.empty();
        return findOne(Criteria.where("identityCardNumber").is(identityCardNumber.trim()));
    }

    @Override
    public List<PatientProfile> search(String keyword) {
        if (!hasText(keyword)) return findAll();
        String q = keyword.trim();
        return find(new Criteria().orOperator(
                containsIgnoreCase("fullName", q),
                containsIgnoreCase("patientCode", q),
                containsIgnoreCase("phone", q),
                containsIgnoreCase("identityCardNumber", q)), DEFAULT_SORT);
    }

    @Override
    public PatientProfile save(PatientProfile profile) {
        if (!hasText(profile.getId())) {
            profile.setId(nextFreeId("patient_id", "usr-pat-%02d"));
        }
        return upsert(profile);
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
    public boolean existsByIdentityCardNumber(String identityCardNumber) {
        return findByIdentityCardNumber(identityCardNumber).isPresent();
    }

    @Override
    public boolean existsByIdentityCardNumberAndIdNot(String identityCardNumber, String id) {
        if (identityCardNumber == null) return false;
        return exists(Criteria.where("identityCardNumber").is(identityCardNumber.trim()).and("_id").ne(id));
    }

    @Override
    public boolean existsByPhoneAndIdNot(String phone, String id) {
        if (phone == null) return false;
        return exists(phoneEquals("phone", phone).and("_id").ne(id));
    }
}
