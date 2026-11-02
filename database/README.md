# HỆ THỐNG CƠ SỞ DỮ LIỆU ĐA MÔ HÌNH (POLYGLOT PERSISTENCE)

> **Dự án**: Smart Clinic EMR – Quản Lý Phòng Khám Thông Minh  
> **Kiến trúc**: Polyglot Persistence phân bổ dữ liệu chuyên biệt trên 4 hệ CSDL NoSQL: **MongoDB, Redis, Apache Cassandra, Neo4j**.

---

## 1. TỔNG QUAN PHÂN BỔ DỮ LIỆU

Hệ thống tận dụng tối đa thế mạnh của từng công nghệ NoSQL để giải quyết các bài toán y tế chuyên biệt:

```
                            +-----------------------------+
                            | Spring Boot RESTful Backend |
                            +-----------------------------+
                                /         |         \         \
                               /          |          \         \
                              v           v           v         v
             +------------------+ +-------------+ +-----------+ +------------+
             |     MongoDB      | |    Redis    | | Cassandra | |   Neo4j    |
             | (Document Store) | | (Key-Value) | | (Columnar)| |  (Graph)   |
             +------------------+ +-------------+ +-----------+ +------------+
             | • Bệnh án EMR    | | • Khóa slot | | • Chuỗi   | | • Đồ thị   |
             | • Bệnh nhân      | |   lịch hẹn  | |   thời    | |   tri thức |
             | • Toa thuốc      | | • Hàng đợi  | |   gian    | |   thuốc    |
             | • Hóa đơn viện   | |   realtime  | |   sinh    | | • Tương    |
             |   phí            | | • Blacklist | |   hiệu    | |   tác DDI  |
             | • Danh mục Dược  | |   JWT token | | • Audit   | | • Chống chỉ|
             |   & Dịch vụ      | | • OTP reset | |   Log     | |   định     |
             +------------------+ +-------------+ +-----------+ +------------+
```

---

## 2. BẢNG THÔNG SỐ CỤM 4 DATABASE (DOCKER COMPOSE)

Tất cả 4 cơ sở dữ liệu được cấu hình đồng bộ trong file `docker-compose.yml` ở thư mục gốc của dự án:

| Hệ CSDL NoSQL | Tên Container | Cổng ánh xạ (Host) | Thông số RAM | Tài khoản & Thông tin cấu hình |
|---|---|---|---|---|
| **MongoDB v7.0** | `clinic-mongodb` | `127.0.0.1:27017` | Giới hạn 512MB (WiredTiger 256MB) | Database: `clinic_db`<br>URL: `mongodb://localhost:27017/clinic_db` |
| **Redis v7.4** | `clinic-redis` | `127.0.0.1:6379` | Giới hạn 128MB (maxmemory 64mb) | Host: `localhost:6379`<br>Policy: `volatile-lru` |
| **Apache Cassandra v4.1** | `clinic-cassandra` | `127.0.0.1:9042` | Giới hạn 1GB (Heap 384MB) | Keyspace: `clinic_keyspace`<br>Datacenter: `datacenter1` |
| **Neo4j v5.26** | `clinic-neo4j` | `127.0.0.1:7474` (Web)<br>`127.0.0.1:7687` (Bolt) | Giới hạn 768MB (Heap 384MB) | URI: `bolt://localhost:7687`<br>User: `neo4j` / Password: `clinic12345` |

---

## 3. HƯỚNG DẪN KHỞI CHẠY CỤM DATABASE BẰNG DOCKER COMPOSE

### Bước 1: Đảm bảo Docker Desktop đang chạy
- Khởi động ứng dụng **Docker Desktop** trên Windows.
- Đảm bảo biểu tượng Docker ở góc màn hình hiển thị trạng thái **Docker Engine running**.

### Bước 2: Khởi động 4 CSDL NoSQL
Mở Terminal tại thư mục gốc của dự án (`clinic-management`) và thực thi:

```powershell
docker compose up -d
```

### Bước 3: Cơ chế tự động nạp dữ liệu mẫu (Seed Data Containers)
Khi chạy lệnh trên, Docker Compose sẽ tự động khởi chạy 4 service chính và 3 service `-init` bổ trợ để nạp schema & dữ liệu mẫu:
1. `clinic-mongodb`: Tự động chạy script `init-mongo.js`, `seed-data.sh` và nạp toàn bộ 11 file JSON dữ liệu mẫu trong thư mục `database/mongodb/seed/`.
2. `clinic-redis-init`: Đợi `clinic-redis` healthy $\rightarrow$ nạp key/cấu hình ban đầu từ `database/redis/init-redis.redis`.
3. `clinic-cassandra-init`: Đợi `clinic-cassandra` healthy $\rightarrow$ khởi tạo keyspace `clinic_keyspace` từ `init-schema.cql` và nạp dữ liệu sinh hiệu từ `seed-data.cql`.
4. `clinic-neo4j-init`: Đợi `clinic-cassandra` và `clinic-neo4j` healthy $\rightarrow$ nạp toàn bộ mạng lưới đồ thị thuốc và tương tác DDI từ `database/neo4j/init-graph.cypher`.

