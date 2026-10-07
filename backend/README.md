# SMART CLINIC EMR – BACKEND SERVICE

> **Phân hệ Dịch vụ Backend (Spring Boot 4.x / Java 17 LTS)**  
> Cung cấp các RESTful Web Services, kiểm soát quy tắc nghiệp vụ theo đặc tả SRS phòng khám và sẵn sàng kết nối cụm NoSQL.

---

## 1. YÊU CẦU MÔI TRƯỜNG

- **Java Development Kit (JDK)**: Java 17 LTS (Đường dẫn ví dụ: `C:\Program Files\Java\jdk-17`)
- **Maven**: Dự án tích hợp sẵn Maven Wrapper (`mvnw.cmd` / `mvnw`), không yêu cầu cài đặt Maven rời.

---

## 2. HƯỚNG DẪN KHỞI CHẠY BACKEND

### Bước 1: Mở Terminal tại thư mục `backend`
```powershell
cd backend
```

### Bước 2: Thiết lập JDK 17
```powershell
# Windows PowerShell:
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"

# Windows Command Prompt (CMD):
set JAVA_HOME=C:\Program Files\Java\jdk-17

# Linux / macOS:
export JAVA_HOME=/path/to/jdk-17
```

### Bước 3: Khởi chạy ứng dụng
```powershell
# Windows:
.\mvnw.cmd spring-boot:run

# Linux / macOS:
./mvnw spring-boot:run
```

- Server lắng nghe tại: **`http://localhost:8080`**
- CORS đã được kích hoạt sẵn sàng cho ứng dụng Angular tại `http://localhost:4200`.

---

## 3. CHẠY KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITE)

Để chạy toàn bộ các Unit Tests và Integration Tests:

```powershell
.\mvnw.cmd test
```

---

## 4. TÀI LIỆU NGHIỆP VỤ & QUY TẮC USE CASE

Chi tiết triển khai kỹ thuật, các DTOs, Business Rules và quy chuẩn hệ thống được quy định chi tiết tại:
- [Đặc tả nghiệp vụ & Use Cases (docs/BUSINESS_RULES_AND_USE_CASES.md)](../docs/BUSINESS_RULES_AND_USE_CASES.md)
- [Kiến trúc đa cơ sở dữ liệu NoSQL (docs/POLYGLOT_PERSISTENCE_ARCHITECTURE.md)](../docs/POLYGLOT_PERSISTENCE_ARCHITECTURE.md)

