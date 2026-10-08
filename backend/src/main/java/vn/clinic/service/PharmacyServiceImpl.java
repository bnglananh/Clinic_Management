package vn.clinic.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.clinic.dto.*;
import vn.clinic.exception.BusinessRuleException;
import vn.clinic.exception.DuplicateResourceException;
import vn.clinic.exception.ResourceNotFoundException;
import vn.clinic.model.DrugStatus;
import vn.clinic.model.PharmacyDrug;
import vn.clinic.model.StockTransaction;
import vn.clinic.model.StockTransactionType;
import vn.clinic.repository.PharmacyDrugRepository;
import vn.clinic.repository.StockTransactionRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PharmacyServiceImpl implements PharmacyService {

    private final PharmacyDrugRepository pharmacyDrugRepository;
    private final StockTransactionRepository stockTransactionRepository;

    // =========================================================================
    // UC020: Quản lý danh mục thuốc
    // =========================================================================

    @Override
    public List<PharmacyDrugDto> getAllDrugs(String query, DrugStatus status) {
        return pharmacyDrugRepository.search(query, status).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public PharmacyDrugDto getDrugById(String id) {
        PharmacyDrug drug = findDrugOrThrow(id);
        return mapToDto(drug);
    }

    @Override
    public PharmacyDrugDto getDrugByCode(String code) {
        PharmacyDrug drug = pharmacyDrugRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thuốc với mã: " + code));
        return mapToDto(drug);
    }

    @Override
    public PharmacyDrugDto createDrug(CreateDrugRequest request) {
        // BR 5.1: Kiểm tra trùng mã thuốc
        if (pharmacyDrugRepository.existsByCode(request.getCode())) {
            throw new DuplicateResourceException("Mã thuốc đã tồn tại trong danh mục hệ thống: " + request.getCode() + " (SRS UC020 BR 5.1)");
        }

        // Kiểm tra giá bán >= giá nhập
        validatePrices(request.getImportPrice(), request.getSalePrice());

        PharmacyDrug drug = PharmacyDrug.builder()
                .code(request.getCode().trim().toUpperCase())
                .name(request.getName().trim())
                .activeIngredient(request.getActiveIngredient().trim())
                .strength(request.getStrength().trim())
                .unit(request.getUnit().trim())
                .importPrice(request.getImportPrice())
                .salePrice(request.getSalePrice())
                .stockQuantity(request.getStockQuantity())
                .minAlertThreshold(request.getMinAlertThreshold() > 0 ? request.getMinAlertThreshold() : 10)
                .batchNumber(request.getBatchNumber())
                .expiryDate(request.getExpiryDate())
                .manufacturer(request.getManufacturer())
                .status(request.getStatus() != null ? request.getStatus() : DrugStatus.ACTIVE)
                .build();

        PharmacyDrug saved = pharmacyDrugRepository.save(drug);
        log.info("Created new pharmacy drug: id={}, code={}, name={}", saved.getId(), saved.getCode(), saved.getName());

        // Nếu có số lượng tồn khởi tạo ban đầu, ghi nhận transaction
        if (saved.getStockQuantity() > 0) {
            stockTransactionRepository.save(StockTransaction.builder()
                    .drugId(saved.getId())
                    .drugName(saved.getName())
                    .type(StockTransactionType.IMPORT)
                    .quantityChange(saved.getStockQuantity())
                    .balanceAfter(saved.getStockQuantity())
                    .reason("Khởi tạo danh mục thuốc kèm tồn ban đầu")
                    .batchNumber(saved.getBatchNumber())
                    .performedBy("admin")
                    .timestamp(LocalDateTime.now())
                    .build());
        }

        return mapToDto(saved);
    }

    @Override
    public PharmacyDrugDto updateDrug(String id, UpdateDrugRequest request) {
        PharmacyDrug drug = findDrugOrThrow(id);

        validatePrices(request.getImportPrice(), request.getSalePrice());

        drug.setName(request.getName().trim());
        drug.setActiveIngredient(request.getActiveIngredient().trim());
        drug.setStrength(request.getStrength().trim());
        drug.setUnit(request.getUnit().trim());
        drug.setImportPrice(request.getImportPrice());
        drug.setSalePrice(request.getSalePrice());
        if (request.getMinAlertThreshold() > 0) {
            drug.setMinAlertThreshold(request.getMinAlertThreshold());
        }
        if (request.getBatchNumber() != null) drug.setBatchNumber(request.getBatchNumber());
        if (request.getExpiryDate() != null) drug.setExpiryDate(request.getExpiryDate());
        if (request.getManufacturer() != null) drug.setManufacturer(request.getManufacturer());
        if (request.getStatus() != null) drug.setStatus(request.getStatus());

        PharmacyDrug updated = pharmacyDrugRepository.save(drug);
        log.info("Updated pharmacy drug: id={}, name={}", updated.getId(), updated.getName());
        return mapToDto(updated);
    }

    @Override
    public PharmacyDrugDto updatePrice(String id, BigDecimal importPrice, BigDecimal salePrice) {
        PharmacyDrug drug = findDrugOrThrow(id);
        validatePrices(importPrice, salePrice);

        drug.setImportPrice(importPrice);
        drug.setSalePrice(salePrice);
        PharmacyDrug updated = pharmacyDrugRepository.save(drug);
        log.info("Updated drug prices: id={}, import={}, sale={}", id, importPrice, salePrice);
        return mapToDto(updated);
    }

    @Override
    public PharmacyDrugDto toggleDrugStatus(String id) {
        PharmacyDrug drug = findDrugOrThrow(id);

        // BR-24 & SRS UC020 BR 3.1: Không xóa vật lý, chuyển trạng thái ACTIVE <-> DISCONTINUED
        DrugStatus newStatus = (drug.getStatus() == DrugStatus.ACTIVE) ? DrugStatus.DISCONTINUED : DrugStatus.ACTIVE;
        drug.setStatus(newStatus);

        PharmacyDrug updated = pharmacyDrugRepository.save(drug);
        log.info("Toggled drug status: id={}, newStatus={} (SRS BR-24)", id, newStatus);
        return mapToDto(updated);
    }

    // =========================================================================
    // UC021: Quản lý tồn kho thuốc
    // =========================================================================

    @Override
    public PharmacyDrugDto adjustStock(String id, StockAdjustmentRequest request) {
        PharmacyDrug drug = findDrugOrThrow(id);
        int currentStock = drug.getStockQuantity();
        int change = 0;
        int newBalance = 0;

        switch (request.getType()) {
            case IMPORT:
                change = request.getQuantity();
                newBalance = currentStock + change;
                if (request.getBatchNumber() != null && !request.getBatchNumber().isBlank()) {
                    drug.setBatchNumber(request.getBatchNumber().trim());
                }
                if (request.getExpiryDate() != null && !request.getExpiryDate().isBlank()) {
                    drug.setExpiryDate(request.getExpiryDate().trim());
                }
                break;

            case EXPORT:
                // BR 3.1: Số lượng xuất kho không được lớn hơn số lượng tồn
                if (request.getQuantity() > currentStock) {
                    throw new BusinessRuleException(
                            String.format("Số lượng xuất kho (%d) vượt quá số lượng tồn hiện tại (%d) của thuốc %s (SRS UC021 BR 3.1)",
                                    request.getQuantity(), currentStock, drug.getName()));
                }
                change = -request.getQuantity();
                newBalance = currentStock + change;
                break;

            case ADJUSTMENT:
                // Điều chỉnh trực tiếp thành số lượng mới
                change = request.getQuantity() - currentStock;
                newBalance = request.getQuantity();
                break;

            case PRESCRIPTION_DISPENSE:
                if (request.getQuantity() > currentStock) {
                    throw new BusinessRuleException(
                            String.format("Không đủ tồn kho để cấp phát đơn thuốc. Tồn hiện tại: %d, yêu cầu: %d (SRS BR-15 & BR-19)",
                                    currentStock, request.getQuantity()));
                }
                change = -request.getQuantity();
                newBalance = currentStock + change;
                break;
        }

        drug.setStockQuantity(newBalance);
        PharmacyDrug updated = pharmacyDrugRepository.save(drug);

        // BR-22: Ghi nhận nhật ký biến động kho bắt buộc
        StockTransaction tx = StockTransaction.builder()
                .drugId(drug.getId())
                .drugName(drug.getName())
                .type(request.getType())
                .quantityChange(change)
                .balanceAfter(newBalance)
                .reason(request.getReason())
                .batchNumber(drug.getBatchNumber())
                .performedBy(request.getPerformedBy() != null ? request.getPerformedBy() : "admin")
                .timestamp(LocalDateTime.now())
                .build();
        stockTransactionRepository.save(tx);

        // BR-21: Cảnh báo tồn kho nguy cấp khi tồn <= 10
        if (newBalance <= 10) {
            log.warn("CẢNH BÁO TỒN KHO NGUY CẤP: Thuốc {} (id={}) hiện chỉ còn {} đơn vị (ngưỡng <= 10 - SRS UC021 BR-21)",
                    drug.getName(), drug.getId(), newBalance);
        }

        return mapToDto(updated);
    }

    @Override
    public void batchDeductStock(BatchDeductStockRequest request) {
        // Kiểm tra tồn kho của toàn bộ danh sách trước để đảm bảo tính nguyên tử (All or Nothing)
        for (StockDeductionItem item : request.getItems()) {
            PharmacyDrug drug = findDrugOrThrow(item.getDrugId());
            if (item.getQuantity() > drug.getStockQuantity()) {
                throw new BusinessRuleException(
                        String.format("Không đủ thuốc '%s' trong kho để trừ đơn viện phí. Tồn kho: %d, yêu cầu trừ: %d (SRS BR-19)",
                                drug.getName(), drug.getStockQuantity(), item.getQuantity()));
            }
        }

        // Thực hiện trừ kho từng thuốc
        for (StockDeductionItem item : request.getItems()) {
            PharmacyDrug drug = findDrugOrThrow(item.getDrugId());
            int newBalance = drug.getStockQuantity() - item.getQuantity();
            drug.setStockQuantity(newBalance);
            pharmacyDrugRepository.save(drug);

            stockTransactionRepository.save(StockTransaction.builder()
                    .drugId(drug.getId())
                    .drugName(drug.getName())
                    .type(StockTransactionType.PRESCRIPTION_DISPENSE)
                    .quantityChange(-item.getQuantity())
                    .balanceAfter(newBalance)
                    .reason("Tự động trừ kho thuốc sau khi thanh toán hóa đơn: " + (request.getInvoiceId() != null ? request.getInvoiceId() : "N/A"))
                    .batchNumber(drug.getBatchNumber())
                    .performedBy(request.getPerformedBy() != null ? request.getPerformedBy() : "cashier")
                    .timestamp(LocalDateTime.now())
                    .build());
        }
        log.info("Batch deducted stock for {} items for invoice={}", request.getItems().size(), request.getInvoiceId());
    }

    @Override
    public List<PharmacyDrugDto> getLowStockDrugs(Integer threshold) {
        int limit = (threshold != null && threshold > 0) ? threshold : 30;
        return pharmacyDrugRepository.findLowStock(limit).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<PharmacyDrugDto> getCriticalStockDrugs() {
        return pharmacyDrugRepository.findCriticalStock().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<StockTransactionDto> getStockTransactions(String drugId) {
        List<StockTransaction> list = (drugId != null && !drugId.isBlank())
                ? stockTransactionRepository.findByDrugId(drugId)
                : stockTransactionRepository.findAll();

        return list.stream()
                .map(t -> StockTransactionDto.builder()
                        .id(t.getId())
                        .drugId(t.getDrugId())
                        .drugName(t.getDrugName())
                        .type(t.getType())
                        .quantityChange(t.getQuantityChange())
                        .balanceAfter(t.getBalanceAfter())
                        .reason(t.getReason())
                        .batchNumber(t.getBatchNumber())
                        .performedBy(t.getPerformedBy())
                        .timestamp(t.getTimestamp())
                        .build())
                .collect(Collectors.toList());
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

    private PharmacyDrug findDrugOrThrow(String id) {
        return pharmacyDrugRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin thuốc với ID: " + id));
    }

    private void validatePrices(BigDecimal importPrice, BigDecimal salePrice) {
        if (importPrice != null && salePrice != null && salePrice.compareTo(importPrice) < 0) {
            throw new BusinessRuleException("Giá bán thuốc không được nhỏ hơn giá nhập (SRS BR 3.1)");
        }
    }

    private PharmacyDrugDto mapToDto(PharmacyDrug drug) {
        boolean critical = drug.getStatus() == DrugStatus.ACTIVE && drug.getStockQuantity() <= 10;
        boolean low = drug.getStatus() == DrugStatus.ACTIVE && drug.getStockQuantity() <= drug.getMinAlertThreshold();

        return PharmacyDrugDto.builder()
                .id(drug.getId())
                .code(drug.getCode())
                .name(drug.getName())
                .activeIngredient(drug.getActiveIngredient())
                .strength(drug.getStrength())
                .unit(drug.getUnit())
                .importPrice(drug.getImportPrice())
                .salePrice(drug.getSalePrice())
                .stockQuantity(drug.getStockQuantity())
                .minAlertThreshold(drug.getMinAlertThreshold())
                .batchNumber(drug.getBatchNumber())
                .expiryDate(drug.getExpiryDate())
                .manufacturer(drug.getManufacturer())
                .status(drug.getStatus())
                .isCriticalStock(critical)
                .isLowStock(low)
                .build();
    }
}
