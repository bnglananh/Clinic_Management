# 📜 TẬP LỆNH TRUY VẤN 4 CƠ SỞ DỮ LIỆU NOSQL THEO TÍNH NĂNG (SMART CLINIC EMR)

Thư mục này chứa toàn bộ các tập lệnh truy vấn mẫu cho **4 loại cơ sở dữ liệu NoSQL** trong hệ thống Smart Clinic EMR, được tổ chức và phân loại chi tiết theo từng **tính năng nghiệp vụ y tế (Use Case / Business Rule)** thực tế của dự án.

---

## 📂 1. Cấu trúc thư mục `scripts/`

```text
scripts/
├── 01_mongodb_queries.js        <-- Tập lệnh MongoDB đầy đủ theo 7 phân hệ nghiệp vụ
├── 02_redis_queries.redis       <-- Tập lệnh Redis đầy đủ theo 5 tính năng tốc độ cao & bảo mật
├── 03_cassandra_queries.cql     <-- Tập lệnh Cassandra CQL theo chuỗi thời gian & Audit Trail
├── 04_neo4j_queries.cypher      <-- Tập lệnh Neo4j Cypher đồ thị tương tác thuốc & an toàn kê đơn
├── mongodb/
│   └── queries_by_feature.js    <-- File gốc phân hệ MongoDB
├── redis/
│   └── queries_by_feature.redis <-- File gốc phân hệ Redis
├── cassandra/
│   └── queries_by_feature.cql   <-- File gốc phân hệ Cassandra
├── neo4j/
│   └── queries_by_feature.cypher<-- File gốc phân hệ Neo4j
└── README.md                    <-- Hướng dẫn này
```

---

## 📊 2. Bảng tổng hợp ánh xạ Tính năng - CSDL NoSQL

| STT | CSDL NoSQL | Loại hình | File Script | Tính năng / Phân hệ nghiệp vụ chính |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **MongoDB** (v7.0) | Document Store | `01_mongodb_queries.js` | 1. Quản lý hồ sơ bệnh nhân (UC-01, UC-02)<br>2. Đặt lịch hẹn khám (UC-03, UC-04, UC-05)<br>3. Cấp số & điều phối hàng đợi (UC-06, UC-07)<br>4. Bệnh án điện tử EMR đa cấu trúc & Khóa bệnh án (UC-08, UC-10)<br>5. Viện phí & Sổ thu ngân (UC-11, UC-12)<br>6. Quản lý kho dược & cảnh báo tồn kho (UC-14, UC-15)<br>7. Thống kê điều hành y tế Aggregation Pipeline (UC-16) |
| **2** | **Redis** (v7.4) | In-Memory Key-Value | `02_redis_queries.redis` | 1. Khóa phân tán giữ chỗ slot giờ khám chống đặt trùng (UC-03, BR-02)<br>2. Bộ đếm số thứ tự hàng ngày nguyên tử `INCR` (UC-06, BR-05)<br>3. Mã OTP xác thực và cơ chế chống Brute-force `HINCRBY` (UC-02, BR-17)<br>4. Bảng xếp hạng bác sĩ Sorted Set `ZSET` (UC-16, BR-26)<br>5. Danh sách đen thu hồi JWT Token khi Đăng xuất (BR-18) |
| **3** | **Apache Cassandra** (v4.1) | Wide-Column Store | `03_cassandra_queries.cql` | 1. Chuỗi thời gian sinh hiệu bệnh nhân (Vital Signs) (UC-08, BR-08)<br>2. Ghi đồng nhất 3 bảng Audit Log bằng Logged Batch (BR-27)<br>3. Kiểm toán vết can thiệp theo bản ghi EMR / Hóa đơn (UC-10, BR-27)<br>4. Giám sát hoạt động theo nhân sự y tế (UC-23, BR-27)<br>5. Giám sát thao tác rủi ro cao (LOCK, VOID) theo ngày (UC-23, BR-27) |
| **4** | **Neo4j** (v5.26) | Graph Database | `04_neo4j_queries.cypher` | 1. Kiểm tra tương tác thuốc - thuốc (DDI) trong đơn (UC-09, BR-10, BR-11)<br>2. Kiểm tra chống chỉ định theo mã bệnh ICD-10 (UC-09, BR-12)<br>3. Cảnh báo dị ứng theo nhóm dược lý (BR-13)<br>4. Gợi ý thuốc thay thế an toàn không tương tác (UC-09, BR-11)<br>5. Truy vết đường đi ngắn nhất giải thích tương quan thuốc (UC-09)<br>6. Bóc tách hoạt chất & nhóm dược lý từ biệt dược<br>7. Đánh giá hoạt chất rủi ro cao nhất danh mục dược phòng khám |

