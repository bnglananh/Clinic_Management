# SMART CLINIC EMR – HỆ THỐNG QUẢN LÝ PHÒNG KHÁM THÔNG MINH

> **Hệ thống Quản lý Phòng khám Đa khoa & Bệnh án Điện tử (EMR)**  
> Ứng dụng kiến trúc **Polyglot Persistence NoSQL** (MongoDB, Redis, Cassandra, Neo4j) kết hợp giao diện y tế cao cấp với **Angular** và tầng dịch vụ **Spring Boot**.

---

## 📑 MỤC LỤC
1. [Tổng Quan Kiến Trúc](#1-tổng-quan-kiến-trúc)
2. [Yêu Cầu Môi Trường Cài Đặt](#2-yêu-cầu-môi-trường-cài-đặt)
3. [Hướng Dẫn Khởi Chạy Backend (Spring Boot)](#3-hướng-dẫn-khởi-chạy-backend-spring-boot)
4. [Hướng Dẫn Khởi Chạy Frontend (Angular)](#4-hướng-dẫn-khởi-chạy-frontend-angular)
5. [Tài Khoản Thử Nghiệm & Các Phân Hệ (Demo Roles)](#5-tài-khoản-thử-nghiệm--các-phân-hệ-demo-roles)
6. [Cấu Trúc Thư Mục Dự Án](#6-cấu-trúc-thư-mục-dự-án)
7. [Xử Lý Lỗi Thường Gặp (Troubleshooting)](#7-xử-lý-lỗi-thường-gặp-troubleshooting)

---

## 1. TỔNG QUAN KIẾN TRÚC

Dự án gồm 2 thành phần chính hoạt động phối hợp:

- **Frontend (`/frontend`)**: Xây dựng bằng **Angular 22+**, thư viện giao diện **NG-ZORRO (Ant Design)**, thiết kế Luxury Healthcare Palette (Deep Teal, Champagne Gold, Burgundy...), quản lý trạng thái phản ứng với **Signals** và tuân thủ chặt chẽ đặc tả nghiệp vụ phòng khám.
- **Backend (`/backend`)**: Xây dựng bằng **Java Spring Boot (Java 17 LTS)**, bảo mật Spring Security (Stateless, CORS enabled), kiến trúc phân lớp sạch (Clean Layered Architecture), kiểm soát quy tắc SRS và xử lý nghiệp vụ y tế.
- **Dữ liệu**: Hỗ trợ lớp dữ liệu mô phỏng đồng bộ nghiệp vụ (In-Memory Mock Repositories) và sẵn sàng tích hợp cụm phân tán NoSQL 4 thành phần (MongoDB, Redis, Cassandra, Neo4j).

---

## 2. YÊU CẦU MÔI TRƯỜNG CÀI ĐẶT

Trước khi chạy dự án, hãy đảm bảo máy tính đã cài đặt các công cụ sau:

| Thành phần | Yêu cầu phiên bản | Kiểm tra bằng lệnh | Ghi chú |
|---|---|---|---|
| **Java JDK** | Java 17 LTS (khuyến nghị JDK 17) | `java -version` | Đường dẫn ví dụ: `C:\Program Files\Java\jdk-17` |
| **Node.js** | v18.x, v20.x hoặc v22.x+ | `node -v` | Khuyến nghị bản LTS |
| **npm** | v9.x, v10.x hoặc v11.x | `npm -v` | Đi kèm với Node.js |
| **Git** | Bản mới nhất | `git --version` | Quản lý mã nguồn |

---

## 3. HƯỚNG DẪN KHỞI CHẠY BACKEND (SPRING BOOT)

Backend được quản lý bởi Maven Wrapper (`mvnw` / `mvnw.cmd`), do đó bạn không cần cài đặt Maven toàn cục.

### Bước 1: Mở Terminal và di chuyển vào thư mục backend
```bash
cd backend
```

### Bước 2: Thiết lập biến môi trường `JAVA_HOME` (Java 17)
> **Lưu ý quan trọng**: Nếu máy tính của bạn cài nhiều phiên bản Java (ví dụ mặc định là Java 8), bạn bắt buộc phải trỏ biến môi trường sang Java 17 trước khi chạy.

- **Trên Windows (PowerShell)**:
  ```powershell
  $env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
  ```
- **Trên Windows (Command Prompt - CMD)**:
  ```cmd
  set JAVA_HOME=C:\Program Files\Java\jdk-17
  ```
- **Trên macOS / Linux**:
  ```bash
  export JAVA_HOME=/path/to/your/jdk-17
  ```

### Bước 3: Khởi chạy ứng dụng Backend
- **Trên Windows (PowerShell hoặc CMD)**:
  ```powershell
  .\mvnw.cmd spring-boot:run
  ```
- **Trên macOS / Linux**:
  ```bash
  ./mvnw spring-boot:run
  ```

Ứng dụng Backend sẽ khởi động tại:  
👉 **`http://localhost:8080`**

### Bước 4: Chạy bộ kiểm thử tự động (Test Suite)
Để kiểm tra tính toàn vẹn và độ tin cậy của các use case (UC01, UC08, UC019):
```powershell
.\mvnw.cmd test
```

### Danh sách các API chính đang hoạt động:
- **Hồ sơ cá nhân (UC01)**: `GET /api/profile`, `PUT /api/profile`, `PUT /api/profile/change-password`
- **Thông báo (UC08)**: `GET /api/notifications`, `GET /api/notifications/summary`, `PATCH /api/notifications/{id}/read`
- **Quản trị người dùng & RBAC (UC019)**: `GET /api/admin/users`, `POST /api/admin/users`, `PATCH /api/admin/users/{id}/toggle-status`, `PUT /api/admin/users/{id}/permissions`

---

## 4. HƯỚNG DẪN KHỞI CHẠY FRONTEND (ANGULAR)

Frontend được cấu hình độc lập, tối ưu hóa giao diện với Angular Standalone Components.

### Bước 1: Mở Terminal mới và di chuyển vào thư mục frontend
```bash
cd frontend
```

### Bước 2: Cài đặt các gói phụ thuộc (Dependencies)
```bash
npm install
```
*(Nếu đã cài đặt trước đó, có thể bỏ qua bước này)*

### Bước 3: Khởi chạy máy chủ phát triển (Development Server)
```bash
npm start
```
*(hoặc dùng lệnh `npx ng serve`)*

Ứng dụng Frontend sẽ khởi chạy thành công tại:  
👉 **`http://localhost:4200`**

### Bước 4 (Tùy chọn): Đóng gói sản phẩm (Production Build)
```bash
npm run build
```
Kết quả build được tạo trong thư mục `frontend/dist/clinic-frontend`.

---

## 5. TÀI KHOẢN THỬ NGHIỆM & CÁC PHÂN HỆ (DEMO ROLES)

Hệ thống hỗ trợ cơ chế đăng nhập nhanh 1-chạm (1-Click Switch Role) tại trang đăng nhập `http://localhost:4200/auth/login` với 4 vai trò chuẩn theo quy trình phòng khám:

| Vai trò (Role) | Tên người dùng | Mật khẩu | Chức danh & Quyền hạn | Đường dẫn chính |
|---|---|---|---|---|
| **Lễ tân / Thu ngân** (`RECEPTIONIST`) | `letan` | *Bất kỳ* | Tiếp đón bệnh nhân, cấp STT hàng đợi, thu viện phí VietQR | `http://localhost:4200/reception/checkin`<br>`http://localhost:4200/reception/queue`<br>`http://localhost:4200/reception/billing` |
| **Bác sĩ Chuyên khoa** (`DOCTOR`) | `bacsi` | *Bất kỳ* | Khám bệnh lâm sàng, theo dõi sinh hiệu, chẩn đoán ICD-10, kê đơn & kiểm tra tương tác thuốc (DDI), khóa EMR | `http://localhost:4200/doctor/workspace`<br>`http://localhost:4200/doctor/queue` |
| **Quản trị viên** (`ADMIN`) | `admin` | *Bất kỳ* | Quản lý tài khoản nhân sự & RBAC, quản lý danh mục kho dược, dịch vụ kỹ thuật, ca trực | `http://localhost:4200/admin/users`<br>`http://localhost:4200/admin/pharmacy`<br>`http://localhost:4200/admin/services` |
| **Bệnh nhân** (`PATIENT`) | `benhnhan` | *Bất kỳ* | Đặt lịch khám trực tuyến, theo dõi tiến trình số khám, xem hồ sơ bệnh án cũ, nhận thông báo | `http://localhost:4200/patient/dashboard`<br>`http://localhost:4200/patient/booking`<br>`http://localhost:4200/patient/records` |

### Các đường dẫn công khai (Không cần đăng nhập):
- **Trang chủ giới thiệu**: `http://localhost:4200/`
- **Màn hình sảnh chờ TV (Lobby Queue Display)**: `http://localhost:4200/lobby`
- **Đăng ký tài khoản bệnh nhân**: `http://localhost:4200/auth/register`

---

## 6. CẤU TRÚC THƯ MỤC DỰ ÁN

```
clinic-management/
├── backend/                       # Mã nguồn Spring Boot REST API
│   ├── src/main/java/vn/clinic/   # Controllers, Services, Repositories, Models, DTOs
│   ├── src/main/resources/        # application.properties
│   ├── src/test/java/vn/clinic/   # Unit & Integration Tests (Test Suite)
│   ├── mvnw & mvnw.cmd            # Maven Wrapper
│   └── pom.xml                    # Cấu hình phụ thuộc Spring Boot
├── frontend/                      # Mã nguồn Angular UI
│   ├── src/app/
│   │   ├── core/                  # Services, Guards, Models, Mock Data
│   │   ├── features/              # Phân hệ: admin, doctor, reception, patient, auth
│   │   ├── layouts/               # Layouts cho Auth, Patient, Internal Staff
│   │   └── shared/                # Pipes, Components dùng chung (EMR Lock Badge, Currency, ...)
│   ├── package.json               # Cấu hình dependencies npm
│   └── angular.json               # Cấu hình Angular CLI
├── database/                      # Tài liệu và cấu hình phân hệ NoSQL
│   ├── mongodb/                   # CSDL Document (EMR, Patients, Invoices)
│   ├── redis/                     # CSDL In-Memory (Booking Slot Lock, Realtime Queue)
│   ├── cassandra/                 # CSDL Time-series & Audit Log (Vitals, Audit Logs)
│   └── neo4j/                     # CSDL Graph (Mạng lưới tri thức thuốc & DDI)
└── docs/                          # Tài liệu thiết kế hệ thống
    ├── PROJECT_OVERVIEW.md        # Mục tiêu, phạm vi & kiến trúc tổng thể
    ├── POLYGLOT_PERSISTENCE_ARCHITECTURE.md # Thiết kế chi tiết 4 hệ CSDL NoSQL
    ├── BUSINESS_RULES_AND_USE_CASES.md      # Quy tắc nghiệp vụ & đặc tả ca sử dụng
    └── FRONTEND_DESIGN_GUIDELINES.md        # Quy chuẩn thiết kế giao diện y tế cao cấp
```

---

## 7. XỬ LÝ LỖI THƯỜNG GẶP (TROUBLESHOOTING)

### 1. Backend báo lỗi phiên bản Java không phù hợp (`Unsupported class file major version` hoặc `release version 17 not supported`)
- **Nguyên nhân**: Máy đang chạy JDK cũ (như Java 8).
- **Khắc phục**: Gán biến môi trường `JAVA_HOME` trỏ tới JDK 17 trong phiên làm việc hiện tại:
  ```powershell
  $env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
  ```

### 2. Cổng `8080` (Backend) hoặc `4200` (Frontend) bị chiếm dụng
- **Nguyên nhân**: Có tiến trình khác đang chạy ở cổng này.
- **Khắc phục**:
  - Với Frontend, chạy với cổng khác:
    ```bash
    npx ng serve --port 4201
    ```
  - Với Backend, cấu hình lại trong file `backend/src/main/resources/application.properties`:
    ```properties
    server.port=8081
    ```
    *(Sau đó cập nhật cấu hình CORS và URL gọi API tương ứng)*.

### 3. Lỗi chính sách thực thi PowerShell trên Windows (`Execution Policy`)
- **Khắc phục**: Nếu gặp thông báo chặn chạy script, mở PowerShell quyền Administrator hoặc chạy lệnh:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  ```

---

*Hệ thống được phát triển theo đồ án Quản Lý Phòng Khám Thông Minh (Smart Clinic EMR).*
