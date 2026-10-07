package vn.clinic;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import vn.clinic.dto.BatchDeductStockRequest;
import vn.clinic.dto.CreateDrugRequest;
import vn.clinic.dto.PharmacyDrugDto;
import vn.clinic.dto.StockAdjustmentRequest;
import vn.clinic.dto.StockDeductionItem;
import vn.clinic.dto.StockTransactionDto;
import vn.clinic.dto.UpdateDrugPriceRequest;
import vn.clinic.dto.UpdateDrugRequest;
import vn.clinic.exception.BusinessRuleException;
import vn.clinic.exception.DuplicateResourceException;
import vn.clinic.exception.ResourceNotFoundException;
import vn.clinic.model.DrugStatus;
import vn.clinic.model.StockTransactionType;
import vn.clinic.repository.InMemoryPharmacyDrugRepository;
import vn.clinic.repository.InMemoryStockTransactionRepository;
import vn.clinic.service.PharmacyService;
import vn.clinic.service.PharmacyServiceImpl;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("UC020 & UC021: Quản lý danh mục thuốc & Tồn kho thuốc Tests")
class PharmacyServiceTest {

    private InMemoryPharmacyDrugRepository pharmacyDrugRepository;
    private InMemoryStockTransactionRepository stockTransactionRepository;
    private PharmacyService pharmacyService;

    @BeforeEach
    void setUp() {
        pharmacyDrugRepository = new InMemoryPharmacyDrugRepository();
        pharmacyDrugRepository.init();

        stockTransactionRepository = new InMemoryStockTransactionRepository();
        stockTransactionRepository.init();

        pharmacyService = new PharmacyServiceImpl(pharmacyDrugRepository, stockTransactionRepository);
    }

    // =========================================================================
    // UC020: Quản lý danh mục thuốc Tests
    // =========================================================================

    @Test
    @DisplayName("UC020 - Bước 2: Lấy danh sách thuốc và tìm kiếm theo tên/hoạt chất thành công")
    void testGetAllDrugs() {
        List<PharmacyDrugDto> all = pharmacyService.getAllDrugs(null, null);
        assertNotNull(all);
        assertEquals(8, all.size());

        List<PharmacyDrugDto> searchByName = pharmacyService.getAllDrugs("Augmentin", null);
        assertEquals(1, searchByName.size());
        assertEquals("AUG1G", searchByName.get(0).getCode());

        List<PharmacyDrugDto> activeOnly = pharmacyService.getAllDrugs(null, DrugStatus.ACTIVE);
        assertEquals(7, activeOnly.size());
    }

    @Test
    @DisplayName("UC020: Lấy chi tiết thuốc theo ID thành công")
    void testGetDrugById_Success() {
        PharmacyDrugDto drug = pharmacyService.getDrugById("DRUG-01");
        assertNotNull(drug);
        assertEquals("Augmentin 1g", drug.getName());
        assertEquals("AUG1G", drug.getCode());
        assertTrue(drug.isCriticalStock()); // stock=4 <= 10
    }

    @Test
    @DisplayName("UC020: Lấy thuốc không tồn tại ném lỗi 404 ResourceNotFoundException")
    void testGetDrugById_NotFound() {
        assertThrows(ResourceNotFoundException.class, () -> pharmacyService.getDrugById("DRUG-999"));
    }