---

## 🚀 3. Hướng dẫn thực thi từng tập lệnh Script

### 3.1 MongoDB (`01_mongodb_queries.js`)

**Cách 1: Chạy trực tiếp từ máy trạm (Yêu cầu có `mongosh`)**
```bash
mongosh mongodb://localhost:27017/clinic_db scripts/01_mongodb_queries.js
```

**Cách 2: Chạy thông qua Docker container**
```bash
docker exec -i clinic-mongodb mongosh clinic_db < scripts/01_mongodb_queries.js
```

*Nội dung thực thi:*
- Thêm mới hồ sơ bệnh nhân demo kèm tiền sử dị ứng và bệnh nền ICD-10.
- Tìm kiếm Regex đa tiêu chí (Tên, SĐT, Mã, CCCD) và Full-Text Search qua Text Index.
- Cập nhật địa chỉ và tăng nguyên tử `totalVisits` bằng `$inc`.
- Tạo lịch hẹn, kiểm tra xung đột thời gian của bác sĩ và `$lookup` sang `patients`.
- Cấp số thứ tự khám, lọc danh sách chờ theo `sortOrder`, chuyển trạng thái `IN_CONSULTATION`.
- Lưu hồ sơ bệnh án EMR cấu trúc lồng đa cấp (Diagnoses, Prescriptions, ServiceOrders) và khóa bệnh án vĩnh viễn (`status: 'LOCKED'`).
- Lập hóa đơn viện phí, truy vấn sổ thu ngân sắp xếp theo `paidAt` phục vụ xuất báo cáo Excel.
- Cảnh báo thuốc sắp hết hàng (`stockQuantity <= 20`), xuất kho an toàn chống âm tồn kho, tính giá trị tồn kho theo nhà sản xuất.
- Chạy thống kê Aggregation phân bố chuyên khoa và Top 5 bệnh lý ICD-10 phổ biến nhất.
- Tự động xóa dữ liệu demo dọn dẹp sau khi chạy thử.

---

### 3.2 Redis (`02_redis_queries.redis`)

**Cách 1: Chạy trực tiếp từ máy trạm (Yêu cầu có `redis-cli`)**
```bash
redis-cli < scripts/02_redis_queries.redis
```

**Cách 2: Chạy thông qua Docker container**
```bash
docker exec -i clinic-redis redis-cli < scripts/02_redis_queries.redis
```

