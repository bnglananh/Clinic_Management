package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.clinic.model.AccountStatus;
import vn.clinic.model.StaffAccount;
import vn.clinic.model.UserRole;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffAccountDto {
    private String id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private UserRole role;
    private String roleDescription;
    private String department;
    private String title;
    private AccountStatus status;
    private Set<String> permissions;
    private String lastLoginAt;
    private String createdAt;
    private String updatedAt;

    public static StaffAccountDto fromEntity(StaffAccount entity) {
        if (entity == null) return null;
        return StaffAccountDto.builder()
                .id(entity.getId())
                .username(entity.getUsername())
                .fullName(entity.getFullName())
                .email(entity.getEmail())
                .phone(entity.getPhone())
                .role(entity.getRole())
                .roleDescription(entity.getRole() != null ? entity.getRole().getDescription() : null)
                .department(entity.getDepartment())
                .title(entity.getTitle())
                .status(entity.getStatus())
                .permissions(entity.getPermissions())
                .lastLoginAt(entity.getLastLoginAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
