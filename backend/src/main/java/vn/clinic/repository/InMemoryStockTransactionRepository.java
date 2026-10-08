package vn.clinic.repository;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Repository;
import vn.clinic.model.StockTransaction;
import vn.clinic.model.StockTransactionType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class InMemoryStockTransactionRepository implements StockTransactionRepository {

    private final Map<String, StockTransaction> transactionStore = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        save(StockTransaction.builder()
                .id("TX-001")
                .drugId("DRUG-01")
                .drugName("Augmentin 1g")
                .type(StockTransactionType.IMPORT)
                .quantityChange(50)
                .balanceAfter(50)
                .reason("Nhập hàng định kỳ Quý III từ GSK Pháp")
                .batchNumber("AG-2025-09")
                .performedBy("admin")
                .timestamp(LocalDateTime.now().minusDays(30))
                .build());

        save(StockTransaction.builder()
                .id("TX-002")
                .drugId("DRUG-01")
                .drugName("Augmentin 1g")
                .type(StockTransactionType.PRESCRIPTION_DISPENSE)
                .quantityChange(-46)
                .balanceAfter(4)
                .reason("Xuất bán theo đơn thuốc phòng khám (Tồn nguy cấp <= 10)")
                .batchNumber("AG-2025-09")
                .performedBy("cashier")
                .timestamp(LocalDateTime.now().minusDays(2))
                .build());

        save(StockTransaction.builder()
                .id("TX-003")
                .drugId("DRUG-02")
                .drugName("Panadol Extra")
                .type(StockTransactionType.IMPORT)
                .quantityChange(100)
                .balanceAfter(100)
                .reason("Nhập kho bổ sung từ Sanofi")
                .batchNumber("PD-2026-01")
                .performedBy("admin")
                .timestamp(LocalDateTime.now().minusDays(20))
                .build());
    }

    @Override
    public List<StockTransaction> findAll() {
        return transactionStore.values().stream()
                .sorted(Comparator.comparing(StockTransaction::getTimestamp).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<StockTransaction> findByDrugId(String drugId) {
        return transactionStore.values().stream()
                .filter(t -> t.getDrugId().equals(drugId))
                .sorted(Comparator.comparing(StockTransaction::getTimestamp).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public StockTransaction save(StockTransaction transaction) {
        if (transaction.getId() == null || transaction.getId().isBlank()) {
            int nextId = transactionStore.size() + 1;
            transaction.setId(String.format("TX-%03d", nextId));
        }
        if (transaction.getTimestamp() == null) {
            transaction.setTimestamp(LocalDateTime.now());
        }
        transactionStore.put(transaction.getId(), transaction);
        return transaction;
    }
}
