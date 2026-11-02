package vn.clinic.security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.regex.Pattern;

/**
 * Băm và kiểm tra mật khẩu bằng BCrypt.
 * Dữ liệu cũ còn lưu mật khẩu dạng chữ thường vẫn kiểm tra được (so sánh trực tiếp)
 * để không khóa người dùng; DemoAccountInitializer sẽ nâng cấp chúng sang BCrypt khi khởi động.
 */
public final class Passwords {

    private static final BCryptPasswordEncoder ENCODER = new BCryptPasswordEncoder(10);
    private static final Pattern BCRYPT = Pattern.compile("^\\$2[aby]?\\$\\d{2}\\$[./A-Za-z0-9]{53}$");

    private Passwords() {
    }

    public static String hash(String rawPassword) {
        return ENCODER.encode(rawPassword);
    }

    public static boolean matches(String rawPassword, String stored) {
        if (rawPassword == null || stored == null) return false;
        return isBcrypt(stored) ? ENCODER.matches(rawPassword, stored) : rawPassword.equals(stored);
    }

    public static boolean isBcrypt(String stored) {
        return stored != null && BCRYPT.matcher(stored).matches();
    }
}
