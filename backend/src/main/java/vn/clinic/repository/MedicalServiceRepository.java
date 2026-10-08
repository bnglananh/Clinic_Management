package vn.clinic.repository;

import vn.clinic.model.MedicalService;

import java.util.List;
import java.util.Optional;

public interface MedicalServiceRepository {
    List<MedicalService> findAll();
    Optional<MedicalService> findById(String id);
    Optional<MedicalService> findByServiceCode(String serviceCode);
    MedicalService save(MedicalService service);
    boolean existsByServiceCode(String serviceCode);
    boolean existsByServiceCodeAndIdNot(String serviceCode, String id);
    List<MedicalService> search(String query, String category, Boolean activeOnly);
}
