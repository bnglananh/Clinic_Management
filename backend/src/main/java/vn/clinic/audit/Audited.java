package vn.clinic.audit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Đánh dấu một thao tác nghiệp vụ cần ghi nhật ký kiểm toán (Cassandra) sau khi thực hiện thành công.
 *
 * <pre>
 * &#64;Audited(entity = "EMR", action = "LOCK", id = "id", summary = "Khóa bệnh án")
 * public MedicalRecordDto lockRecord(String id) { ... }
 * </pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Audited {

    /** Loại bản ghi: EMR, BILL, APPOINTMENT, QUEUE, PHARMACY, SERVICE, SCHEDULE, PATIENT, ACCOUNT, AUTH. */
    String entity();

    /** Loại hành động: CREATE, UPDATE, LOCK, PAY_CASH, PAY_VIETQR, CANCEL, CHECKIN, ... */
    String action();

    /**
     * Lấy mã bản ghi từ tham số: tên tham số ("id") hoặc thuộc tính của tham số ("request.email").
     * Để trống thì lấy {@code getId()} của giá trị trả về.
     */
    String id() default "";

    /** Mô tả ngắn hiển thị trong nhật ký. */
    String summary() default "";
}
