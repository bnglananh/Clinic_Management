# PHÂN HỆ APACHE CASSANDRA (WIDE-COLUMN STORE)

> **Hệ CSDL**: Apache Cassandra v4.1+  
> **Mô hình**: Wide-Column Family (LSM-Tree storage engine)  
> **Keyspace**: `clinic_keyspace`

---

## 1. VAI TRÒ TRONG HỆ THỐNG
Apache Cassandra được thiết kế để xử lý tải ghi dữ liệu cực lớn (Write-Heavy) với độ trễ thấp (< 10 ms), đảm nhiệm 2 nhiệm vụ cốt lõi:
1. **Dữ liệu chuỗi thời gian 5 chỉ số sinh hiệu (Time-Series Vital Signs)**:
   - Lưu trữ các lần đo huyết áp, mạch, thân nhiệt, cân nặng, chiều cao của bệnh nhân qua từng lần thăm khám.
   - Partition Key: `(patient_id)`, Clustering Key: `recorded_at DESC`. Giúp truy vấn diễn tiến lịch sử sinh tồn của bệnh nhân cực nhanh để hiển thị biểu đồ `VitalTrendChart`.
2. **Nhật ký kiểm toán y tế bất biến (Immutable Medical Audit Trail - BR-28)**:
   - Ghi nhận mọi thay đổi trạng thái khám, khóa bệnh án EMR, thanh toán viện phí và trừ kho thuốc theo cơ chế **Chỉ ghi thêm (Append-Only)**, không cho phép cập nhật hay xóa dữ liệu.

---

## 2. HƯỚNG DẪN KHỞI TẠO
Chạy file script `init-schema.cql` qua công cụ `cqlsh`:

```bash
# Thực thi qua cqlsh:
cqlsh -f init-schema.cql

# Hoặc qua container Docker:
docker exec -i clinic-cassandra cqlsh < init-schema.cql
```
