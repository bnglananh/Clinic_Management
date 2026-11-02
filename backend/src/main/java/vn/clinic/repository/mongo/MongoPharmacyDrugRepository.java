package vn.clinic.repository.mongo;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Repository;
import vn.clinic.config.StorageMode;
import vn.clinic.model.DrugStatus;
import vn.clinic.model.PharmacyDrug;
import vn.clinic.repository.PharmacyDrugRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
@StorageMode.NoSql
public class MongoPharmacyDrugRepository extends MongoSupport<PharmacyDrug> implements PharmacyDrugRepository {

    public static final String COLLECTION = "pharmacy_drugs";
    private static final Sort BY_ID = Sort.by("_id");
    private static final Sort BY_STOCK = Sort.by(Sort.Direction.ASC, "stockQuantity");
    private static final int CRITICAL_THRESHOLD = 10;

    public MongoPharmacyDrugRepository(MongoTemplate mongo) {
        super(mongo, PharmacyDrug.class, COLLECTION);
    }

    @Override
    public List<PharmacyDrug> findAll() {
        return all(BY_ID);
    }

    @Override
    public Optional<PharmacyDrug> findById(String id) {
        return byId(id);
    }

    @Override
    public Optional<PharmacyDrug> findByCode(String code) {
        if (code == null) return Optional.empty();
        return findOne(eqIgnoreCase("code", code));
    }

    @Override
    public PharmacyDrug save(PharmacyDrug drug) {
        if (!hasText(drug.getId())) {
            drug.setId(nextFreeId("drug_id", "DRUG-%02d"));
        }
        if (drug.getCreatedAt() == null) {
            drug.setCreatedAt(LocalDateTime.now());
        }
        drug.setUpdatedAt(LocalDateTime.now());
        return upsert(drug);
    }

    @Override
    public boolean existsByCode(String code) {
        return code != null && exists(eqIgnoreCase("code", code));
    }

    @Override
    public boolean existsByCodeAndIdNot(String code, String id) {
        return code != null && exists(eqIgnoreCase("code", code).and("_id").ne(id));
    }

    @Override
    public List<PharmacyDrug> search(String query, DrugStatus status) {
        List<Criteria> and = new ArrayList<>();
        if (hasText(query)) {
            String q = query.trim();
            and.add(new Criteria().orOperator(
                    containsIgnoreCase("name", q),
                    containsIgnoreCase("code", q),
                    containsIgnoreCase("activeIngredient", q),
                    containsIgnoreCase("manufacturer", q)));
        }
        if (status != null) and.add(Criteria.where("status").is(status));
        return find(and.isEmpty() ? new Criteria() : new Criteria().andOperator(and), BY_ID);
    }

    @Override
    public List<PharmacyDrug> findLowStock(int threshold) {
        return find(Criteria.where("status").is(DrugStatus.ACTIVE).and("stockQuantity").lte(threshold), BY_STOCK);
    }

    @Override
    public List<PharmacyDrug> findCriticalStock() {
        return findLowStock(CRITICAL_THRESHOLD);
    }
}
