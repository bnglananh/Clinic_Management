package vn.clinic.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffAccount {
    private String id;
    private String username;
    private String password; // hashed / stored securely
    private String fullName;
    private String email;
    private String phone;
    private UserRole role;
    private String department;
    private String title;
    private AccountStatus status;

    @Builder.Default
    private Set<String> permissions = new HashSet<>();

    private String lastLoginAt;
    private String createdAt;
    private String updatedAt;
}
