package vn.clinic.controller;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.clinic.dto.ApiResponse;
import vn.clinic.exception.BusinessRuleException;
import vn.clinic.store.AuditLogStore;

import java.time.LocalDate;
import java.util.List;

/**
 * Tra cứu nhật ký kiểm toán (Cassandra). Mỗi kiểu tra cứu đọc từ đúng một bảng
 * có partition key tương ứng, không cần ALLOW FILTERING.
 */
@RestController
@RequestMapping("/api/admin/audit-logs")
public class AuditLogController {

    private final AuditLogStore auditLogStore;

    public AuditLogController(AuditLogStore auditLogStore) {
        this.auditLogStore = auditLogStore;
    }

    /**
     * Một trong ba cách lọc:
     * <ul>
     *   <li>{@code ?entityType=EMR&entityId=REC-01}</li>
     *   <li>{@code ?actorId=bacsi&date=2026-10-31}</li>
     *   <li>{@code ?action=LOCK&date=2026-10-31}</li>
     * </ul>
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AuditLogStore.AuditEvent>>> search(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String entityId,
            @RequestParam(required = false) String actorId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "50") int limit) {

        int safeLimit = Math.max(1, Math.min(limit, 500));
        LocalDate day = date != null ? date : LocalDate.now();
        List<AuditLogStore.AuditEvent> events;

        if (entityType != null && entityId != null) {
            events = auditLogStore.byEntity(entityType.toUpperCase(), entityId, safeLimit);
        } else if (actorId != null) {
            events = auditLogStore.byActor(actorId, day, safeLimit);
        } else if (action != null) {
            events = auditLogStore.byAction(action.toUpperCase(), day, safeLimit);
        } else {
            throw new BusinessRuleException(
                    "Cần lọc theo (entityType + entityId), hoặc actorId, hoặc action (kèm date nếu muốn xem ngày khác hôm nay).");
        }
        return ResponseEntity.ok(ApiResponse.success(events, "Tra cứu nhật ký kiểm toán thành công"));
    }
}
