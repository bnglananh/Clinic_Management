package vn.clinic.exception;

/**
 * Thrown when a business rule constraint is violated.
 */
public class BusinessRuleException extends AppException {
    public BusinessRuleException(String message) {
        super(message);
    }
}
