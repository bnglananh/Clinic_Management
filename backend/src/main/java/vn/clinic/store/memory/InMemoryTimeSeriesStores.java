package vn.clinic.store.memory;

import org.springframework.stereotype.Component;
import vn.clinic.config.StorageMode;
import vn.clinic.store.AuditLogStore;
import vn.clinic.store.VitalSignsHistoryStore;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Predicate;

/** Bản thay thế Cassandra lưu trong RAM – chỉ dùng cho unit test và profile "memory". */
public final class InMemoryTimeSeriesStores {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private InMemoryTimeSeriesStores() {
    }

    @Component
    @StorageMode.Memory
    public static class InMemoryVitalSignsHistoryStore implements VitalSignsHistoryStore {
        private final List<VitalSignsPoint> points = new CopyOnWriteArrayList<>();

        @Override
        public void record(VitalSignsPoint point) {
            points.add(point);
        }

        @Override
        public List<VitalSignsPoint> latest(String patientId, int limit) {
            return points.stream()
                    .filter(p -> p.patientId().equals(patientId))
                    .sorted(Comparator.comparing(VitalSignsPoint::recordedAt).reversed())
                    .limit(limit)
                    .toList();
        }
    }

    @Component
    @StorageMode.Memory
    public static class InMemoryAuditLogStore implements AuditLogStore {
        private final List<AuditEvent> events = new CopyOnWriteArrayList<>();

        @Override
        public void append(AuditEvent event) {
            events.add(event);
        }

        @Override
        public List<AuditEvent> byEntity(String entityType, String entityId, int limit) {
            return query(e -> e.entityType().equals(entityType) && e.entityId().equals(entityId), limit);
        }

        @Override
        public List<AuditEvent> byActor(String actorId, LocalDate date, int limit) {
            return query(e -> e.actorId().equals(actorId) && sameDay(e, date), limit);
        }

        @Override
        public List<AuditEvent> byAction(String actionType, LocalDate date, int limit) {
            return query(e -> e.actionType().equals(actionType) && sameDay(e, date), limit);
        }

        private static boolean sameDay(AuditEvent e, LocalDate date) {
            return e.actionTime().atZone(ZONE).toLocalDate().equals(date);
        }

        private List<AuditEvent> query(Predicate<AuditEvent> filter, int limit) {
            return events.stream().filter(filter)
                    .sorted(Comparator.comparing(AuditEvent::actionTime).reversed())
                    .limit(limit)
                    .toList();
        }
    }
}
