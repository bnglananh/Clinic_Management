package vn.clinic.repository;

import vn.clinic.model.MedicalRecord;

import java.util.List;
import java.util.Optional;

public interface MedicalRecordRepository {

    Optional<MedicalRecord> findById(String id);

    Optional<MedicalRecord> findByVisitCode(String visitCode);

    Optional<MedicalRecord> findByVisitId(String visitId);

    List<MedicalRecord> findByPatientId(String patientId);

    List<MedicalRecord> search(String patientId, String keyword, String department, Integer year);

    List<MedicalRecord> findAll();

    MedicalRecord save(MedicalRecord record);

    void deleteById(String id);
}
