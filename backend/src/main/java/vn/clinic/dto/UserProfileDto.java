package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.clinic.model.PatientProfile;
import vn.clinic.model.UserRole;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private String id;
    private String patientCode;
    private String username;
    private String fullName;
    private String dateOfBirth;
    private String gender;
    private String phone;
    private String email;
    private String address;
    private String identityCardNumber;
    private String healthInsuranceNumber;
    private String bloodType;
    private String allergies;
    private String medicalNotes;
    private String avatarUrl;
    private UserRole role;
    private String membershipTier;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private Integer totalVisits;
    private String createdAt;
    private String updatedAt;

    public static UserProfileDto fromEntity(PatientProfile entity) {
        if (entity == null) return null;
        return UserProfileDto.builder()
                .id(entity.getId())
                .patientCode(entity.getPatientCode())
                .username(entity.getUsername())
                .fullName(entity.getFullName())
                .dateOfBirth(entity.getDateOfBirth())
                .gender(entity.getGender())
                .phone(entity.getPhone())
                .email(entity.getEmail())
                .address(entity.getAddress())
                .identityCardNumber(entity.getIdentityCardNumber())
                .healthInsuranceNumber(entity.getHealthInsuranceNumber())
                .bloodType(entity.getBloodType())
                .allergies(entity.getAllergies())
                .medicalNotes(entity.getMedicalNotes())
                .avatarUrl(entity.getAvatarUrl())
                .role(entity.getRole())
                .membershipTier(entity.getMembershipTier())
                .emergencyContactName(entity.getEmergencyContactName())
                .emergencyContactPhone(entity.getEmergencyContactPhone())
                .totalVisits(entity.getTotalVisits())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
