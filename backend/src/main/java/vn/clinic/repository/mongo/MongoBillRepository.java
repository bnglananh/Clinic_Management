package vn.clinic.repository.mongo;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Repository;
import vn.clinic.config.StorageMode;
import vn.clinic.model.Bill;
import vn.clinic.model.PaymentStatus;
import vn.clinic.repository.BillRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@StorageMode.NoSql
public class MongoBillRepository extends MongoSupport<Bill> implements BillRepository {

    public static final String COLLECTION = "bills";
    private static final Sort NEWEST_FIRST = Sort.by(Sort.Direction.DESC, "createdAt");

    public MongoBillRepository(MongoTemplate mongo) {
        super(mongo, Bill.class, COLLECTION);
    }

    @Override
    public Optional<Bill> findById(String id) {
        return byId(id);
    }

    @Override
    public Optional<Bill> findByBillCode(String billCode) {
        if (billCode == null) return Optional.empty();
        return findOne(eqIgnoreCase("billCode", billCode));
    }

    @Override
    public List<Bill> findAll() {
        return all(NEWEST_FIRST);
    }

    @Override
    public List<Bill> findByPaymentStatus(PaymentStatus status) {
        return find(Criteria.where("paymentStatus").is(status), NEWEST_FIRST);
    }

    @Override
    public List<Bill> findByPatientId(String patientId) {
        if (patientId == null) return List.of();
        return find(Criteria.where("patientId").is(patientId), NEWEST_FIRST);
    }

    @Override
    public List<Bill> findByVisitId(String visitId) {
        if (visitId == null) return List.of();
        return find(Criteria.where("visitId").is(visitId), null);
    }

    @Override
    public Bill save(Bill bill) {
        if (bill.getId() == null) {
            bill.setId("bill-" + UUID.randomUUID().toString().substring(0, 8));
        }
        return upsert(bill);
    }

    @Override
    public void deleteById(String id) {
        removeById(id);
    }

    @Override
    public long countByPaymentStatus(PaymentStatus status) {
        return count(Criteria.where("paymentStatus").is(status));
    }
}