    @Test
    @DisplayName("UC020 - BR 5.1: Thêm mới thuốc với mã trùng lặp bị từ chối (DuplicateResourceException)")
    void testCreateDrug_DuplicateCode_ThrowsException() {
        CreateDrugRequest request = CreateDrugRequest.builder()
                .code("AUG1G") // Đã tồn tại trong kho
                .name("Thuốc Augmentin trùng mã")
                .activeIngredient("Amoxicillin")
                .strength("1000mg")
                .unit("Hộp")
                .importPrice(new BigDecimal("100000"))
                .salePrice(new BigDecimal("120000"))
                .stockQuantity(10)
                .build();

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                () -> pharmacyService.createDrug(request));
        assertTrue(ex.getMessage().contains("Mã thuốc đã tồn tại trong danh mục hệ thống"));
    }

    @Test
    @DisplayName("UC020 - BR 3.1: Thêm mới thuốc với giá bán nhỏ hơn giá nhập bị từ chối")
    void testCreateDrug_SalePriceLowerThanImport_ThrowsException() {
        CreateDrugRequest request = CreateDrugRequest.builder()
                .code("NEW-01")
                .name("Thuốc giá lỗ")
                .activeIngredient("Hoạt chất X")
                .strength("500mg")
                .unit("Hộp")
                .importPrice(new BigDecimal("150000"))
                .salePrice(new BigDecimal("100000")) // < importPrice
                .stockQuantity(20)
                .build();

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> pharmacyService.createDrug(request));
        assertTrue(ex.getMessage().contains("Giá bán thuốc không được nhỏ hơn giá nhập"));
    }

    @Test
    @DisplayName("UC020: Thêm mới thuốc hợp lệ thành công và ghi nhận tồn kho ban đầu")
    void testCreateDrug_Success() {
        CreateDrugRequest request = CreateDrugRequest.builder()
                .code("CEF500")
                .name("Cefuroxim 500mg")
                .activeIngredient("Cefuroxime Axetil")
                .strength("500mg")
                .unit("Hộp 10 viên")
                .importPrice(new BigDecimal("90000"))
                .salePrice(new BigDecimal("115000"))
                .stockQuantity(35)
                .minAlertThreshold(10)
                .batchNumber("CF-2026-05")
                .expiryDate("2028-05-10")
                .manufacturer("Dược Hậu Giang")
                .status(DrugStatus.ACTIVE)
                .build();

        PharmacyDrugDto created = pharmacyService.createDrug(request);
        assertNotNull(created.getId());
        assertEquals("CEF500", created.getCode());
        assertEquals(35, created.getStockQuantity());
        assertFalse(created.isCriticalStock());

        // Kiểm tra tra cứu lại
        PharmacyDrugDto found = pharmacyService.getDrugById(created.getId());
        assertEquals("Cefuroxim 500mg", found.getName());
    }

    @Test
    @DisplayName("UC020: Chỉnh sửa thông tin thuốc thành công")
    void testUpdateDrug_Success() {
        UpdateDrugRequest updateReq = UpdateDrugRequest.builder()
                .name("Augmentin 1g (Bản Cập Nhật)")
                .activeIngredient("Amoxicillin + Clavulanic Acid Chuẩn")
                .strength("875mg/125mg")
                .unit("Hộp 14 viên")
                .importPrice(new BigDecimal("170000"))
                .salePrice(new BigDecimal("205000"))
                .minAlertThreshold(15)
                .batchNumber("AG-2025-09-REV")
                .expiryDate("2027-08-30")
                .manufacturer("GSK")
                .status(DrugStatus.ACTIVE)
                .build();

        PharmacyDrugDto updated = pharmacyService.updateDrug("DRUG-01", updateReq);
        assertEquals("Augmentin 1g (Bản Cập Nhật)", updated.getName());
        assertEquals(new BigDecimal("205000"), updated.getSalePrice());
    }

    @Test
    @DisplayName("UC020 - BR-24 & BR 3.1: Chuyển trạng thái ngừng kinh doanh (Không xóa vật lý)")
    void testToggleDrugStatus_SoftDelete_Success() {
        // DRUG-01 đang ACTIVE -> chuyển sang DISCONTINUED
        PharmacyDrugDto toggled = pharmacyService.toggleDrugStatus("DRUG-01");
        assertEquals(DrugStatus.DISCONTINUED, toggled.getStatus());

        // Chuyển lại sang ACTIVE
        PharmacyDrugDto reActive = pharmacyService.toggleDrugStatus("DRUG-01");
        assertEquals(DrugStatus.ACTIVE, reActive.getStatus());
    }

    // =========================================================================
    // UC021: Quản lý tồn kho thuốc Tests
    // =========================================================================

    @Test
    @DisplayName("UC021 - Bước 3: Nhập thêm kho thuốc (IMPORT) thành công")
    void testAdjustStock_Import_Success() {
        StockAdjustmentRequest req = StockAdjustmentRequest.builder()
                .type(StockTransactionType.IMPORT)
                .quantity(30)
                .reason("Nhập kho bổ sung từ nhà phân phối")
                .batchNumber("AG-2026-L2")
                .expiryDate("2028-10-20")
                .performedBy("admin")
                .build();

        // DRUG-01 đang có tồn kho 4 + 30 = 34
        PharmacyDrugDto updated = pharmacyService.adjustStock("DRUG-01", req);
        assertEquals(34, updated.getStockQuantity());
        assertFalse(updated.isCriticalStock());

        // Kiểm tra lịch sử giao dịch đã được ghi nhận (BR-22)
        List<StockTransactionDto> txs = pharmacyService.getStockTransactions("DRUG-01");
        assertTrue(txs.stream().anyMatch(t -> t.getQuantityChange() == 30 && t.getBalanceAfter() == 34));
    }

    @Test
    @DisplayName("UC021 - BR 3.1: Xuất kho vượt quá số lượng tồn hiện tại bị từ chối")
    void testAdjustStock_ExportExceedsCurrentStock_ThrowsException() {
        // DRUG-01 hiện có tồn kho là 4 viên, cố tình xuất 10 viên
        StockAdjustmentRequest req = StockAdjustmentRequest.builder()
                .type(StockTransactionType.EXPORT)
                .quantity(10)
                .reason("Xuất hủy thuốc hỏng")
                .performedBy("admin")
                .build();

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> pharmacyService.adjustStock("DRUG-01", req));
        assertTrue(ex.getMessage().contains("vượt quá số lượng tồn hiện tại"));
    }

    @Test
    @DisplayName("UC021 - BR-21: Cảnh báo tồn kho nguy cấp khi số lượng <= 10")
    void testCriticalStockFilter() {
        List<PharmacyDrugDto> criticalList = pharmacyService.getCriticalStockDrugs();
        assertNotNull(criticalList);
        // Ban đầu có: DRUG-01 (4), DRUG-02 (7), DRUG-03 (9)
        assertEquals(3, criticalList.size());
        assertTrue(criticalList.stream().allMatch(d -> d.getStockQuantity() <= 10));
    }

    @Test
    @DisplayName("UC021 - BR-19: Tự động trừ kho thuốc sau khi thanh toán hóa đơn viện phí thành công")
    void testBatchDeductStock_Success() {
        // DRUG-04 đang có 24, DRUG-05 đang có 45
        BatchDeductStockRequest req = BatchDeductStockRequest.builder()
                .invoiceId("INV-2026-001")
                .performedBy("thu.ngan")
                .items(List.of(
                        new StockDeductionItem("DRUG-04", 4),
                        new StockDeductionItem("DRUG-05", 5)
                ))
                .build();

        pharmacyService.batchDeductStock(req);

        assertEquals(20, pharmacyService.getDrugById("DRUG-04").getStockQuantity());
        assertEquals(40, pharmacyService.getDrugById("DRUG-05").getStockQuantity());
    }

    @Test
    @DisplayName("UC021 - BR-15 & BR-19: Trừ kho thất bại và hoàn trả nếu một trong các thuốc không đủ tồn kho")
    void testBatchDeductStock_InsufficientStock_ThrowsException() {
        BatchDeductStockRequest req = BatchDeductStockRequest.builder()
                .invoiceId("INV-2026-002")
                .performedBy("thu.ngan")
                .items(List.of(
                        new StockDeductionItem("DRUG-01", 100) // Tồn chỉ có 4, yêu cầu 100
                ))
                .build();

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> pharmacyService.batchDeductStock(req));
        assertTrue(ex.getMessage().contains("Không đủ thuốc"));
    }
}
