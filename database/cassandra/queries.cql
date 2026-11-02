-- =========================================================================
-- SMART CLINIC EMR – Truy vấn mẫu Cassandra
-- Chạy:  cqlsh -f database/cassandra/queries.cql
--        docker exec -i clinic-cassandra cqlsh < database/cassandra/queries.cql
-- Mọi truy vấn đều chỉ định đủ partition key → đọc đúng 1 partition, không cần ALLOW FILTERING.
-- =========================================================================
USE clinic_keyspace;

-- 1. Sinh hiệu: 5 lần đo gần nhất của một bệnh nhân (→ GET /api/records/patient/{id}/vitals-history)
SELECT recorded_at, blood_pressure_systolic AS sys, blood_pressure_diastolic AS dia, heart_rate, bmi, spo2, doctor_name
FROM patient_vital_signs WHERE patient_id = 'usr-pat-01' LIMIT 5;

-- 2. Sinh hiệu theo khoảng thời gian (lọc trên clustering key recorded_at)
SELECT recorded_at, blood_pressure_systolic, blood_pressure_diastolic
FROM patient_vital_signs
WHERE patient_id = 'usr-pat-01' AND recorded_at >= '2026-04-01' AND recorded_at < '2026-10-01';

-- 3. Thống kê trong một partition: số lần đo, huyết áp tâm thu trung bình / cao nhất
SELECT count(*) AS so_lan_do, avg(blood_pressure_systolic) AS tam_thu_tb, max(blood_pressure_systolic) AS tam_thu_max
FROM patient_vital_signs WHERE patient_id = 'usr-pat-01';

-- 4. Audit theo bản ghi: toàn bộ lịch sử thao tác trên bệnh án REC-01 (mới nhất trước)
SELECT toTimestamp(event_id) AS ghi_luc, action_type, actor_id, actor_role, summary
FROM audit_logs_by_entity WHERE entity_type = 'EMR' AND entity_id = 'REC-01';

-- 5. Audit theo người dùng + ngày (→ GET /api/admin/audit-logs?actorId=bacsi&date=2026-10-05)
SELECT action_time, entity_type, entity_id, action_type, summary
FROM audit_logs_by_actor WHERE actor_id = 'bacsi' AND log_date = '2026-10-05';

-- 6. Audit theo loại hành động + ngày (→ GET /api/admin/audit-logs?action=LOCK&date=2026-10-05)
SELECT action_time, actor_id, entity_type, entity_id
FROM audit_logs_by_action WHERE action_type = 'LOCK' AND log_date = '2026-10-05';

-- 7. Xem nhiều ngày của cùng một người: liệt kê các partition key bằng IN
SELECT log_date, action_type, entity_id
FROM audit_logs_by_actor WHERE actor_id = 'letan' AND log_date IN ('2026-10-04', '2026-10-05');

-- Ghi chú: truy vấn KHÔNG có partition key, ví dụ
--   SELECT * FROM audit_logs_by_entity WHERE actor_id = 'bacsi';
-- sẽ bị Cassandra từ chối (hoặc phải thêm ALLOW FILTERING và quét toàn cụm) –
-- đây là lý do dữ liệu audit được ghi trùng vào 3 bảng theo 3 kiểu truy vấn.
