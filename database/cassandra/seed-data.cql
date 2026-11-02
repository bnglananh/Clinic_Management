-- =========================================================================
-- SMART CLINIC EMR – Dữ liệu mẫu Cassandra
-- Chạy sau init-schema.cql:  cqlsh -f database/cassandra/seed-data.cql
-- INSERT trong Cassandra là "upsert" theo khóa chính, nên chạy lại không bị nhân đôi
-- (riêng bảng audit dùng now() sinh timeuuid mới nên mỗi lần chạy sẽ thêm bản ghi).
-- =========================================================================
USE clinic_keyspace;

-- ---------- Chuỗi sinh hiệu: Phạm Văn An (usr-pat-01) – theo dõi tăng huyết áp ----------
INSERT INTO patient_vital_signs (patient_id, recorded_at, visit_id, record_id, doctor_name, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature, weight_kg, height_cm, bmi, spo2)
VALUES ('usr-pat-01', '2026-01-12 08:30:00+0700', 'vis-2601', 'REC-H01', 'TS.BS Trần Minh Hoàng', 152, 96, 88, 36.7, 74.5, 170, 25.8, 97);
INSERT INTO patient_vital_signs (patient_id, recorded_at, visit_id, record_id, doctor_name, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature, weight_kg, height_cm, bmi, spo2)
VALUES ('usr-pat-01', '2026-03-10 09:00:00+0700', 'vis-2603', 'REC-H02', 'TS.BS Trần Minh Hoàng', 145, 92, 84, 36.6, 73.8, 170, 25.5, 98);
INSERT INTO patient_vital_signs (patient_id, recorded_at, visit_id, record_id, doctor_name, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature, weight_kg, height_cm, bmi, spo2)
VALUES ('usr-pat-01', '2026-05-14 08:45:00+0700', 'vis-2605', 'REC-H03', 'TS.BS Trần Minh Hoàng', 140, 90, 82, 36.8, 72.9, 170, 25.2, 98);
INSERT INTO patient_vital_signs (patient_id, recorded_at, visit_id, record_id, doctor_name, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature, weight_kg, height_cm, bmi, spo2)
VALUES ('usr-pat-01', '2026-07-09 10:15:00+0700', 'vis-2607', 'REC-H04', 'TS.BS Trần Minh Hoàng', 136, 86, 80, 36.5, 72.0, 170, 24.9, 98);
INSERT INTO patient_vital_signs (patient_id, recorded_at, visit_id, record_id, doctor_name, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature, weight_kg, height_cm, bmi, spo2)
VALUES ('usr-pat-01', '2026-09-03 08:20:00+0700', 'vis-2609', 'REC-H05', 'TS.BS Trần Minh Hoàng', 132, 84, 78, 36.6, 71.4, 170, 24.7, 99);
INSERT INTO patient_vital_signs (patient_id, recorded_at, visit_id, record_id, doctor_name, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature, weight_kg, height_cm, bmi, spo2)
VALUES ('usr-pat-01', '2026-10-05 08:40:00+0700', 'vis-001', 'REC-01', 'TS.BS Trần Minh Hoàng', 128, 82, 76, 36.7, 71.0, 170, 24.6, 98);

-- ---------- Trần Thị Lan Hương (usr-pat-02) ----------
INSERT INTO patient_vital_signs (patient_id, recorded_at, visit_id, record_id, doctor_name, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature, weight_kg, height_cm, bmi, spo2)
VALUES ('usr-pat-02', '2026-06-20 14:00:00+0700', 'vis-2606b', 'REC-H11', 'ThS.BS Vũ Hải Đăng', 112, 72, 74, 37.9, 52.0, 158, 20.8, 97);
INSERT INTO patient_vital_signs (patient_id, recorded_at, visit_id, record_id, doctor_name, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature, weight_kg, height_cm, bmi, spo2)
VALUES ('usr-pat-02', '2026-09-18 15:30:00+0700', 'vis-2609b', 'REC-H12', 'ThS.BS Vũ Hải Đăng', 110, 70, 72, 36.6, 51.5, 158, 20.6, 99);

