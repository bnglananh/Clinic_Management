package vn.clinic.repository;

import vn.clinic.model.PatientProfile;

import java.util.List;
import java.util.Optional;

public interface PatientProfileRepository {
    List<PatientProfile> findAll();

    Optional<PatientProfile> findById(String id);

    Optional<PatientProfile> findByUsername(String username);

    Optional<PatientProfile> findByEmail(String email);

    Optional<PatientProfile> findByPhone(String phone);

    Optional<PatientProfile> findByPatientCode(String patientCode);

    Optional<PatientProfile> findByIdentityCardNumber(String identityCardNumber);

    List<PatientProfile> search(String keyword);

    PatientProfile save(PatientProfile profile);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    boolean existsByIdentityCardNumber(String identityCardNumber);

    boolean existsByIdentityCardNumberAndIdNot(String identityCardNumber, String id);

    boolean existsByPhoneAndIdNot(String phone, String id);
}

