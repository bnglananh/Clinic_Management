package vn.clinic.repository;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Repository;
import vn.clinic.model.MedicalService;

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
public class InMemoryMedicalServiceRepository implements MedicalServiceRepository {

    private final Map<String, MedicalService> serviceStore = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        save(MedicalService.builder()
                .id("MS-01")
                .serviceCode("KB-TIMMACH")
                .serviceName("Khám Chuyên Khoa Tim Mạch")
                .category("KHÁM BỆNH")
                .price(new BigDecimal("200000"))
                .roomName("Phòng khám Nội 101")
                .unit("Lượt")
                .estimatedDurationMinutes(20)
                .active(true)
                .createdAt(LocalDateTime.now().minusDays(120))
                .updatedAt(LocalDateTime.now().minusDays(10))
                .build());

        save(MedicalService.builder()
                .id("MS-02")
                .serviceCode("KB-NOITQ")
                .serviceName("Khám Nội Tổng Quát Toàn Diện")
                .category("KHÁM BỆNH")
                .price(new BigDecimal("150000"))
                .roomName("Phòng khám Nội 102")
                .unit("Lượt")
                .estimatedDurationMinutes(15)
                .active(true)
                .createdAt(LocalDateTime.now().minusDays(120))
                .updatedAt(LocalDateTime.now().minusDays(10))
                .build());

        save(MedicalService.builder()
                .id("MS-03")
                .serviceCode("ECG-12C")
                .serviceName("Điện tâm đồ vi tính 12 chuyển đạo (ECG)")
                .category("CẬN LÂM SÀNG")
                .price(new BigDecimal("100000"))
                .roomName("Phòng Đo Điện Tim (ECG)")
                .unit("Lần")
                .estimatedDurationMinutes(10)
                .active(true)
                .createdAt(LocalDateTime.now().minusDays(120))
                .updatedAt(LocalDateTime.now().minusDays(10))
                .build());

        save(MedicalService.builder()
                .id("MS-04")
                .serviceCode("US-BUNGTQ")
                .serviceName("Siêu âm ổ bụng tổng quát màu Doppler")
                .category("CHẨN ĐOÁN HÌNH ẢNH")
                .price(new BigDecimal("250000"))
                .roomName("Phòng Siêu Âm 01")
                .unit("Lần")
                .estimatedDurationMinutes(15)
                .active(true)
                .createdAt(LocalDateTime.now().minusDays(120))
                .updatedAt(LocalDateTime.now().minusDays(10))
                .build());

        save(MedicalService.builder()
                .id("MS-05")
                .serviceCode("XR-NGUC")
                .serviceName("X-quang ngực thẳng kỹ thuật số (DR)")
                .category("CHẨN ĐOÁN HÌNH ẢNH")
                .price(new BigDecimal("150000"))
                .roomName("Phòng X-Quang Kỹ Thuật Số")
                .unit("Lần")
                .estimatedDurationMinutes(10)
                .active(true)
                .createdAt(LocalDateTime.now().minusDays(120))
                .updatedAt(LocalDateTime.now().minusDays(10))
                .build());

        save(MedicalService.builder()
                .id("MS-06")
                .serviceCode("XN-CBC24")
                .serviceName("Tổng phân tích tế bào máu ngoại vi (CBC 24 thông số)")
                .category("XÉT NGHIỆM")
                .price(new BigDecimal("120000"))
                .roomName("Phòng Xét Nghiệm Trung Tâm")
                .unit("Mẫu")
                .estimatedDurationMinutes(30)
                .active(true)
                .createdAt(LocalDateTime.now().minusDays(120))
                .updatedAt(LocalDateTime.now().minusDays(10))
                .build());

        save(MedicalService.builder()
                .id("MS-07")
                .serviceCode("XN-LIPID")
                .serviceName("Bộ mỡ máu toàn phần (Cholesterol, Triglyceride, HDL, LDL)")
                .category("XÉT NGHIỆM")
                .price(new BigDecimal("200000"))
                .roomName("Phòng Xét Nghiệm Trung Tâm")
                .unit("Mẫu")
                .estimatedDurationMinutes(45)
                .active(true)
                .createdAt(LocalDateTime.now().minusDays(120))
                .updatedAt(LocalDateTime.now().minusDays(10))
                .build());

        save(MedicalService.builder()
                .id("MS-08")
                .serviceCode("XN-GLUCOSE")
                .serviceName("Định lượng Glucose máu tĩnh mạch")
                .category("XÉT NGHIỆM")
                .price(new BigDecimal("50000"))
                .roomName("Phòng Xét Nghiệm Trung Tâm")
                .unit("Mẫu")
                .estimatedDurationMinutes(20)
                .active(true)
                .createdAt(LocalDateTime.now().minusDays(120))
                .updatedAt(LocalDateTime.now().minusDays(10))
                .build());
    }

    @Override
    public List<MedicalService> findAll() {
        return serviceStore.values().stream()
                .sorted(Comparator.comparing(MedicalService::getId))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<MedicalService> findById(String id) {
        return Optional.ofNullable(serviceStore.get(id));
    }

    @Override
    public Optional<MedicalService> findByServiceCode(String serviceCode) {
        return serviceStore.values().stream()
                .filter(s -> s.getServiceCode().equalsIgnoreCase(serviceCode.trim()))
                .findFirst();
    }

    @Override
    public MedicalService save(MedicalService service) {
        if (service.getId() == null || service.getId().isBlank()) {
            int nextId = serviceStore.size() + 1;
            service.setId(String.format("MS-%02d", nextId));
        }
        if (service.getCreatedAt() == null) {
            service.setCreatedAt(LocalDateTime.now());
        }
        service.setUpdatedAt(LocalDateTime.now());
        serviceStore.put(service.getId(), service);
        return service;
    }

    @Override
    public boolean existsByServiceCode(String serviceCode) {
        return serviceStore.values().stream()
                .anyMatch(s -> s.getServiceCode().equalsIgnoreCase(serviceCode.trim()));
    }

    @Override
    public boolean existsByServiceCodeAndIdNot(String serviceCode, String id) {
        return serviceStore.values().stream()
                .anyMatch(s -> !s.getId().equals(id) && s.getServiceCode().equalsIgnoreCase(serviceCode.trim()));
    }

    @Override
    public List<MedicalService> search(String query, String category, Boolean activeOnly) {
        String cleanQuery = (query != null) ? query.trim().toLowerCase() : "";
        String cleanCat = (category != null) ? category.trim().toUpperCase() : "";

        return serviceStore.values().stream()
                .filter(s -> {
                    boolean matchQuery = cleanQuery.isEmpty()
                            || s.getServiceName().toLowerCase().contains(cleanQuery)
                            || s.getServiceCode().toLowerCase().contains(cleanQuery)
                            || s.getRoomName().toLowerCase().contains(cleanQuery);
                    boolean matchCat = cleanCat.isEmpty()
                            || s.getCategory().equalsIgnoreCase(cleanCat);
                    boolean matchActive = (activeOnly == null) || (s.isActive() == activeOnly);
                    return matchQuery && matchCat && matchActive;
                })
                .sorted(Comparator.comparing(MedicalService::getId))
                .collect(Collectors.toList());
    }
}