> ⏳ **Lưu ý**: Cassandra và Neo4j chạy máy ảo Java JVM nên cần từ **30 - 60 giây** để hoàn tất nạp schema và chuyển sang trạng thái `healthy`.

### Bước 4: Kiểm tra trạng thái hoạt động của cụm
```powershell
docker compose ps
```
*Kết quả mong đợi*: Cả 4 container `clinic-mongodb`, `clinic-redis`, `clinic-cassandra`, `clinic-neo4j` đều ở trạng thái `Up (healthy)`. Các container `*-init` có trạng thái `Exited (0)` là hoàn thành bình thường.

### Lệnh dừng cụm database:
- **Dừng tạm thời (giữ nguyên dữ liệu)**:
  ```powershell
  docker compose down
  ```
- **Xóa sạch dữ liệu để nạp lại từ đầu**:
  ```powershell
  docker compose down -v
  ```

---

## 4. HƯỚNG DẪN KIỂM TRA & TRUY VẤN TRỰC TIẾP TRÊN TỪNG CSDL

### 4.1. Neo4j Graph Database
- **Giao diện Neo4j Browser**: Truy cập [http://localhost:7474](http://localhost:7474)
- **Đăng nhập**: User `neo4j` | Password `clinic12345`
- **Câu lệnh Cypher truy vấn mạng lưới tương tác thuốc đối kháng (DDI)**:
  ```cypher
  MATCH (d:Drug)-[:CONTAINS]->(a:ActiveIngredient)-[r:INTERACTS_WITH]-(b:ActiveIngredient)
  RETURN d, a, r, b LIMIT 25;
  ```
- **Tra cứu chống chỉ định theo bệnh (ICD-10)**:
  ```cypher
  MATCH (a:ActiveIngredient)-[r:CONTRAINDICATED_IN]->(s:Disease)
  RETURN a.name AS HoatChat, s.icdCode AS MaBenh, s.name AS TenBenh, r.reason AS LyDo;
  ```

### 4.2. MongoDB Document Store
Truy cập qua shell trực tiếp trong container:
```powershell
docker exec -it clinic-mongodb mongosh clinic_db --eval "db.patients.find().limit(2).pretty()"
```
Kiểm tra danh sách hóa đơn viện phí:
```powershell
docker exec -it clinic-mongodb mongosh clinic_db --eval "db.bills.find({}, {billCode: 1, patientName: 1, totalAmount: 1, paymentStatus: 1}).limit(5)"
```

### 4.3. Redis Key-Value Store
Kiểm tra kết nối và các key lưu trữ OTP, slot lock, ticket counter:
```powershell
docker exec -it clinic-redis redis-cli ping
# Kết quả: PONG

docker exec -it clinic-redis redis-cli keys "*"
```

### 4.4. Apache Cassandra Columnar Store
Truy vấn chuỗi thời gian 5 chỉ số sinh tồn của bệnh nhân:
```powershell
docker exec -it clinic-cassandra cqlsh -k clinic_keyspace -e "SELECT patient_id, recorded_at, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature FROM patient_vital_signs LIMIT 5;"
```
Truy vấn nhật ký kiểm toán y tế bất biến (Audit logs):
```powershell
docker exec -it clinic-cassandra cqlsh -k clinic_keyspace -e "SELECT entity_type, entity_id, event_time, actor_name, action FROM audit_logs_by_entity LIMIT 5;"
```

---

## 5. TÍCH HỢP TRONG BACKEND SPRING BOOT

Tầng dịch vụ Backend sử dụng thuộc tính `clinic.storage` trong file `backend/src/main/resources/application.properties`:

- **Chế độ NoSQL (Mặc định)**:
  ```properties
  clinic.storage=nosql
  ```
  Backend tự động kết nối đầy đủ cả 4 hệ CSDL: MongoDB (`spring.mongodb.uri`), Redis (`spring.data.redis.*`), Cassandra (`spring.cassandra.*`), Neo4j (`spring.neo4j.*`).
- **Chế độ In-Memory (Fallback khi máy yếu/không có Docker)**:
  ```properties
  clinic.storage=memory
  ```
  Khởi chạy độc lập bằng RAM không cần cài đặt database:
  ```powershell
  .\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=memory
  ```
