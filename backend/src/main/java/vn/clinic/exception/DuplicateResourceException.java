package vn.clinic.exception;

/**
 * Thrown when a resource already exists (e.g. duplicate username, email, phone).
 * Corresponds to SRS UC019 BR 3.1: "Nếu tài khoản đã tồn tại, hệ thống cảnh báo trùng thông tin đăng nhập."
 */
public class DuplicateResourceException extends AppException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}
