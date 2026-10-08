package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.clinic.model.PatientProfile;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientDto {
    private String id;
    private String patientCode;
    private String cccd;
    private String fullName;
    private String dateOfBirth;
    private String gender;
    private String phone;
    private String email;
    private String address;
    private String allergyHistory;
    private String bloodType;
    private String insuranceNumber;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String createdAt;
    private Integer totalVisits;

    public static PatientDto fromEntity(PatientProfile p) {
        if (p == null) return null;
        return PatientDto.builder()
                .id(p.getId())
                .patientCode(p.getPatientCode())
                .cccd(p.getIdentityCardNumber())
                .fullName(p.getFullName())
                .dateOfBirth(p.getDateOfBirth())
                .gender(p.getGender())
                .phone(p.getPhone())
                .email(p.getEmail())
                .address(p.getAddress())
                .allergyHistory(p.getAllergies())
                .bloodType(p.getBloodType())
                .insuranceNumber(p.getHealthInsuranceNumber())
                .emergencyContactName(p.getEmergencyContactName())
                .emergencyContactPhone(p.getEmergencyContactPhone())
                .createdAt(p.getCreatedAt())
                .totalVisits(p.getTotalVisits() != null ? p.getTotalVisits() : 1)
                .build();
    }
}
