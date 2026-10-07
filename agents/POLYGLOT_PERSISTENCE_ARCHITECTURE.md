# SMART CLINIC EMR – KIẾN TRÚC ĐA CƠ SỞ DỮ LIỆU NOSQL (POLYGLOT PERSISTENCE)
> **Tài liệu kim chỉ nam: Phân bổ dữ liệu trên cụm 4 hệ thống MongoDB, Redis, Cassandra, Neo4j**  
> **Nguồn trích xuất**: `SRS_WEB_QUAN_LY_PHONG_KHAM_FINAL.docx`  
> **Dự án**: Smart Clinic EMR – Hệ thống Quản lý Phòng khám Thông minh  

---

## 1. TỔNG QUAN PHÂN BỔ DỮ LIỆU ĐA MÔ HÌNH

Hệ thống y tế Smart Clinic EMR không sử dụng một hệ quản trị CSDL quan hệ (RDBMS) duy nhất mà áp dụng triết lý **Polyglot Persistence**, phân tách lưu trữ theo đúng đặc thù và tải truy vấn của từng miền dữ liệu:

```
                                  +------------------------------------+
                                  |    Spring Boot Backend Gateway     |
                                  +------------------------------------+
                                     /         |           |        \
                                    /          |           |         \
                                   v           v           v          v
                  +------------------+ +-------------+ +-----------+ +------------+
                  |     MongoDB      | |    Redis    | | Cassandra | |   Neo4j    |
                  | (Document Store) | | (Key-Value) | | (Columnar)| |  (Graph)   |
                  +------------------+ +-------------+ +-----------+ +------------+
                  | • Hồ sơ bệnh án  | | • Khóa slot | | • Chuỗi   | | • Đồ thị   |
                  | • Thông tin BN   | |   lịch hẹn  | |   thời    | |   tri thức |
                  | • Đơn thuốc      | | • Hàng đợi  | |   gian    | |   y tế     |
                  | • Hóa đơn & Thu  | |   khám RT   | |   sinh    | | • Tương    |
                  | • Danh mục thuốc | | • Blacklist | |   hiệu    | |   tác DDI  |
                  |   & dịch vụ      | |   JWT token | | • Audit   | | • Chống chỉ|
                  |                  | |             | |   Log     | |   định     |
                  +------------------+ +-------------+ +-----------+ +------------+
```

---

## 2. PHÂN HỆ MONGODB (DOCUMENT STORE - V6.0+)

### 2.1. Vai trò kỹ thuật
MongoDB chịu trách nhiệm lưu trữ các đối tượng dữ liệu nghiệp vụ chính có cấu trúc bán cấu trúc (Semi-structured), cho phép mở rộng linh hoạt theo từng chuyên khoa khám bệnh mà không cần thay đổi lược đồ cố định.

### 2.2. Các Collections chính
1. **`users`**: Tài khoản người dùng, vai trò (`PATIENT`, `RECEPTIONIST`, `DOCTOR`, `ADMIN`), mật khẩu băm BCrypt, thông tin liên hệ.
2. **`patients`**: Hồ sơ bệnh nhân (`patientCode`, CCCD mã hóa AES-256, họ tên, ngày sinh, giới tính, tiền sử dị ứng thuốc).
3. **`appointments`**: Lịch hẹn khám (bệnh nhân, bác sĩ, ngày hẹn, khung giờ, chuyên khoa, trạng thái hẹn).
4. **`medical_records` (EMR)**: Hồ sơ bệnh án điện tử chi tiết:
   - Triệu chứng lâm sàng.
   - Chẩn đoán theo mã ICD-10 (mã bệnh + tên bệnh).
   - Danh sách chỉ định dịch vụ kỹ thuật và kết quả.
   - Trạng thái khóa EMR (`isLocked: true/false`, lịch sử phiên bản `versions` bổ sung).
