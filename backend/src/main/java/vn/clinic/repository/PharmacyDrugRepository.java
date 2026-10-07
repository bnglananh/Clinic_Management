package vn.clinic.repository;

import vn.clinic.model.DrugStatus;
import vn.clinic.model.PharmacyDrug;

import java.util.List;
import java.util.Optional;

public interface PharmacyDrugRepository {
    List<PharmacyDrug> findAll();
    Optional<PharmacyDrug> findById(String id);
    Optional<PharmacyDrug> findByCode(String code);
    PharmacyDrug save(PharmacyDrug drug);
    boolean existsByCode(String code);
    boolean existsByCodeAndIdNot(String code, String id);
    List<PharmacyDrug> search(String query, DrugStatus status);
    List<PharmacyDrug> findLowStock(int threshold);
    List<PharmacyDrug> findCriticalStock();
}
