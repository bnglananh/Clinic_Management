# PHÂN HỆ MONGODB (DOCUMENT STORE)

> **Hệ CSDL**: MongoDB v6.0+  
> **Mô hình**: Document Store (JSON/BSON)  
> **Cơ sở dữ liệu**: `clinic_db`

---

## 1. VAI TRÒ TRONG HỆ THỐNG
MongoDB chịu trách nhiệm lưu trữ các đối tượng dữ liệu nghiệp vụ chính có cấu trúc bán cấu trúc (Semi-structured), đáp ứng khả năng mở rộng linh hoạt theo từng chuyên khoa khám bệnh (khoa Nội, Ngoại, Sản, Nhi...) mà không đòi hỏi lược đồ quan hệ cứng nhắc:
- Hồ sơ bệnh nhân (`patients`)
- Bệnh án điện tử EMR bán cấu trúc (`medical_records`)
- Hóa đơn viện phí & chi tiết thanh toán (`bills`)
- Đơn thuốc (`prescriptions`)
- Danh mục dược phẩm & kho thuốc (`medicines`)
- Danh mục dịch vụ kỹ thuật (`services`)

---

## 2. HƯỚNG DẪN KHỞI TẠO
Chạy file script `init-mongo.js` để tự động tạo cơ sở dữ liệu, các collections, indexes và dữ liệu mẫu:

```bash
# Thực thi qua mongosh:
mongosh mongodb://localhost:27017/clinic_db init-mongo.js

# Hoặc qua container Docker:
docker exec -i clinic-mongodb mongosh clinic_db < init-mongo.js
```
