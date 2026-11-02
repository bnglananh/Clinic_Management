package vn.clinic.store.cassandra;

import com.datastax.oss.driver.api.core.CqlSession;
import com.datastax.oss.driver.api.core.cql.BatchStatement;
import com.datastax.oss.driver.api.core.cql.DefaultBatchType;
import com.datastax.oss.driver.api.core.cql.PreparedStatement;
import com.datastax.oss.driver.api.core.cql.Row;
import com.datastax.oss.driver.api.core.uuid.Uuids;
import org.springframework.stereotype.Component;
import vn.clinic.config.StorageMode;
import vn.clinic.model.VitalSigns;
import vn.clinic.store.AuditLogStore;
import vn.clinic.store.VitalSignsHistoryStore;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Kho dữ liệu chuỗi thời gian trên Apache Cassandra (keyspace clinic_keyspace). */
public final class CassandraStores {

    static final ZoneId CLINIC_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private CassandraStores() {
    }

    @Component
    @StorageMode.NoSql
    public static class CassandraVitalSignsHistoryStore implements VitalSignsHistoryStore {

        private final CqlSession session;
        private final PreparedStatement insert;
        private final PreparedStatement selectLatest;

        public CassandraVitalSignsHistoryStore(CqlSession session) {
            this.session = session;
            this.insert = session.prepare("""
                    INSERT INTO patient_vital_signs (patient_id, recorded_at, visit_id, record_id, doctor_name,
                        blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature,
                        weight_kg, height_cm, bmi, spo2)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""");
            this.selectLatest = session.prepare(
                    "SELECT * FROM patient_vital_signs WHERE patient_id = ? LIMIT ?");
        }

        @Override
        public void record(VitalSignsPoint p) {
            VitalSigns v = p.vitals();
            int[] bp = parseBloodPressure(v.getBloodPressure());
            session.execute(insert.bind(
                    p.patientId(), p.recordedAt(), p.visitId(), p.recordId(), p.doctorName(),
                    bp[0], bp[1], v.getHeartRate(), v.getTemperature(),
                    v.getWeight(), v.getHeight(), v.getBmi(), v.getSpo2()));
        }

        @Override
        public List<VitalSignsPoint> latest(String patientId, int limit) {
            List<VitalSignsPoint> result = new ArrayList<>();
            for (Row r : session.execute(selectLatest.bind(patientId, limit))) {
                VitalSigns v = VitalSigns.builder()
                        .bloodPressure(r.getInt("blood_pressure_systolic") + "/" + r.getInt("blood_pressure_diastolic"))
                        .heartRate(r.getInt("heart_rate"))
                        .temperature(r.getDouble("temperature"))
                        .weight(r.getDouble("weight_kg"))
                        .height(r.getDouble("height_cm"))
                        .bmi(r.getDouble("bmi"))
                        .spo2(r.isNull("spo2") ? null : r.getDouble("spo2"))
                        .build();
                result.add(new VitalSignsPoint(r.getString("patient_id"), r.getInstant("recorded_at"),
                        r.getString("visit_id"), r.getString("record_id"), r.getString("doctor_name"), v));
            }
            return result;
        }

        /** "120/80" hoặc "120/80 mmHg" → [120, 80]; không đọc được thì [0, 0]. */
        static int[] parseBloodPressure(String raw) {
            if (raw == null) return new int[]{0, 0};
            String[] parts = raw.replaceAll("[^0-9/]", "").split("/");
            try {
                return new int[]{Integer.parseInt(parts[0]), parts.length > 1 ? Integer.parseInt(parts[1]) : 0};
            } catch (NumberFormatException e) {
                return new int[]{0, 0};
            }
        }
    }

    @Component
    @StorageMode.NoSql
    public static class CassandraAuditLogStore implements AuditLogStore {

        private final CqlSession session;
        private final PreparedStatement insertByEntity;
        private final PreparedStatement insertByActor;
        private final PreparedStatement insertByAction;
        private final PreparedStatement selectByEntity;
        private final PreparedStatement selectByActor;
        private final PreparedStatement selectByAction;

        public CassandraAuditLogStore(CqlSession session) {
            this.session = session;
            this.insertByEntity = session.prepare("""
                    INSERT INTO audit_logs_by_entity (entity_type, entity_id, event_id, action_type, actor_id,
                        actor_role, action_time, summary, client_ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""");
            this.insertByActor = session.prepare("""
                    INSERT INTO audit_logs_by_actor (actor_id, log_date, event_id, actor_role, entity_type,
                        entity_id, action_type, action_time, summary, client_ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""");
            this.insertByAction = session.prepare("""
                    INSERT INTO audit_logs_by_action (action_type, log_date, event_id, actor_id, actor_role,
                        entity_type, entity_id, action_time, summary, client_ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""");
            this.selectByEntity = session.prepare(
                    "SELECT * FROM audit_logs_by_entity WHERE entity_type = ? AND entity_id = ? LIMIT ?");
            this.selectByActor = session.prepare(
                    "SELECT * FROM audit_logs_by_actor WHERE actor_id = ? AND log_date = ? LIMIT ?");
            this.selectByAction = session.prepare(
                    "SELECT * FROM audit_logs_by_action WHERE action_type = ? AND log_date = ? LIMIT ?");
        }

        @Override
        public void append(AuditEvent e) {
            UUID eventId = Uuids.timeBased(); // timeuuid: duy nhất và tăng dần theo thời gian
            LocalDate day = e.actionTime().atZone(CLINIC_ZONE).toLocalDate();
            // Ghi cùng một sự kiện vào 3 bảng phục vụ 3 kiểu truy vấn – logged batch đảm bảo hoặc ghi đủ hoặc không.
            BatchStatement batch = BatchStatement.newInstance(DefaultBatchType.LOGGED,
                    insertByEntity.bind(e.entityType(), e.entityId(), eventId, e.actionType(), e.actorId(),
                            e.actorRole(), e.actionTime(), e.summary(), e.clientIp()),
                    insertByActor.bind(e.actorId(), day, eventId, e.actorRole(), e.entityType(), e.entityId(),
                            e.actionType(), e.actionTime(), e.summary(), e.clientIp()),
                    insertByAction.bind(e.actionType(), day, eventId, e.actorId(), e.actorRole(), e.entityType(),
                            e.entityId(), e.actionTime(), e.summary(), e.clientIp()));
            session.execute(batch);
        }

        @Override
        public List<AuditEvent> byEntity(String entityType, String entityId, int limit) {
            return map(session.execute(selectByEntity.bind(entityType, entityId, limit)));
        }

        @Override
        public List<AuditEvent> byActor(String actorId, LocalDate date, int limit) {
            return map(session.execute(selectByActor.bind(actorId, date, limit)));
        }

        @Override
        public List<AuditEvent> byAction(String actionType, LocalDate date, int limit) {
            return map(session.execute(selectByAction.bind(actionType, date, limit)));
        }

        private static List<AuditEvent> map(Iterable<Row> rows) {
            List<AuditEvent> result = new ArrayList<>();
            for (Row r : rows) {
                result.add(new AuditEvent(r.getString("entity_type"), r.getString("entity_id"),
                        r.getString("action_type"), r.getString("actor_id"), r.getString("actor_role"),
                        r.getInstant("action_time"), r.getString("summary"), r.getString("client_ip")));
            }
            return result;
        }
    }
}
