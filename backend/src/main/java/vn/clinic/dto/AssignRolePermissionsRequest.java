package vn.clinic.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.clinic.model.UserRole;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignRolePermissionsRequest {

    @NotNull(message = "Vai trò (RBAC) không được để trống")
    private UserRole role;

    private Set<String> permissions;
}
