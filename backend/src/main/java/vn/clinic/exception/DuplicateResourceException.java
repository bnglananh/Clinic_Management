package vn.clinic.exception;

/**
 * Thrown when a resource already exists (e.g. duplicate username, email, phone).
 */
public class DuplicateResourceException extends AppException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}
