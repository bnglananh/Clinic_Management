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
             |   & Dịch vụ      | |             | |   Log     | |   định     |
             +------------------+ +-------------+ +-----------+ +------------+
```

---

## 2. CẤU TRÚC THƯ MỤC PHÂN HỆ DATABASE

| Thư mục | Hệ CSDL NoSQL | Mô hình lưu trữ | Mục đích & Tài nguyên đính kèm |
|---|---|---|---|
| [`mongodb/`](./mongodb/) | **MongoDB v6.0+** | Document Store (JSON/BSON) | Lưu trữ các thực thể nghiệp vụ bán cấu trúc: Bệnh án EMR, Bệnh nhân, Hóa đơn, Toa thuốc, Danh mục thuốc & Dịch vụ. Chứa file khởi tạo [`init-mongo.js`](./mongodb/init-mongo.js). |
| [`redis/`](./redis/) | **Redis v7.0+** | In-Memory Key-Value | Khóa giữ chỗ slot hẹn (TTL = 10 phút), hàng đợi số thứ tự phòng khám (List/ZSet), bộ đếm số thứ tự nguyên tử, blacklist JWT token. |
| [`cassandra/`](./cassandra/) | **Apache Cassandra v4.1+** | Wide-Column Family | Chuỗi thời gian 5 chỉ số sinh tồn (`patient_vital_signs`) và Nhật ký kiểm toán y tế bất biến (`medical_audit_logs`, Append-Only). Chứa file schema [`init-schema.cql`](./cassandra/init-schema.cql). |
| [`neo4j/`](./neo4j/) | **Neo4j v5.0+** | Property Graph Database | Mạng lưới tri thức dược lý (Thuốc $\leftrightarrow$ Hoạt chất $\leftrightarrow$ Tương tác đối kháng DDI). Chứa file đồ thị [`init-graph.cypher`](./neo4j/init-graph.cypher). |

---

## 3. CƠ CHẾ VẬN HÀNH HIỆN TẠI & LỘ TRÌNH KẾT NỐI

1. **Giai đoạn hiện tại (Active)**:
   - Backend sử dụng lớp **In-Memory Thread-Safe Repositories** được chuẩn hóa đúng 100% theo các Interface NoSQL tương ứng (`PatientProfileRepository`, `QueueTicketRepository`, `BillRepository`, `PharmacyDrugRepository`, `MedicalRecordRepository`,...).
   - Cơ chế này cho phép toàn bộ chức năng Frontend và Backend hoạt động mượt mà, độc lập, sẵn sàng demo mọi kịch bản nghiệp vụ mà không bị phụ thuộc vào môi trường cụm phân tán nặng nề.
2. **Giai đoạn tích hợp NoSQL (Production Ready)**:
   - Sử dụng các file script `init-mongo.js`, `init-schema.cql`, `init-graph.cypher` để khởi tạo các node database trong container Docker.
   - Kích hoạt các Spring Data module trong cấu hình `application.properties`.