5. **`prescriptions`**: Đơn thuốc (danh sách thuốc, số lượng, liều dùng, thời gian uống, cảnh báo DDI đã xác nhận).
6. **`bills` & `payments`**: Hóa đơn viện phí (tiền khám, tiền cận lâm sàng, tiền thuốc, tổng tiền, phương thức Tiền mặt / VietQR, trạng thái `PAID` / `UNPAID`).
7. **`medicines`**: Danh mục thuốc phòng khám (mã thuốc, tên thương mại, hoạt chất, đơn vị tính, số lượng tồn kho `so_luong_ton`, cờ hoạt động `isActive`).
8. **`services`**: Danh mục dịch vụ kỹ thuật (siêu âm, xét nghiệm nhanh, thủ thuật, đơn giá).

---

## 3. PHÂN HỆ REDIS (IN-MEMORY KEY-VALUE - V7.0+)

### 3.1. Vai trò kỹ thuật
Redis đóng vai trò là lớp đệm tốc độ cực cao (< 15 ms), giải quyết 3 bài toán:
1. **Chống xung đột đặt trùng slot hẹn (Concurrency Booking Slot)**: Tạm giữ khóa khung giờ khám với thời gian sống tự động hết hạn (TTL = 10 phút). Nếu bệnh nhân không hoàn tất xác nhận trong 10 phút, khóa tự động giải phóng.
2. **Hàng đợi khám bệnh thời gian thực (Realtime Queue FIFO)**: Lưu trữ danh sách số thứ tự chờ khám trong ngày của từng phòng khám.
3. **Quản lý phiên & Thu hồi bảo mật**: Lưu trữ Refresh Token và Blacklist các JWT token bị thu hồi khi đăng xuất.

### 3.2. Cấu trúc Key & Kiểu dữ liệu
- **Khóa giữ chỗ slot hẹn**:  
  `slot:lock:{doctorId}:{date}:{timeSlot}`  
  *Kiểu*: `String`, *TTL*: `600s (10 phút)`.
- **Hàng đợi số thứ tự phòng khám**:  
  `queue:room:{roomId}:{date}`  
  *Kiểu*: `List` (FIFO: `RPUSH` khi tiếp nhận, `LPOP` khi gọi số vào khám) hoặc `Sorted Set` (ZSET sắp xếp theo thời gian tiếp nhận hoặc mức ưu tiên).
- **Bộ đếm số thứ tự trong ngày**:  
  `counter:ticket:{roomCode}:{date}`  
  *Kiểu*: `String` (thực hiện nguyên tử `INCR` sinh số thứ tự như A-001, A-002).
- **Blacklist JWT**:  
  `blacklist:jwt:{jti}`  
  *Kiểu*: `String`, *TTL*: bằng thời gian sống còn lại của Access Token.

---

## 4. PHÂN HỆ APACHE CASSANDRA (COLUMN-FAMILY STORE - V4.1+)

### 4.1. Vai trò kỹ thuật
Cassandra được thiết kế chuyên biệt cho tải ghi dữ liệu cực lớn (Write-Heavy) với độ trễ thấp (< 10 ms), phục vụ 2 miền dữ liệu bất biến:
1. **Dữ liệu chuỗi thời gian 5 chỉ số sinh hiệu (Time-Series Vital Signs)**: Lưu trữ các lần đo huyết áp, mạch, nhiệt độ, chiều cao, cân nặng của bệnh nhân theo thời gian.
2. **Nhật ký kiểm toán y tế bất biến (Medical Audit Trail)**: Ghi nhận mọi hành vi thay đổi trạng thái, chỉnh sửa hồ sơ, thanh toán, điều chỉnh kho dược theo cơ chế **Chỉ ghi thêm (Append-Only)** nhằm phục vụ thanh tra y tế.

### 4.2. Thiết kế Lược đồ CQL (Cassandra Query Language)

