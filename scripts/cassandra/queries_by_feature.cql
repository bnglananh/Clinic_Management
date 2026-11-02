-- ==============================================================================================
-- DỰ ÁN SMART CLINIC EMR - TẬP LỆNH TRUY VẤN APACHE CASSANDRA THEO TÍNH NĂNG CHUỖI THỜI GIAN & AUDIT
-- Keyspace: clinic_keyspace (Wide-Column Store, Port 9042)
--
-- Cách chạy:
--   1. Chạy với cqlsh:
--      cqlsh -f scripts/cassandra/queries_by_feature.cql
--   2. Chạy qua Docker Container:
--      docker exec -i clinic-cassandra cqlsh < scripts/cassandra/queries_by_feature.cql
--
-- Nguyên tắc thiết kế NoSQL: Query-Driven Modeling. 
-- Mọi truy vấn đều chỉ định đủ Partition Key -> Quét trực tiếp trên 1 Node/Partition,
-- KHÔNG bao giờ cần ALLOW FILTERING quét toàn cụm.
-- ==============================================================================================

USE clinic_keyspace;

-- ==============================================================================================
-- TÍNH NĂNG 1: THEO DÕI CHUỖI THỜI GIAN CHỈ SỐ SINH HIỆU (VITAL SIGNS TIME-SERIES - UC-08, BR-08)
-- Bảng: patient_vital_signs
-- Partition Key: patient_id | Clustering Key: recorded_at DESC (mới nhất xếp trên cùng)
-- ==============================================================================================

-- 1.1 Ghi nhận chuỗi đo sinh hiệu mới của bệnh nhân usr-pat-01
INSERT INTO patient_vital_signs (
    patient_id, recorded_at, blood_pressure_systolic, blood_pressure_diastolic, 
    heart_rate, temperature, spo2, weight_kg, height_cm, bmi, doctor_name, note
) VALUES (
    'usr-pat-01', toTimestamp(now()), 138, 88, 
    80, 36.7, 98, 68.5, 172.0, 23.1, 'TS.BS Trần Minh Hoàng', 'Đo trước khi kê đơn tăng huyết áp'
);

-- 1.2 Lấy 5 lần đo sinh hiệu gần nhất để vẽ biểu đồ diễn tiến sức khỏe trên UI
-- API tương ứng: GET /api/records/patient/{patientId}/vitals-history
SELECT recorded_at, 
       blood_pressure_systolic AS sys, 
       blood_pressure_diastolic AS dia, 
       heart_rate, 
       bmi, 
       spo2, 
       doctor_name, 
       note
FROM patient_vital_signs 
WHERE patient_id = 'usr-pat-01' 
LIMIT 5;

-- 1.3 Lọc dữ liệu sinh hiệu trong một dải thời gian khám cụ thể (Ví dụ: Từ tháng 04 đến tháng 11/2026)
SELECT recorded_at, 
       blood_pressure_systolic, 
       blood_pressure_diastolic, 
       heart_rate
FROM patient_vital_signs
WHERE patient_id = 'usr-pat-01' 
  AND recorded_at >= '2026-04-01' 
  AND recorded_at < '2026-11-01';

-- 1.4 Thống kê nội vùng (Intra-Partition Aggregation): Số lần đo, huyết áp tâm thu TB và lớn nhất
SELECT count(*) AS tong_so_lan_do, 
       avg(blood_pressure_systolic) AS huyet_ap_tam_thu_tb, 
       max(blood_pressure_systolic) AS huyet_ap_tam_thu_max,
       min(heart_rate) AS nhip_tim_thap_nhat
FROM patient_vital_signs 
WHERE patient_id = 'usr-pat-01';


