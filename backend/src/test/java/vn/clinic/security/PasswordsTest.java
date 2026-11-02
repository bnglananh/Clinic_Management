package vn.clinic.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PasswordsTest {

    @Test
    @DisplayName("Băm BCrypt và kiểm tra đúng/sai mật khẩu")
    void hashAndMatch() {
        String hash = Passwords.hash("123456");
        assertTrue(Passwords.isBcrypt(hash));
        assertTrue(Passwords.matches("123456", hash));
        assertFalse(Passwords.matches("1234567", hash));
    }

    @Test
    @DisplayName("Dữ liệu cũ dạng chữ thường vẫn kiểm tra được; hash giả không được coi là BCrypt")
    void legacyPlaintextStillWorks() {
        assertTrue(Passwords.matches("password123", "password123"));
        assertFalse(Passwords.isBcrypt("$2a$10$eMockPasswordHash01"));
        assertFalse(Passwords.matches(null, "x"));
    }
}
