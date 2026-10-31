-- =========================================================================
-- SMART CLINIC EMR – Apache Cassandra Keyspace & Tables
-- Chạy:  cqlsh -f database/cassandra/init-schema.cql   (Docker tự chạy qua cassandra-init)
--
-- Cassandra phục vụ dữ liệu ghi nhiều, chỉ thêm (append-only), truy vấn theo thời gian:
--   1. patient_vital_signs      – chuỗi thời gian sinh hiệu của từng bệnh nhân
--   2. audit_logs_by_entity     – lịch sử thao tác trên một bản ghi (bệnh án, hóa đơn...)
--   3. audit_logs_by_actor      – lịch sử thao tác của một người dùng trong một ngày
--   4. audit_logs_by_action     – các thao tác cùng loại (LOCK, PAY...) trong một ngày
--
-- Thiết kế theo câu truy vấn (query-first): mỗi kiểu truy vấn có một bảng riêng,
-- backend ghi cùng một sự kiện vào cả 3 bảng audit bằng một BATCH (logged batch).
-- Khóa cụm event_id kiểu timeuuid: vừa sắp xếp theo thời gian vừa không bị trùng
-- khi hai thao tác xảy ra cùng một mili-giây.
-- =========================================================================

CREATE KEYSPACE IF NOT EXISTS clinic_keyspace
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE clinic_keyspace;

-- -------------------------------------------------------------------------
-- 1. Chuỗi thời gian sinh hiệu
--    Partition key : patient_id          → mọi lần đo của 1 bệnh nhân nằm cùng 1 partition
--    Clustering key: recorded_at DESC    → lấy N lần đo gần nhất không cần sắp xếp lại
--    Truy vấn: SELECT * FROM patient_vital_signs WHERE patient_id = ? LIMIT 20;
--              ... WHERE patient_id = ? AND recorded_at >= '2026-01-01' AND recorded_at < '2026-11-01';
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patient_vital_signs (
    patient_id               text,
    recorded_at              timestamp,
    visit_id                 text,
    record_id                text,
    doctor_name              text,
    blood_pressure_systolic  int,      -- Huyết áp tâm thu (mmHg)
    blood_pressure_diastolic int,      -- Huyết áp tâm trương (mmHg)
    heart_rate               int,      -- Mạch (lần/phút)
    temperature              double,   -- Thân nhiệt (°C)
    weight_kg                double,
    height_cm                double,
    bmi                      double,
    spo2                     double,   -- SpO2 (%)
    PRIMARY KEY ((patient_id), recorded_at)
) WITH CLUSTERING ORDER BY (recorded_at DESC)
  AND default_time_to_live = 0
  AND comment = 'Chuỗi thời gian sinh hiệu bệnh nhân';

-- -------------------------------------------------------------------------
-- 2. Nhật ký kiểm toán theo bản ghi bị tác động (truy vết pháp lý, BR-28)
--    Partition key : (entity_type, entity_id)
--    Truy vấn: SELECT * FROM audit_logs_by_entity WHERE entity_type = 'EMR' AND entity_id = 'REC-01';
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs_by_entity (
    entity_type  text,       -- EMR, BILL, APPOINTMENT, QUEUE, PHARMACY, ACCOUNT, AUTH
    entity_id    text,
    event_id     timeuuid,
    action_type  text,       -- CREATE, UPDATE, LOCK, PAY, CANCEL, RESCHEDULE, CHECKIN, ...
    actor_id     text,
    actor_role   text,
    action_time  timestamp,
    summary      text,
    client_ip    text,
    PRIMARY KEY ((entity_type, entity_id), event_id)
) WITH CLUSTERING ORDER BY (event_id DESC)
  AND comment = 'Audit log - truy vấn theo bản ghi';

-- -------------------------------------------------------------------------
-- 3. Nhật ký kiểm toán theo người thực hiện + ngày
--    Partition key : (actor_id, log_date) → giới hạn kích thước partition theo ngày
--    Truy vấn: SELECT * FROM audit_logs_by_actor WHERE actor_id = 'usr-doc-01' AND log_date = '2026-10-31';
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs_by_actor (
    actor_id     text,
    log_date     date,
    event_id     timeuuid,
    actor_role   text,
    entity_type  text,
    entity_id    text,
    action_type  text,
    action_time  timestamp,
    summary      text,
    client_ip    text,
    PRIMARY KEY ((actor_id, log_date), event_id)
) WITH CLUSTERING ORDER BY (event_id DESC)
  AND comment = 'Audit log - truy vấn theo người dùng và ngày';

-- -------------------------------------------------------------------------
-- 4. Nhật ký kiểm toán theo loại hành động + ngày
--    Truy vấn: SELECT * FROM audit_logs_by_action WHERE action_type = 'LOCK' AND log_date = '2026-10-31';
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs_by_action (
    action_type  text,
    log_date     date,
    event_id     timeuuid,
    actor_id     text,
    actor_role   text,
    entity_type  text,
    entity_id    text,
    action_time  timestamp,
    summary      text,
    client_ip    text,
    PRIMARY KEY ((action_type, log_date), event_id)
) WITH CLUSTERING ORDER BY (event_id DESC)
  AND comment = 'Audit log - truy vấn theo loại hành động và ngày';
