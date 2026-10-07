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

    PatientProfile save(PatientProfile profile);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);
}