-- ---------- Đặng Kim Chi (p-004) ----------
INSERT INTO patient_vital_signs (patient_id, recorded_at, visit_id, record_id, doctor_name, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature, weight_kg, height_cm, bmi, spo2)
VALUES ('p-004', '2026-08-11 09:10:00+0700', 'vis-2608c', 'REC-H21', 'BSCKII Nguyễn Hoàng Long', 118, 76, 70, 36.5, 56.0, 160, 21.9, 99);
INSERT INTO patient_vital_signs (patient_id, recorded_at, visit_id, record_id, doctor_name, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature, weight_kg, height_cm, bmi, spo2)
VALUES ('p-004', '2026-10-02 09:25:00+0700', 'vis-002', 'REC-02', 'BSCKII Nguyễn Hoàng Long', 120, 78, 72, 36.6, 55.6, 160, 21.7, 99);

-- ---------- Nhật ký kiểm toán mẫu: mỗi sự kiện ghi vào 3 bảng trong một logged batch ----------
BEGIN BATCH
  INSERT INTO audit_logs_by_entity (entity_type, entity_id, event_id, action_type, actor_id, actor_role, action_time, summary, client_ip)
  VALUES ('EMR', 'REC-01', now(), 'CREATE', 'bacsi', 'DOCTOR', '2026-10-05 09:05:00+0700', 'Tạo bệnh án điện tử', '127.0.0.1');
  INSERT INTO audit_logs_by_actor (actor_id, log_date, event_id, actor_role, entity_type, entity_id, action_type, action_time, summary, client_ip)
  VALUES ('bacsi', '2026-10-05', now(), 'DOCTOR', 'EMR', 'REC-01', 'CREATE', '2026-10-05 09:05:00+0700', 'Tạo bệnh án điện tử', '127.0.0.1');
  INSERT INTO audit_logs_by_action (action_type, log_date, event_id, actor_id, actor_role, entity_type, entity_id, action_time, summary, client_ip)
  VALUES ('CREATE', '2026-10-05', now(), 'bacsi', 'DOCTOR', 'EMR', 'REC-01', '2026-10-05 09:05:00+0700', 'Tạo bệnh án điện tử', '127.0.0.1');
APPLY BATCH;

BEGIN BATCH
  INSERT INTO audit_logs_by_entity (entity_type, entity_id, event_id, action_type, actor_id, actor_role, action_time, summary, client_ip)
  VALUES ('EMR', 'REC-01', now(), 'LOCK', 'bacsi', 'DOCTOR', '2026-10-05 09:40:00+0700', 'Khóa bệnh án (không cho sửa)', '127.0.0.1');
  INSERT INTO audit_logs_by_actor (actor_id, log_date, event_id, actor_role, entity_type, entity_id, action_type, action_time, summary, client_ip)
  VALUES ('bacsi', '2026-10-05', now(), 'DOCTOR', 'EMR', 'REC-01', 'LOCK', '2026-10-05 09:40:00+0700', 'Khóa bệnh án (không cho sửa)', '127.0.0.1');
  INSERT INTO audit_logs_by_action (action_type, log_date, event_id, actor_id, actor_role, entity_type, entity_id, action_time, summary, client_ip)
  VALUES ('LOCK', '2026-10-05', now(), 'bacsi', 'DOCTOR', 'EMR', 'REC-01', '2026-10-05 09:40:00+0700', 'Khóa bệnh án (không cho sửa)', '127.0.0.1');
APPLY BATCH;

BEGIN BATCH
  INSERT INTO audit_logs_by_entity (entity_type, entity_id, event_id, action_type, actor_id, actor_role, action_time, summary, client_ip)
  VALUES ('BILL', 'bill-001', now(), 'PAY_CASH', 'letan', 'RECEPTIONIST', '2026-10-05 10:10:00+0700', 'Thu tiền mặt', '127.0.0.1');
  INSERT INTO audit_logs_by_actor (actor_id, log_date, event_id, actor_role, entity_type, entity_id, action_type, action_time, summary, client_ip)
  VALUES ('letan', '2026-10-05', now(), 'RECEPTIONIST', 'BILL', 'bill-001', 'PAY_CASH', '2026-10-05 10:10:00+0700', 'Thu tiền mặt', '127.0.0.1');
  INSERT INTO audit_logs_by_action (action_type, log_date, event_id, actor_id, actor_role, entity_type, entity_id, action_time, summary, client_ip)
  VALUES ('PAY_CASH', '2026-10-05', now(), 'letan', 'RECEPTIONIST', 'BILL', 'bill-001', '2026-10-05 10:10:00+0700', 'Thu tiền mặt', '127.0.0.1');
APPLY BATCH;
