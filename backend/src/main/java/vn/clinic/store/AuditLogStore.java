package vn.clinic.store;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Nhật ký kiểm toán chỉ thêm, không sửa/xóa (Cassandra: 3 bảng audit_logs_by_*).
 */
public interface AuditLogStore {

    void append(AuditEvent event);

    List<AuditEvent> byEntity(String entityType, String entityId, int limit);

    List<AuditEvent> byActor(String actorId, LocalDate date, int limit);

    List<AuditEvent> byAction(String actionType, LocalDate date, int limit);

    record AuditEvent(
            String entityType,
            String entityId,
            String actionType,
            String actorId,
            String actorRole,
            Instant actionTime,
            String summary,
            String clientIp) {
    }
}
