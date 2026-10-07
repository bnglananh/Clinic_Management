package vn.clinic.exception;

/**
 * Thrown when a business rule constraint is violated.
 * E.g., SRS UC019 BR 3.3: "Hệ thống không cho phép khóa tài khoản quản trị viên cuối cùng có quyền quản trị hệ thống."
 * E.g., SRS UC019 BR 4.1: "Nếu quyền được gán không phù hợp với quyền của quản trị viên hiện tại, hệ thống từ chối thao tác."
 */
public class BusinessRuleException extends AppException {
    public BusinessRuleException(String message) {
        super(message);
    }
}
