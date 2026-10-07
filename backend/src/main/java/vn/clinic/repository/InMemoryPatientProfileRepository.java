package vn.clinic.repository;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Repository;
import vn.clinic.model.PatientProfile;
import vn.clinic.model.UserRole;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class InMemoryPatientProfileRepository implements PatientProfileRepository {

    private final Map<String, PatientProfile> storage = new ConcurrentHashMap<>();

    @PostConstruct
    public void initMockData() {
        // Mock patient profile matching frontend
        save(PatientProfile.builder()
                .id("usr-pat-01")
                .patientCode("BN-2026-001")
                .username("benhnhan")
                .password("password123") // Plaintext or mock hash for testing
                .fullName("Phạm Văn An")
                .dateOfBirth("1990-05-15")
                .gender("NAM")
                .phone("0977889900")
                .email("an.pham@gmail.com")
                .address("123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh")
                .identityCardNumber("079090001234")
                .healthInsuranceNumber("GD4797931234567")
                .bloodType("O+")
                .allergies("Dị ứng Penicillin, Hải sản (Tôm, Cua)")
                .medicalNotes("Tiền sử tăng huyết áp nhẹ độ 1, theo dõi định kỳ")
                .avatarUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80")
                .role(UserRole.PATIENT)
                .membershipTier("Bệnh nhân thân thiết (Hạng Vàng)")
                .createdAt("2024-01-10")
                .updatedAt("2026-10-06")
                .build());

        // Secondary mock patient
        save(PatientProfile.builder()
                .id("usr-pat-02")
                .patientCode("BN-2026-002")
                .username("lan.huong")
                .password("password123")
                .fullName("Trần Thị Lan Hương")
                .dateOfBirth("1995-11-20")
                .gender("NỮ")
                .phone("0988223344")
                .email("huong.tran@gmail.com")
                .address("45 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh")
                .identityCardNumber("079195002345")
                .healthInsuranceNumber("DN4797939876543")
                .bloodType("A+")
                .allergies("Không có tiền sử dị ứng đã biết")
                .medicalNotes("Sức khỏe bình thường")
                .avatarUrl("https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80")
                .role(UserRole.PATIENT)
                .membershipTier("Bệnh nhân Tiêu chuẩn (Hạng Bạc)")
                .createdAt("2024-03-15")
                .updatedAt("2026-09-25")
                .build());
    }

    @Override
    public List<PatientProfile> findAll() {
        return new ArrayList<>(storage.values());
    }

    @Override
    public Optional<PatientProfile> findById(String id) {
        return Optional.ofNullable(storage.get(id));
    }

    @Override
    public Optional<PatientProfile> findByUsername(String username) {
        if (username == null) return Optional.empty();
        return storage.values().stream()
                .filter(p -> username.equalsIgnoreCase(p.getUsername()))
                .findFirst();
    }

    @Override
    public Optional<PatientProfile> findByEmail(String email) {
        if (email == null) return Optional.empty();
        return storage.values().stream()
                .filter(p -> email.equalsIgnoreCase(p.getEmail()))
                .findFirst();
    }

    @Override
    public Optional<PatientProfile> findByPhone(String phone) {
        if (phone == null) return Optional.empty();
        return storage.values().stream()
                .filter(p -> phone.equals(p.getPhone()))
                .findFirst();
    }

    @Override
    public PatientProfile save(PatientProfile profile) {
        if (profile.getId() == null || profile.getId().isBlank()) {
            int nextIndex = storage.size() + 1;
            profile.setId(String.format("usr-pat-%02d", nextIndex));
        }
        storage.put(profile.getId(), profile);
        return profile;
    }

    @Override
    public boolean existsByUsername(String username) {
        return findByUsername(username).isPresent();
    }

    @Override
    public boolean existsByEmail(String email) {
        return findByEmail(email).isPresent();
    }

    @Override
    public boolean existsByPhone(String phone) {
        return findByPhone(phone).isPresent();
    }
}
