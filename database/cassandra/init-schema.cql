-- =========================================================================
-- SMART CLINIC EMR - Apache Cassandra Keyspace & Tables
-- Tối ưu cho tải ghi cực lớn (Write-Heavy) với 2 miền dữ liệu bất biến:
-- 1. Chuỗi thời gian sinh hiệu bệnh nhân (patient_vital_signs)
-- 2. Nhật ký kiểm toán y tế bất biến (medical_audit_logs - Append-Only)
-- =========================================================================

-- 1. Tạo Keyspace
CREATE KEYSPACE IF NOT EXISTS clinic_keyspace
WITH replication = {
    'class': 'SimpleStrategy',
    'replication_factor': 1
};

USE clinic_keyspace;

-- 2. Bảng Chuỗi thời gian sinh hiệu bệnh nhân (Time-Series Vital Signs)
-- Partition Key: patient_id
-- Clustering Key: recorded_at DESC (Truy vấn nhanh các lần đo gần nhất)
CREATE TABLE IF NOT EXISTS clinic_keyspace.patient_vital_signs (
    patient_id text,
    recorded_at timestamp,
    visit_id text,
    doctor_id text,
    blood_pressure_systolic int,   -- Huyết áp tâm thu (mmHg)
    blood_pressure_diastolic int,  -- Huyết áp tâm trương (mmHg)
    heart_rate int,                -- Mạch / Nhịp tim (nhịp/phút)
    temperature decimal,           -- Thân nhiệt (°C)
    height_cm decimal,             -- Chiều cao (cm)
    weight_kg decimal,             -- Cân nặng (kg)
    bmi decimal,                   -- Chỉ số khối cơ thể (BMI)
    sp_o2 int,                     -- Nồng độ oxy trong máu (%)
    notes text,
    PRIMARY KEY ((patient_id), recorded_at)
) WITH CLUSTERING ORDER BY (recorded_at DESC);

-- 3. Bảng Nhật ký kiểm toán y tế bất biến (Append-Only Audit Logs)
-- Phục vụ giám sát, thanh tra và truy vết pháp lý y khoa (BR-28)
-- Partition Key: (entity_type, entity_id)
-- Clustering Key: action_timestamp DESC
CREATE TABLE IF NOT EXISTS clinic_keyspace.medical_audit_logs (
    entity_type text,              -- EMR, BILL, PRESCRIPTION, PHARMACY, QUEUE
    entity_id text,                -- Mã định danh bản ghi bị tác động
    action_timestamp timestamp,
    action_type text,              -- CREATE, UPDATE, LOCK, PAY, CANCEL, DEDUCT_STOCK
    actor_id text,                 -- Mã tài khoản thực hiện
    actor_role text,               -- DOCTOR, RECEPTIONIST, ADMIN
    ip_address text,
    old_state text,                -- JSON trạng thái trước khi thay đổi
    new_state text,                -- JSON trạng thái sau khi thay đổi
    reason text,
    PRIMARY KEY ((entity_type, entity_id), action_timestamp)
) WITH CLUSTERING ORDER BY (action_timestamp DESC);
