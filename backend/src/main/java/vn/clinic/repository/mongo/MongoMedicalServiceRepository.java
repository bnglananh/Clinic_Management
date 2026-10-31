package vn.clinic.repository.mongo;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Repository;
import vn.clinic.config.StorageMode;
import vn.clinic.model.MedicalService;
import vn.clinic.repository.MedicalServiceRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
@StorageMode.NoSql
public class MongoMedicalServiceRepository extends MongoSupport<MedicalService> implements MedicalServiceRepository {

    public static final String COLLECTION = "medical_services";
    private static final Sort BY_ID = Sort.by("_id");

    public MongoMedicalServiceRepository(MongoTemplate mongo) {
        super(mongo, MedicalService.class, COLLECTION);
    }

    @Override
    public List<MedicalService> findAll() {
        return all(BY_ID);
    }

    @Override
    public Optional<MedicalService> findById(String id) {
        return byId(id);
    }

    @Override
    public Optional<MedicalService> findByServiceCode(String serviceCode) {
        if (serviceCode == null) return Optional.empty();
        return findOne(eqIgnoreCase("serviceCode", serviceCode));
    }

    @Override
    public MedicalService save(MedicalService service) {
        if (!hasText(service.getId())) {
            service.setId(nextFreeId("medical_service_id", "MS-%02d"));
        }
        if (service.getCreatedAt() == null) {
            service.setCreatedAt(LocalDateTime.now());
        }
        service.setUpdatedAt(LocalDateTime.now());
        return upsert(service);
    }

    @Override
    public boolean existsByServiceCode(String serviceCode) {
        return serviceCode != null && exists(eqIgnoreCase("serviceCode", serviceCode));
    }

    @Override
    public boolean existsByServiceCodeAndIdNot(String serviceCode, String id) {
        return serviceCode != null && exists(eqIgnoreCase("serviceCode", serviceCode).and("_id").ne(id));
    }

    @Override
    public List<MedicalService> search(String query, String category, Boolean activeOnly) {
        List<Criteria> and = new ArrayList<>();
        if (hasText(query)) {
            String q = query.trim();
            and.add(new Criteria().orOperator(
                    containsIgnoreCase("serviceName", q),
                    containsIgnoreCase("serviceCode", q),
                    containsIgnoreCase("roomName", q)));
        }
        if (hasText(category)) and.add(eqIgnoreCase("category", category));
        if (activeOnly != null) and.add(Criteria.where("active").is(activeOnly));
        return find(and.isEmpty() ? new Criteria() : new Criteria().andOperator(and), BY_ID);
    }
}
