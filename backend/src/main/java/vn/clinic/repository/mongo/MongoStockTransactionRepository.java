package vn.clinic.repository.mongo;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Repository;
import vn.clinic.config.StorageMode;
import vn.clinic.model.StockTransaction;
import vn.clinic.repository.StockTransactionRepository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
@StorageMode.NoSql
public class MongoStockTransactionRepository extends MongoSupport<StockTransaction> implements StockTransactionRepository {

    public static final String COLLECTION = "stock_transactions";
    private static final Sort NEWEST_FIRST = Sort.by(Sort.Direction.DESC, "timestamp");

    public MongoStockTransactionRepository(MongoTemplate mongo) {
        super(mongo, StockTransaction.class, COLLECTION);
    }

    @Override
    public List<StockTransaction> findAll() {
        return all(NEWEST_FIRST);
    }

    @Override
    public List<StockTransaction> findByDrugId(String drugId) {
        return find(Criteria.where("drugId").is(drugId), NEWEST_FIRST);
    }

    @Override
    public StockTransaction save(StockTransaction transaction) {
        if (!hasText(transaction.getId())) {
            transaction.setId(nextFreeId("stock_tx_id", "TX-%03d"));
        }
        if (transaction.getTimestamp() == null) {
            transaction.setTimestamp(LocalDateTime.now());
        }
        return upsert(transaction);
    }
}