#### Bảng `patient_vital_signs` (Chỉ số sinh tồn theo chuỗi thời gian)
```sql
CREATE TABLE clinic_keyspace.patient_vital_signs (
    patient_id uuid,
    recorded_at timestamp,
    visit_id uuid,
    doctor_id uuid,
    blood_pressure_systolic int,   -- Huyết áp tâm thu (mmHg)
    blood_pressure_diastolic int,  -- Huyết áp tâm trương (mmHg)
    heart_rate int,                -- Nhịp tim / Mạch (lần/phút)
    temperature decimal,           -- Nhiệt độ (°C)
    height_cm decimal,             -- Chiều cao (cm)
    weight_kg decimal,             -- Cân nặng (kg)
    bmi decimal,                   -- Chỉ số khối cơ thể tự động tính
    PRIMARY KEY ((patient_id), recorded_at)
) WITH CLUSTERING ORDER BY (recorded_at DESC);
```
*Lợi ích*: Phân vùng theo `patient_id` giúp việc truy vấn lịch sử diễn tiến sinh hiệu của một bệnh nhân được thực thi tức thì để vẽ biểu đồ ECharts.

#### Bảng `medical_audit_logs` (Nhật ký kiểm toán y tế bất biến)
```sql
CREATE TABLE clinic_keyspace.medical_audit_logs (
    entity_type text,              -- 'EMR', 'BILL', 'PRESCRIPTION', 'STOCK'
    logged_at timestamp,
    log_id uuid,
    actor_id uuid,
    actor_name text,
    actor_role text,
    action text,                   -- 'CREATE', 'UPDATE_STATUS', 'LOCK_EMR', 'PAY'
    entity_id text,
    details text,
    ip_address text,
    PRIMARY KEY ((entity_type), logged_at, log_id)
) WITH CLUSTERING ORDER BY (logged_at DESC, log_id ASC);
```

---

## 5. PHÂN HỆ NEO4J (GRAPH DATABASE - V5.0+)

### 5.1. Vai trò kỹ thuật
Neo4j biểu diễn mạng lưới tri thức dược học và bệnh lý nhằm thực thi các thuật toán duyệt đồ thị (Graph Traversal) phát hiện **Tương tác thuốc nguy hại (Drug-Drug Interaction - DDI)** và **Chống chỉ định theo bệnh lý (Contraindication)** trong thời gian < 200 ms.

### 5.2. Mô hình Đồ thị Nút (Nodes) & Cạnh (Relationships)
- **Các loại Nút (Node Labels)**:
  - `(:Drug)`: Thuốc (ví dụ: *Aspirin*, *Warfarin*, *Ibuprofen*, *Amoxicillin*).
  - `(:ActiveIngredient)`: Hoạt chất dược lý (ví dụ: *Acid Acetylsalicylic*, *Amoxicillin Trihydrate*).
  - `(:Disease)`: Bệnh lý theo mã ICD-10 (ví dụ: *I10 - Tăng huyết áp*, *K25 - Loét dạ dày*).
- **Các loại Quan hệ (Relationships)**:
  - `(d:Drug)-[:CONTAINS]->(ai:ActiveIngredient)`
  - `(d1:Drug)-[:INTERACTS_WITH {severity: 'HIGH'|'MODERATE'|'LOW', warning: '...'}]->(d2:Drug)`
  - `(d:Drug)-[:CONTRAINDICATED_WITH {reason: '...'}]->(dis:Disease)`

### 5.3. Mẫu truy vấn Cypher phát hiện tương tác thuốc
Khi bác sĩ kê đơn gồm danh sách các mã thuốc `['MED-001', 'MED-005']`:
```cypher
MATCH (d1:Drug)-[r:INTERACTS_WITH]-(d2:Drug)
WHERE d1.code IN $drugCodes AND d2.code IN $drugCodes AND id(d1) < id(d2)
RETURN d1.name AS drugA, d2.name AS drugB, r.severity AS severity, r.warning AS warning
```
Nếu truy vấn trả về kết quả có `severity: 'HIGH'`, giao diện Frontend lập tức kích hoạt **Hộp thoại xác nhận cảnh báo tương tác thuốc màu đỏ Burgundy** (`DrugInteractionModalComponent`), bắt buộc bác sĩ đọc kỹ và tick chọn xác nhận trách nhiệm mới cho phép lưu đơn thuốc.