-- ==============================================================================================
-- TÍNH NĂNG 2: GHI ĐỒNG THỜI NHẬT KÝ KIỂM TOÁN VÀO 3 BẢNG (LOGGED BATCH - BR-27)
-- Ghi atomic bằng BEGIN BATCH ... APPLY BATCH để đảm bảo tính nhất quán dữ liệu giữa 3 bảng denormalized
-- ==============================================================================================
BEGIN BATCH
  -- Ghi vào bảng tra cứu theo bản ghi
  INSERT INTO audit_logs_by_entity (
      entity_type, entity_id, event_id, action_type, actor_id, actor_name, actor_role, ip_address, summary
  ) VALUES (
      'EMR', 'REC-01', now(), 'LOCK', 'bacsi', 'TS.BS Trần Minh Hoàng', 'DOCTOR', '192.168.1.10', 'Bác sĩ khóa hồ sơ bệnh án REC-01'
  );

  -- Ghi vào bảng tra cứu theo người thao tác
  INSERT INTO audit_logs_by_actor (
      actor_id, log_date, action_time, event_id, entity_type, entity_id, action_type, summary
  ) VALUES (
      'bacsi', '2026-10-05', toTimestamp(now()), now(), 'EMR', 'REC-01', 'LOCK', 'Khóa bệnh án REC-01 sau khi kết thúc chẩn đoán'
  );

  -- Ghi vào bảng tra cứu theo loại hành vi
  INSERT INTO audit_logs_by_action (
      action_type, log_date, action_time, event_id, actor_id, entity_type, entity_id, summary
  ) VALUES (
      'LOCK', '2026-10-05', toTimestamp(now()), now(), 'bacsi', 'EMR', 'REC-01', 'Thực thi khóa bệnh án vĩnh viễn'
  );
APPLY BATCH;


-- ==============================================================================================
-- TÍNH NĂNG 3: TRUY VẾT NHẬT KÝ KIỂM TOÁN THEO BẢN GHI (AUDIT TRAIL BY ENTITY - UC-10, BR-27)
-- Bảng: audit_logs_by_entity | Partition Key: (entity_type, entity_id) | Clustering Key: event_id DESC
-- ==============================================================================================

-- 3.1 Xem toàn bộ lịch sử can thiệp, chỉnh sửa trên bệnh án REC-01 (từ mới nhất đến cũ nhất)
SELECT toTimestamp(event_id) AS thoi_gian_ghi, 
       action_type, 
       actor_id, 
       actor_name, 
       actor_role, 
       ip_address, 
       summary
FROM audit_logs_by_entity 
WHERE entity_type = 'EMR' AND entity_id = 'REC-01';

-- 3.2 Lịch sử thao tác trên hóa đơn thu ngân BILL-01
SELECT toTimestamp(event_id) AS thoi_gian_ghi, 
       action_type, 
       actor_id, 
       actor_role, 
       summary
FROM audit_logs_by_entity 
WHERE entity_type = 'BILL' AND entity_id = 'BILL-01';


-- ==============================================================================================
-- TÍNH NĂNG 4: GIÁM SÁT HOẠT ĐỘNG CỦA NHÂN VIÊN Y TẾ (AUDIT TRAIL BY ACTOR - UC-23, BR-27)
-- Bảng: audit_logs_by_actor | Partition Key: (actor_id, log_date) | Clustering Key: action_time DESC
-- ==============================================================================================

-- 4.1 Xem tất cả hành động của Bác sĩ trong ngày 2026-10-05
-- API tương ứng: GET /api/admin/audit-logs?actorId=bacsi&date=2026-10-05
SELECT action_time, 
       entity_type, 
       entity_id, 
       action_type, 
       summary
FROM audit_logs_by_actor 
WHERE actor_id = 'bacsi' AND log_date = '2026-10-05';

-- 4.2 Giám sát hoạt động của Lễ tân qua nhiều ngày liên tiếp bằng mệnh đề IN
SELECT log_date, 
       action_time, 
       action_type, 
       entity_type, 
       entity_id, 
       summary
FROM audit_logs_by_actor 
WHERE actor_id = 'letan' AND log_date IN ('2026-10-04', '2026-10-05');


-- ==============================================================================================
-- TÍNH NĂNG 5: GIÁM SÁT HÀNH VI RỦI RO CAO TRONG HỆ THỐNG (AUDIT TRAIL BY ACTION - UC-23, BR-27)
-- Bảng: audit_logs_by_action | Partition Key: (action_type, log_date) | Clustering Key: action_time DESC
-- ==============================================================================================

-- 5.1 Liệt kê các thao tác KHÓA HỒ SƠ (LOCK) trong ngày 2026-10-05
SELECT action_time, 
       actor_id, 
       entity_type, 
       entity_id, 
       summary
FROM audit_logs_by_action 
WHERE action_type = 'LOCK' AND log_date = '2026-10-05';

-- 5.2 Giám sát thao tác HỦY HÓA ĐƠN HOÀN TIỀN (VOID)
SELECT action_time, 
       actor_id, 
       entity_type, 
       entity_id, 
       summary
FROM audit_logs_by_action 
WHERE action_type = 'VOID' AND log_date = '2026-10-05';

