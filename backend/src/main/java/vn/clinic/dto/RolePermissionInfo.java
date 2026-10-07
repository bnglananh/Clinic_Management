package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RolePermissionInfo {
    private String role;
    private String description;
    private List<PermissionItem> defaultPermissions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PermissionItem {
        private String code;
        private String description;
    }
}
