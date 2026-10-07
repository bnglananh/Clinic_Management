package vn.clinic.repository;

import vn.clinic.model.StockTransaction;

import java.util.List;

public interface StockTransactionRepository {
    List<StockTransaction> findAll();
    List<StockTransaction> findByDrugId(String drugId);
    StockTransaction save(StockTransaction transaction);
}
