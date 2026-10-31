package vn.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String accessToken;
    private String tokenType;
    private long expiresInSeconds;
    private AuthUserDto user;

    /** Cùng cấu trúc với model User ở frontend. */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthUserDto {
        private String id;
        private String username;
        private String fullName;
        private String role;
        private String email;
        private String phone;
        private String title;
        private String department;
        private String avatarUrl;
    }
}
