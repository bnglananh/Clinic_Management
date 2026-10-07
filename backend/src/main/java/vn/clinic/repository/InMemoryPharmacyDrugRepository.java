package vn.clinic.repository;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Repository;
import vn.clinic.model.DrugStatus;
import vn.clinic.model.PharmacyDrug;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class InMemoryPharmacyDrugRepository implements PharmacyDrugRepository {

    private final Map<String, PharmacyDrug> drugStore = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        save(PharmacyDrug.builder()
                .id("DRUG-01")
                .code("AUG1G")
                .name("Augmentin 1g")
                .activeIngredient("Amoxicillin + Clavulanic Acid")
                .strength("875mg/125mg")
                .unit("Hộp 14 viên")
                .importPrice(new BigDecimal("165000"))
                .salePrice(new BigDecimal("195000"))
                .stockQuantity(4) // Critical <= 10
                .minAlertThreshold(10)
                .batchNumber("AG-2025-09")
                .expiryDate("2027-06-30")
                .manufacturer("GlaxoSmithKline (Pháp)")
                .status(DrugStatus.ACTIVE)
                .createdAt(LocalDateTime.now().minusDays(90))
                .updatedAt(LocalDateTime.now().minusDays(2))
                .build());

        save(PharmacyDrug.builder()
                .id("DRUG-02")
                .code("PAN500")
                .name("Panadol Extra")
                .activeIngredient("Paracetamol + Caffeine")
                .strength("500mg/65mg")
                .unit("Hộp 15 vỉ")
                .importPrice(new BigDecimal("120000"))
                .salePrice(new BigDecimal("145000"))
                .stockQuantity(7) // Critical <= 10
                .minAlertThreshold(10)
                .batchNumber("PD-2026-01")
                .expiryDate("2028-01-15")
                .manufacturer("Sanofi (Việt Nam)")
                .status(DrugStatus.ACTIVE)
                .createdAt(LocalDateTime.now().minusDays(80))
                .updatedAt(LocalDateTime.now().minusDays(3))
                .build());

        save(PharmacyDrug.builder()
                .id("DRUG-03")
                .code("NEX40")
                .name("Nexium 40mg")
                .activeIngredient("Esomeprazole")
                .strength("40mg")
                .unit("Hộp 28 viên")
                .importPrice(new BigDecimal("320000"))
                .salePrice(new BigDecimal("380000"))
                .stockQuantity(9) // Critical <= 10
                .minAlertThreshold(10)
                .batchNumber("NX-2025-11")
                .expiryDate("2027-11-20")
                .manufacturer("AstraZeneca (Thụy Điển)")
                .status(DrugStatus.ACTIVE)
                .createdAt(LocalDateTime.now().minusDays(70))
                .updatedAt(LocalDateTime.now().minusDays(5))
                .build());

        save(PharmacyDrug.builder()
                .id("DRUG-04")
                .code("AML05")
                .name("Amlor 5mg")
                .activeIngredient("Amlodipine Besylate")
                .strength("5mg")
                .unit("Hộp 30 viên")
                .importPrice(new BigDecimal("180000"))
                .salePrice(new BigDecimal("220000"))
                .stockQuantity(24) // Low <= 30
                .minAlertThreshold(10)
                .batchNumber("AM-2025-04")
                .expiryDate("2027-08-10")
                .manufacturer("Pfizer (Mỹ)")
                .status(DrugStatus.ACTIVE)
                .createdAt(LocalDateTime.now().minusDays(60))
                .updatedAt(LocalDateTime.now().minusDays(10))
                .build());

        save(PharmacyDrug.builder()
                .id("DRUG-05")
                .code("GLU850")
                .name("Glucophage 850mg")
                .activeIngredient("Metformin Hydrochloride")
                .strength("850mg")
                .unit("Hộp 50 viên")
                .importPrice(new BigDecimal("110000"))
                .salePrice(new BigDecimal("135000"))
                .stockQuantity(45)
                .minAlertThreshold(10)
                .batchNumber("GL-2025-10")
                .expiryDate("2027-12-05")
                .manufacturer("Merck Santé (Đức)")
                .status(DrugStatus.ACTIVE)
                .createdAt(LocalDateTime.now().minusDays(50))
                .updatedAt(LocalDateTime.now().minusDays(1))
                .build());

        save(PharmacyDrug.builder()
                .id("DRUG-06")
                .code("PLA75")
                .name("Plavix 75mg")
                .activeIngredient("Clopidogrel")
                .strength("75mg")
                .unit("Hộp 30 viên")
                .importPrice(new BigDecimal("450000"))
                .salePrice(new BigDecimal("530000"))
                .stockQuantity(18)
                .minAlertThreshold(10)
                .batchNumber("PL-2025-08")
                .expiryDate("2027-05-25")
                .manufacturer("Sanofi Winthrop (Pháp)")
                .status(DrugStatus.ACTIVE)
                .createdAt(LocalDateTime.now().minusDays(40))
                .updatedAt(LocalDateTime.now().minusDays(8))
                .build());

        save(PharmacyDrug.builder()
                .id("DRUG-07")
                .code("ASP81")
                .name("Aspirin pH8")
                .activeIngredient("Aspirin")
                .strength("100mg")
                .unit("Hộp 100 viên")
                .importPrice(new BigDecimal("85000"))
                .salePrice(new BigDecimal("110000"))
                .stockQuantity(62)
                .minAlertThreshold(10)
                .batchNumber("AS-2025-12")
                .expiryDate("2028-02-18")
                .manufacturer("Stella Pharm (Việt Nam)")
                .status(DrugStatus.ACTIVE)
                .createdAt(LocalDateTime.now().minusDays(30))
                .updatedAt(LocalDateTime.now().minusDays(15))
                .build());

        save(PharmacyDrug.builder()
                .id("DRUG-08")
                .code("SIM10")
                .name("Zocor 10mg (Ngừng kinh doanh)")
                .activeIngredient("Simvastatin")
                .strength("10mg")
                .unit("Hộp 30 viên")
                .importPrice(new BigDecimal("190000"))
                .salePrice(new BigDecimal("230000"))
                .stockQuantity(0)
                .minAlertThreshold(10)
                .batchNumber("ZC-2024-01")
                .expiryDate("2025-12-31")
                .manufacturer("MSD (Mỹ)")
                .status(DrugStatus.DISCONTINUED) // Soft discontinued (BR-24)
                .createdAt(LocalDateTime.now().minusDays(100))
                .updatedAt(LocalDateTime.now().minusDays(20))
                .build());
    }

    @Override
    public List<PharmacyDrug> findAll() {
        return drugStore.values().stream()
                .sorted(Comparator.comparing(PharmacyDrug::getId))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<PharmacyDrug> findById(String id) {
        return Optional.ofNullable(drugStore.get(id));
    }

    @Override
    public Optional<PharmacyDrug> findByCode(String code) {
        return drugStore.values().stream()
                .filter(d -> d.getCode().equalsIgnoreCase(code.trim()))
                .findFirst();
    }

    @Override
    public PharmacyDrug save(PharmacyDrug drug) {
        if (drug.getId() == null || drug.getId().isBlank()) {
            int nextId = drugStore.size() + 1;
            drug.setId(String.format("DRUG-%02d", nextId));
        }
        if (drug.getCreatedAt() == null) {
            drug.setCreatedAt(LocalDateTime.now());
        }
        drug.setUpdatedAt(LocalDateTime.now());
        drugStore.put(drug.getId(), drug);
        return drug;
    }

    @Override
    public boolean existsByCode(String code) {
        return drugStore.values().stream()
                .anyMatch(d -> d.getCode().equalsIgnoreCase(code.trim()));
    }

    @Override
    public boolean existsByCodeAndIdNot(String code, String id) {
        return drugStore.values().stream()
                .anyMatch(d -> !d.getId().equals(id) && d.getCode().equalsIgnoreCase(code.trim()));
    }

    @Override
    public List<PharmacyDrug> search(String query, DrugStatus status) {
        String cleanQuery = (query != null) ? query.trim().toLowerCase() : "";
        return drugStore.values().stream()
                .filter(d -> {
                    boolean matchQuery = cleanQuery.isEmpty()
                            || d.getName().toLowerCase().contains(cleanQuery)
                            || d.getCode().toLowerCase().contains(cleanQuery)
                            || d.getActiveIngredient().toLowerCase().contains(cleanQuery)
                            || (d.getManufacturer() != null && d.getManufacturer().toLowerCase().contains(cleanQuery));
                    boolean matchStatus = (status == null) || d.getStatus() == status;
                    return matchQuery && matchStatus;
                })
                .sorted(Comparator.comparing(PharmacyDrug::getId))
                .collect(Collectors.toList());
    }

    @Override
    public List<PharmacyDrug> findLowStock(int threshold) {
        return drugStore.values().stream()
                .filter(d -> d.getStatus() == DrugStatus.ACTIVE && d.getStockQuantity() <= threshold)
                .sorted(Comparator.comparingInt(PharmacyDrug::getStockQuantity))
                .collect(Collectors.toList());
    }

    @Override
    public List<PharmacyDrug> findCriticalStock() {
        return drugStore.values().stream()
                .filter(d -> d.getStatus() == DrugStatus.ACTIVE && d.getStockQuantity() <= 10)
                .sorted(Comparator.comparingInt(PharmacyDrug::getStockQuantity))
                .collect(Collectors.toList());
    }
}
