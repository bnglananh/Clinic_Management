package vn.clinic.service;

import vn.clinic.dto.*;
import vn.clinic.model.DrugStatus;

import java.math.BigDecimal;
import java.util.List;

public interface PharmacyService {
    // --- UC020: Quản lý danh mục thuốc ---
    List<PharmacyDrugDto> getAllDrugs(String query, DrugStatus status);
    PharmacyDrugDto getDrugById(String id);
    PharmacyDrugDto getDrugByCode(String code);
    PharmacyDrugDto createDrug(CreateDrugRequest request);
    PharmacyDrugDto updateDrug(String id, UpdateDrugRequest request);
    PharmacyDrugDto updatePrice(String id, BigDecimal importPrice, BigDecimal salePrice);
    PharmacyDrugDto toggleDrugStatus(String id); // BR-24: Soft status change, no physical delete

    // --- UC021: Quản lý tồn kho thuốc ---
    PharmacyDrugDto adjustStock(String id, StockAdjustmentRequest request); // Nhập, xuất, điều chỉnh (BR 3.1 & BR-22)
    void batchDeductStock(BatchDeductStockRequest request); // Trừ kho tự động theo đơn thuốc sau thanh toán (BR-19)
    List<PharmacyDrugDto> getLowStockDrugs(Integer threshold);
    List<PharmacyDrugDto> getCriticalStockDrugs(); // Tồn kho <= 10 (BR-21)
    List<StockTransactionDto> getStockTransactions(String drugId);
}
