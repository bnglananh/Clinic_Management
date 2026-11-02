package vn.clinic.repository.mongo;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Repository;
import vn.clinic.config.StorageMode;
import vn.clinic.model.MedicalRecord;
import vn.clinic.repository.MedicalRecordRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Bệnh án điện tử (EMR) – document lồng nhau: sinh hiệu, chẩn đoán ICD-10,
 * chỉ định dịch vụ và đơn thuốc nằm chung trong một document.
 */
@Repository
@StorageMode.NoSql
public class MongoMedicalRecordRepository extends MongoSupport<MedicalRecord> implements MedicalRecordRepository {

    public static final String COLLECTION = "medical_records";
    private static final Sort NEWEST_FIRST = Sort.by(Sort.Direction.DESC, "visitDate");

    public MongoMedicalRecordRepository(MongoTemplate mongo) {
        super(mongo, MedicalRecord.class, COLLECTION);
    }

    @Override
    public Optional<MedicalRecord> findById(String id) {
        return byId(id);
    }

    @Override
    public Optional<MedicalRecord> findByVisitCode(String visitCode) {
        if (visitCode == null) return Optional.empty();
        return findOne(eqIgnoreCase("visitCode", visitCode));
    }

    @Override
    public Optional<MedicalRecord> findByVisitId(String visitId) {
        if (visitId == null) return Optional.empty();
        return findOne(eqIgnoreCase("visitId", visitId));
    }

    @Override
    public List<MedicalRecord> findByPatientId(String patientId) {
        if (patientId == null) return List.of();
        return find(patientMatch(patientId), NEWEST_FIRST);
    }

    @Override
    public List<MedicalRecord> search(String patientId, String keyword, String department, Integer year) {
        List<Criteria> and = new ArrayList<>();
        if (hasText(patientId)) and.add(patientMatch(patientId));
        if (hasText(keyword)) {
            String kw = keyword.trim();
            and.add(new Criteria().orOperator(
                    containsIgnoreCase("doctorName", kw),
                    containsIgnoreCase("department", kw),
                    containsIgnoreCase("diagnoses.nameVi", kw),
                    containsIgnoreCase("diagnoses.code", kw),
                    containsIgnoreCase("prescriptions.name", kw)));
        }
        if (hasText(department) && !"ALL".equalsIgnoreCase(department)) {
            and.add(eqIgnoreCase("department", department));
        }
        if (year != null) and.add(startsWith("visitDate", String.valueOf(year)));
        return find(and.isEmpty() ? new Criteria() : new Criteria().andOperator(and), NEWEST_FIRST);
    }

    @Override
    public List<MedicalRecord> findAll() {
        return all(NEWEST_FIRST);
    }

    @Override
    public MedicalRecord save(MedicalRecord record) {
        if (record.getId() == null) {
            record.setId(nextFreeId("medical_record_id", "REC-%d"));
        }
        return upsert(record);
    }

    @Override
    public void deleteById(String id) {
        removeById(id);
    }

    private static Criteria patientMatch(String patientId) {
        return new Criteria().orOperator(
                Criteria.where("patientId").is(patientId),
                eqIgnoreCase("patientCode", patientId));
    }
}
