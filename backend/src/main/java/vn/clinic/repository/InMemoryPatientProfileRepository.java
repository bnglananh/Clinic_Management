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
                .membershipTier("Hạng Vàng VIP")
                .emergencyContactName("Nguyễn Thị Thu Hà (Vợ)")
                .emergencyContactPhone("0988112233")
                .totalVisits(4)
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
        // Patient p-001 (Nguyễn Văn Hùng)
        save(PatientProfile.builder()
                .id("p-001")
                .patientCode("BN-2026-0891")
                .fullName("Nguyễn Văn Hùng")
                .dateOfBirth("1982-05-14")
                .gender("NAM")
                .phone("0903881234")
                .email("hung.nguyen82@gmail.com")
                .address("45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP.HCM")
                .identityCardNumber("079082012345")
                .allergies("Dị ứng Penicillin, Aspirin (Gây phát ban và khó thở nhẹ)")
                .bloodType("O+")
                .emergencyContactName("Nguyễn Thị Hoa (Vợ)")
                .emergencyContactPhone("0908112334")
                .role(UserRole.PATIENT)
                .membershipTier("Bệnh nhân thân thiết")
                .totalVisits(5)
                .createdAt("2025-11-10")
                .updatedAt("2026-10-05")
                .build());

        // Patient p-002 (Lê Thị Thu Thảo)
        save(PatientProfile.builder()
                .id("p-002")
                .patientCode("BN-2026-0892")
                .fullName("Lê Thị Thu Thảo")
                .dateOfBirth("1995-10-22")
                .gender("NU")
                .phone("0918334556")
                .email("thuthao.le@gmail.com")
                .address("128 Nguyễn Trãi, Phường 3, Quận 5, TP.HCM")
                .identityCardNumber("079195009876")
                .allergies("Không ghi nhận tiền sử dị ứng thuốc")
                .bloodType("A+")
                .emergencyContactName("Lê Văn Nam (Bố)")
                .emergencyContactPhone("0913445667")
                .role(UserRole.PATIENT)
                .membershipTier("Bệnh nhân Tiêu chuẩn")
                .totalVisits(2)
                .createdAt("2026-01-15")
                .updatedAt("2026-10-05")
                .build());

        // Patient p-003 (Trần Đại Nghĩa)
        save(PatientProfile.builder()
                .id("p-003")
                .patientCode("BN-2026-0888")
                .fullName("Trần Đại Nghĩa")
                .dateOfBirth("1960-03-08")
                .gender("NAM")
                .phone("0988122345")
                .email("nghia.tran60@yahoo.com")
                .address("72 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP.HCM")
                .identityCardNumber("079060004321")
                .allergies("Dị ứng Sulfamid, Paracetamol liều cao")
                .bloodType("B+")
                .emergencyContactName("Trần Minh Đức (Con trai)")
                .emergencyContactPhone("0989334556")
                .role(UserRole.PATIENT)
                .membershipTier("Bệnh nhân Hạng Vàng")
                .totalVisits(8)
                .createdAt("2025-08-20")
                .updatedAt("2026-10-05")
                .build());

        // Patient p-004 (Đặng Kim Chi)
        save(PatientProfile.builder()
                .id("p-004")
                .patientCode("BN-2026-0885")
                .fullName("Đặng Kim Chi")
                .dateOfBirth("1989-12-05")
                .gender("NU")
                .phone("0977445678")
                .email("kimchi.dang@gmail.com")
                .address("210 Điện Biên Phủ, Phường 7, Quận 3, TP.HCM")
                .identityCardNumber("079089006543")
                .allergies("Dị ứng thức ăn hải sản (Tôm, Cua)")
                .bloodType("AB+")
                .emergencyContactName("Hoàng Quốc Việt (Chồng)")
                .emergencyContactPhone("0972889900")
                .role(UserRole.PATIENT)
                .membershipTier("Bệnh nhân thân thiết")
                .totalVisits(3)
                .createdAt("2026-02-18")
                .updatedAt("2026-10-05")
                .build());

        // Patient p-005 (Vũ Đức Thịnh)
        save(PatientProfile.builder()
                .id("p-005")
                .patientCode("BN-2026-0900")
                .fullName("Vũ Đức Thịnh")
                .dateOfBirth("1999-07-19")
                .gender("NAM")
                .phone("0933667889")
                .email("thinh.vu@gmail.com")
                .address("56 Hoàng Hoa Thám, Phường 13, Tân Bình, TP.HCM")
                .identityCardNumber("079199001122")
                .allergies("Không có tiền sử dị ứng")
                .bloodType("O+")
                .role(UserRole.PATIENT)
                .membershipTier("Bệnh nhân Tiêu chuẩn")
                .totalVisits(1)
                .createdAt("2026-03-01")
                .updatedAt("2026-10-05")
                .build());

        // Patient p-006 (Phạm Thị Mỹ Linh)
        save(PatientProfile.builder()
                .id("p-006")
                .patientCode("BN-2026-0905")
                .fullName("Phạm Thị Mỹ Linh")
                .dateOfBirth("1975-09-30")
                .gender("NU")
                .phone("0909554332")
                .address("88 Võ Thị Sáu, Phường 6, Quận 3, TP.HCM")
                .identityCardNumber("079075003344")
                .allergies("Dị ứng kháng sinh Cephalosporin")
                .bloodType("A+")
                .role(UserRole.PATIENT)
                .membershipTier("Bệnh nhân Thân thiết")
                .totalVisits(6)
                .createdAt("2025-09-12")
                .updatedAt("2026-10-05")
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
    public Optional<PatientProfile> findByPatientCode(String patientCode) {
        if (patientCode == null) return Optional.empty();
        return storage.values().stream()
                .filter(p -> patientCode.equalsIgnoreCase(p.getPatientCode()))
                .findFirst();
    }

    @Override
    public Optional<PatientProfile> findByIdentityCardNumber(String identityCardNumber) {
        if (identityCardNumber == null) return Optional.empty();
        String cleaned = identityCardNumber.trim();
        return storage.values().stream()
                .filter(p -> p.getIdentityCardNumber() != null && p.getIdentityCardNumber().trim().equals(cleaned))
                .findFirst();
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
        String cleaned = phone.replaceAll("\\s+", "");
        return storage.values().stream()
                .filter(p -> p.getPhone() != null && p.getPhone().replaceAll("\\s+", "").equals(cleaned))
                .findFirst();
    }

    @Override
    public List<PatientProfile> search(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return findAll();
        }
        String q = keyword.trim().toLowerCase();
        return storage.values().stream()
                .filter(p -> (p.getFullName() != null && p.getFullName().toLowerCase().contains(q))
                        || (p.getPatientCode() != null && p.getPatientCode().toLowerCase().contains(q))
                        || (p.getPhone() != null && p.getPhone().contains(q))
                        || (p.getIdentityCardNumber() != null && p.getIdentityCardNumber().contains(q)))
                .toList();
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

    @Override
    public boolean existsByIdentityCardNumber(String identityCardNumber) {
        return findByIdentityCardNumber(identityCardNumber).isPresent();
    }

    @Override
    public boolean existsByIdentityCardNumberAndIdNot(String identityCardNumber, String id) {
        if (identityCardNumber == null) return false;
        String cleaned = identityCardNumber.trim();
        return storage.values().stream()
                .anyMatch(p -> p.getIdentityCardNumber() != null
                        && p.getIdentityCardNumber().trim().equals(cleaned)
                        && !p.getId().equals(id));
    }

    @Override
    public boolean existsByPhoneAndIdNot(String phone, String id) {
        if (phone == null) return false;
        String cleaned = phone.replaceAll("\\s+", "");
        return storage.values().stream()
                .anyMatch(p -> p.getPhone() != null
                        && p.getPhone().replaceAll("\\s+", "").equals(cleaned)
                        && !p.getId().equals(id));
    }
}