**Cách 3: Xem trực quan trên Web UI**
- Truy cập Redis Insight tại: [http://localhost:5540](http://localhost:5540)

*Nội dung thực thi:*
- Thử nghiệm khóa phân tán `SET slot:lock:... NX EX 600` chống xung đột đặt lịch 10 phút.
- Tăng số thứ tự buồng khám A và B bằng `INCR` và đặt `EXPIRE 86400`.
- Quản lý mã OTP 6 chữ số qua Hash, kiểm tra `TTL 300`, tăng biến `failedAttempts` bằng `HINCRBY`.
- Cập nhật điểm khám bệnh cho bác sĩ vào `leaderboard:doctors:YYYY-MM`, lấy Top 3 qua `ZREVRANGE ... WITHSCORES`, kiểm tra thứ hạng `ZREVRANK`.
- Lưu mã JWT vào danh sách đen `blacklist:token:...` và kiểm tra tức thì bằng `EXISTS` (O(1)).

---

### 3.3 Apache Cassandra (`03_cassandra_queries.cql`)

**Cách 1: Chạy trực tiếp từ máy trạm (Yêu cầu có `cqlsh`)**
```bash
cqlsh -f scripts/03_cassandra_queries.cql
```

**Cách 2: Chạy thông qua Docker container**
```bash
docker exec -i clinic-cassandra cqlsh < scripts/03_cassandra_queries.cql
```

*Nội dung thực thi:*
- Ghi nhận chỉ số sinh hiệu (Huyết áp, Mạch, Nhiệt độ, SpO2, BMI) vào `patient_vital_signs`.
- Truy vấn 5 lần đo sinh hiệu gần nhất (`WHERE patient_id = 'usr-pat-01' LIMIT 5`).
- Lọc sinh hiệu theo khoảng ngày khám (`recorded_at >= ... AND recorded_at < ...`).
- Tính toán thống kê huyết áp trung bình, lớn nhất trong partition của bệnh nhân.
- Ghi đồng thời 3 bảng kiểm toán bằng `BEGIN BATCH ... APPLY BATCH` (ACID Atomicity).
- Tra cứu lịch sử thao tác theo bản ghi EMR `REC-01` (`audit_logs_by_entity`).
- Giám sát hoạt động của bác sĩ trong ngày `audit_logs_by_actor`.
- Giám sát các thao tác nhạy cảm `LOCK` trong ngày `audit_logs_by_action`.

---

### 3.4 Neo4j Graph Database (`04_neo4j_queries.cypher`)

**Cách 1: Chạy trực tiếp từ máy trạm (Yêu cầu có `cypher-shell`)**
```bash
cypher-shell -u neo4j -p clinic12345 -f scripts/04_neo4j_queries.cypher
```

**Cách 2: Chạy thông qua Docker container**
```bash
docker exec -i clinic-neo4j cypher-shell -u neo4j -p clinic12345 < scripts/04_neo4j_queries.cypher
```

**Cách 3: Xem đồ thị trực quan (Graph Visualizer)**
- Mở trình duyệt truy cập: [http://localhost:7474](http://localhost:7474)
- Đăng nhập: username `neo4j`, password `clinic12345`.
- Dán từng câu truy vấn Cypher vào thanh lệnh trên cùng để xem đồ thị tương tác dạng node và relationship trực quan.

*Nội dung thực thi:*
- Kiểm tra tương tác thuốc - thuốc (DDI): Bóc tách hoạt chất của đơn thuốc gồm Aspirin 81, Warfarin, Plavix, Nexium và cảnh báo rủi ro xuất huyết (CRITICAL / MAJOR).
- Kiểm tra chống chỉ định: Phát hiện kê Ibuprofen / Glucophage cho bệnh nhân loét dạ dày (K25) và suy thận mạn (N18).
- Cảnh báo dị ứng: Truy vết toàn bộ biệt dược chứa hoạt chất thuộc nhóm dược lý Penicillin.
- Gợi ý thuốc thay thế an toàn: Tìm thuốc cùng công dụng điều trị (`TREATS`) nhưng không tương tác với các thuốc nền bệnh nhân đang sử dụng.
- Tìm đường đi ngắn nhất (`shortestPath`): Phân tích cơ chế liên kết bắc cầu giữa hai loại thuốc (ví dụ Amlor và Simvastatin).
- Phân tích rủi ro dược lý: Tìm Top 5 hoạt chất có nhiều tương tác nguy hiểm nhất trong danh mục dược phòng khám.
- Thống kê độ phủ điều trị bệnh lý ICD-10 theo số lượng hoạt chất và biệt dược sẵn có.

---

## 📌 4. Khắc phục sự cố thường gặp

1. **Docker Container chưa khởi động:**
   - Chạy lệnh khởi động 4 container CSDL:
     ```bash
     docker compose up -d clinic-mongodb clinic-redis clinic-cassandra clinic-neo4j
     ```
2. **Cassandra báo `Connection error`:**
   - Cassandra mất khoảng 45 - 60 giây để nạp JVM và mở cổng 9042 sau khi khởi động container. Hãy chờ container ở trạng thái `healthy` trước khi chạy script.
3. **Neo4j báo lỗi mật khẩu:**
   - Mật khẩu mặc định cấu hình trong hệ thống là: `clinic12345`.

