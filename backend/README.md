# SMART CLINIC EMR – BACKEND SERVICE

> **Phân hệ Dịch vụ Backend (Spring Boot 3.x / Java 17 LTS)**  
> Cung cấp hệ thống RESTful Web Services hoàn chỉnh, kiểm soát chặt chẽ 28 Quy tắc nghiệp vụ (Business Rules), hỗ trợ lớp dữ liệu mô phỏng In-Memory đồng bộ và sẵn sàng kết nối cụm 4 cơ sở dữ liệu phân tán NoSQL.

---

## 📑 MỤC LỤC
1. [Yêu Cầu Môi Trường](#1-yêu-cầu-môi-trường)
2. [Hướng Dẫn Cấu Hình & Khởi Chạy](#2-hướng-dẫn-cấu-hình--khởi-chạy)
3. [Kiểm Thử Tự Động (Automated Test Suite)](#3-kiểm-thử-tự-động-automated-test-suite)
4. [Danh Sách 14 REST Controllers & Endpoints](#4-danh-sách-14-rest-controllers--endpoints)
5. [Quy Tắc Nghiệp Vụ SRS (Business Rules BR-01 -> BR-28)](#5-quy-tắc-nghiệp-vụ-srs-business-rules-br-01---br-28)
6. [Cấu Trúc Gói Mã Nguồn (Package Architecture)](#6-cấu-trúc-gói-mã-nguồn-package-architecture)

---

## 1. YÊU CẦU MÔI TRƯỜNG

- **Java Development Kit (JDK)**: **Java 17 LTS** (Khuyến nghị OpenJDK 17 hoặc Oracle JDK 17).
  - *Ví dụ đường dẫn cài đặt trên Windows*: `C:\Program Files\Java\jdk-17`
- **Maven**: Dự án tích hợp sẵn Maven Wrapper (`mvnw.cmd` / `mvnw`), **không cần cài đặt Maven toàn cục**.

---

## 2. HƯỚNG DẪN CẤU HÌNH & KHỞI CHẠY

### Bước 1: Mở Terminal tại thư mục `backend`
```powershell
cd backend
```

### Bước 2: Thiết lập biến môi trường JDK 17
Nếu máy tính của bạn có Java 8 làm mặc định trong hệ thống, bạn cần chuyển sang JDK 17 trước khi chạy:

- **Windows PowerShell**:
  ```powershell
  $env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
  $env:Path = "$env:JAVA_HOME\bin;" + $env:Path
  ```
- **Windows Command Prompt (CMD)**:
  ```cmd
  set JAVA_HOME=C:\Program Files\Java\jdk-17
  set PATH=%JAVA_HOME%\bin;%PATH%
  ```
- **Linux / macOS**:
  ```bash
  export JAVA_HOME=/path/to/jdk-17
  export PATH=$JAVA_HOME/bin:$PATH
  ```

### Bước 3: Khởi chạy ứng dụng Backend
```powershell
# Windows:
.\mvnw.cmd spring-boot:run

# Linux / macOS:
./mvnw spring-boot:run
```

- **Địa chỉ dịch vụ**: `http://localhost:8080`
- **CORS Configuration**: Cho phép truy cập từ `http://localhost:4200` và `http://localhost:3000`.

---

## 3. KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITE)

Hệ thống có bộ bài test kiểm thử tự động toàn diện bao quát tất cả 14 controllers và các dịch vụ cốt lõi:

```powershell
.\mvnw.cmd clean test
```

> ✅ **Kết quả xác thực**:
> - Tổng số bài kiểm thử: **141 tests**
> - Số lỗi / Thất bại: **0 (100% PASS)**
> - Thời gian chạy: ~14 giây

---

## 4. DANH SÁCH 14 REST CONTROLLERS & ENDPOINTS

### 4.1. `AuthController` (`/api/auth`)
| Method | Endpoint | Mô tả nghiệp vụ |
|---|---|---|
| `POST` | `/api/auth/forgot-password` | Yêu cầu gửi mã OTP qua email để khôi phục mật khẩu |
| `POST` | `/api/auth/verify-otp` | Kiểm tra tính hợp lệ của mã OTP |
| `POST` | `/api/auth/reset-password` | Đặt lại mật khẩu mới sau khi xác thực OTP thành công |

### 4.2. `UserProfileController` (`/api/profile`)
| Method | Endpoint | Mô tả nghiệp vụ |
|---|---|---|
| `GET` | `/api/profile` | Lấy thông tin cá nhân hiện tại (mặc định: `usr-pat-01`) |
| `GET` | `/api/profile/{userId}` | Xem thông tin cá nhân của người dùng theo ID |
| `PUT` | `/api/profile` | Cập nhật thông tin cá nhân (Họ tên, SĐT, CCCD, Địa chỉ) |
| `PUT` | `/api/profile/change-password` | Đổi mật khẩu (xác thực mật khẩu cũ, kiểm tra tối thiểu 6 ký tự) |
| `POST` | `/api/profile/avatar` | Cập nhật URL ảnh đại diện |

### 4.3. `PatientController` (`/api/patients`)
| Method | Endpoint | Mô tả nghiệp vụ |
|---|---|---|
| `GET` | `/api/patients` | Tra cứu danh bạ bệnh nhân (tìm kiếm theo tên, CCCD, SĐT, mã BN) |
| `GET` | `/api/patients/{id}` | Lấy chi tiết hồ sơ bệnh nhân theo ID |
| `GET` | `/api/patients/code/{code}` | Tra cứu hồ sơ bệnh nhân theo mã `patientCode` |
| `POST` | `/api/patients` | Tạo mới hồ sơ bệnh nhân (kiểm tra tính duy nhất của CCCD và SĐT) |
| `PUT` | `/api/patients/{id}` | Cập nhật thông tin hành chính & tiền sử dị ứng thuốc |
| `GET` | `/api/patients/{id}/history` | Lấy tóm tắt lịch sử khám bệnh và lịch hẹn cũ |

### 4.4. `AppointmentController` (`/api/appointments`)
| Method | Endpoint | Mô tả nghiệp vụ |
|---|---|---|
| `GET` | `/api/appointments` | Lấy danh sách lịch hẹn (lọc theo ngày, bác sĩ, trạng thái, bệnh nhân) |
| `GET` | `/api/appointments/{id}` | Xem chi tiết lịch hẹn theo ID |
| `GET` | `/api/appointments/code/{code}` | Tra cứu lịch hẹn theo mã hẹn |
| `GET` | `/api/appointments/patient/{patientId}` | Lấy danh sách lịch hẹn của bệnh nhân |
| `POST` | `/api/appointments` | Đặt lịch hẹn mới trực tuyến hoặc tại quầy tiếp đón |
| `PUT` | `/api/appointments/{id}/reschedule` | Dời lịch hẹn sang ngày hoặc khung giờ mới |
| `PUT` | `/api/appointments/{id}/cancel` | Hủy lịch hẹn và ghi nhận lý do hủy |

### 4.5. `ReceptionController` (`/api/reception`)
| Method | Endpoint | Mô tả nghiệp vụ |
|---|---|---|
| `POST` | `/api/reception/checkin` | Tiếp nhận bệnh nhân (có hẹn hoặc vãng lai) và cấp số STT tự động |
| `GET` | `/api/reception/tickets/{id}/print` | Lấy dữ liệu in phiếu khám K80 nhiệt (STT, mã vé, phòng khám, giờ) |

### 4.6. `QueueController` (`/api/queue`)
| Method | Endpoint | Mô tả nghiệp vụ |
|---|---|---|
| `GET` | `/api/queue` | Lấy danh sách hàng đợi theo buồng khám, trạng thái, mức ưu tiên |
| `GET` | `/api/queue/summary` | Thống kê số lượng hàng đợi tổng hợp (Chờ khám, Đang khám, Đã khám) |
| `POST` | `/api/queue/call-next` | Bác sĩ gọi bệnh nhân kế tiếp vào buồng khám |
| `POST` | `/api/queue/{id}/promote` | Điều phối đưa ca ưu tiên / cấp cứu lên vị trí đầu hàng đợi |
| `PATCH` | `/api/queue/{id}/status` | Cập nhật trạng thái vé (`WAITING` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED`) |
| `GET` | `/api/queue/patient/{patientId}/active` | Bệnh nhân theo dõi tiến trình số thứ tự khám thời gian thực |
| `GET` | `/api/queue/ticket/{ticketNumber}/track`| Tra cứu tiến trình lượt khám qua mã số vé trên phiếu |

### 4.7. `MedicalRecordController` (`/api/records`)
| Method | Endpoint | Mô tả nghiệp vụ |
|---|---|---|
| `GET` | `/api/records/patient/{patientId}` | Lấy lịch sử khám bệnh của bệnh nhân (lọc keyword, chuyên khoa, năm) |
| `GET` | `/api/records/{id}` | Xem chi tiết hồ sơ bệnh án theo ID |
| `GET` | `/api/records/code/{visitCode}` | Tra cứu hồ sơ bệnh án theo mã lượt khám |
| `GET` | `/api/records/visit/{visitId}` | Tra cứu hồ sơ bệnh án theo mã `visitId` |
| `POST` | `/api/records` | Lưu hồ sơ khám lâm sàng (5 sinh hiệu, ICD-10, cận lâm sàng, toa thuốc) |
| `PATCH` | `/api/records/{id}/lock` | Khóa bất biến hồ sơ bệnh án sau khi kết thúc ca khám (BR-23) |

### 4.8. `BillingController` (`/api/billing`)
| Method | Endpoint | Mô tả nghiệp vụ |
|---|---|---|
| `GET` | `/api/billing` | Lấy danh sách hóa đơn viện phí (tìm kiếm, lọc theo trạng thái thanh toán) |
| `GET` | `/api/billing/{id}` | Xem chi tiết hóa đơn viện phí theo ID |
| `GET` | `/api/billing/code/{billCode}` | Tra cứu hóa đơn viện phí theo mã hóa đơn |
| `POST` | `/api/billing` | Lập hóa đơn viện phí tổng hợp (Tiền khám + Dịch vụ kỹ thuật + Thuốc) |
| `POST` | `/api/billing/{id}/pay-cash` | Thu tiền mặt, tự động tính tiền thối, kích hoạt trừ tồn kho thuốc |
| `POST` | `/api/billing/{id}/vietqr` | Tạo mã QR động VietQR với đầy đủ số tiền và cú pháp chuyển khoản |
| `POST` | `/api/billing/{id}/confirm-vietqr` | Thu ngân đối soát & xác nhận đã nhận tiền VietQR, trừ kho thuốc |
| `GET` | `/api/billing/summary` | Báo cáo doanh thu và thống kê thu ngân trong ngày |
| `DELETE` | `/api/billing/{id}` | Hủy hóa đơn viện phí chưa thanh toán (kèm lý do) |
| `GET` | `/api/billing/patient/{patientId}` | Lấy danh sách hóa đơn viện phí của bệnh nhân |

### 4.9. `PharmacyController` (`/api/admin/pharmacy`)
| Method | Endpoint | Mô tả nghiệp vụ |
|---|---|---|
| `GET` | `/api/admin/pharmacy/drugs` | Lấy danh mục thuốc phòng khám (tìm kiếm tên, hoạt chất, trạng thái) |
| `GET` | `/api/admin/pharmacy/drugs/{id}` | Lấy chi tiết thông tin thuốc theo ID |
| `POST` | `/api/admin/pharmacy/drugs` | Thêm mới thuốc vào danh mục |
| `PUT` | `/api/admin/pharmacy/drugs/{id}` | Cập nhật thông tin chi tiết thuốc |
| `PATCH` | `/api/admin/pharmacy/drugs/{id}/price` | Điều chỉnh giá nhập và giá bán lẻ thuốc |
| `PATCH` | `/api/admin/pharmacy/drugs/{id}/toggle-status` | Kích hoạt hoặc chuyển cờ Ngừng kinh doanh (không xóa vật lý) |
| `POST` | `/api/admin/pharmacy/drugs/{id}/stock` | Nhập kho / Xuất kho / Điều chỉnh tồn kho thuốc |
| `POST` | `/api/admin/pharmacy/drugs/batch-deduct` | Tự động trừ kho thuốc sau khi thanh toán hóa đơn viện phí |
| `GET` | `/api/admin/pharmacy/drugs/low-stock` | Cảnh báo danh sách thuốc có lượng tồn kho thấp ($\le$ ngưỡng) |
| `GET` | `/api/admin/pharmacy/drugs/critical-stock` | Cảnh báo đỏ các loại thuốc cận kiệt tồn kho ($\le 10$ đơn vị) |
| `GET` | `/api/admin/pharmacy/drugs/{id}/transactions`| Xem lịch sử các giao dịch biến động kho của từng loại thuốc |

### 4.10. `MedicalServiceController` (`/api/admin/services`)
| Method | Endpoint | Mô tả nghiệp vụ |
|---|---|---|
| `GET` | `/api/admin/services` | Lấy danh mục dịch vụ kỹ thuật (siêu âm, xét nghiệm, thủ thuật) |
| `GET` | `/api/admin/services/{id}` | Lấy chi tiết thông tin dịch vụ theo ID |
| `POST` | `/api/admin/services` | Thêm mới dịch vụ kỹ thuật vào danh mục phòng khám |
| `PUT` | `/api/admin/services/{id}` | Cập nhật thông tin và mô tả dịch vụ |
| `PATCH` | `/api/admin/services/{id}/price` | Cập nhật đơn giá dịch vụ kỹ thuật |
| `PATCH` | `/api/admin/services/{id}/toggle-status` | Kích hoạt / Ngừng cung cấp dịch vụ (Soft-delete) |

### 4.11. `DoctorScheduleController` (`/api/admin/schedules`)
| Method | Endpoint | Mô tả nghiệp vụ |
|---|---|---|
| `GET` | `/api/admin/schedules` | Lấy danh sách lịch trực bác sĩ (lọc theo ngày, bác sĩ, ca làm việc) |
| `GET` | `/api/admin/schedules/{id}` | Xem chi tiết ca làm việc của bác sĩ |
| `POST` | `/api/admin/schedules` | Phân ca làm việc mới (kiểm tra xung đột trùng lặp ca) |
| `PUT` | `/api/admin/schedules/{id}` | Cập nhật thông tin ca trực |
| `PATCH` | `/api/admin/schedules/{id}/toggle-status` | Xác nhận ca trực (`CONFIRMED`) hoặc đăng ký nghỉ phép (`LEAVE`) |
| `DELETE` | `/api/admin/schedules/{id}` | Xóa ca làm việc khỏi lịch trực |

### 4.12. `StaffAccountController` (`/api/admin/users`)
| Method | Endpoint | Mô tả nghiệp vụ |
|---|---|---|
| `GET` | `/api/admin/users` | Lấy danh sách tài khoản nhân viên (lọc theo vai trò, từ khóa) |
| `GET` | `/api/admin/users/{id}` | Lấy thông tin chi tiết tài khoản nhân viên |
| `POST` | `/api/admin/users` | Tạo mới tài khoản nhân viên kèm vai trò & quyền hạn mặc định |
| `PUT` | `/api/admin/users/{id}` | Cập nhật thông tin cá nhân và liên hệ của nhân viên |
| `PATCH` | `/api/admin/users/{id}/toggle-status` | Khóa hoặc Mở khóa tài khoản nhân viên |
| `PUT` | `/api/admin/users/{id}/permissions` | Gán vai trò (RBAC) và phân quyền chi tiết cho nhân viên |
| `POST` | `/api/admin/users/{id}/reset-password` | Quản trị viên đặt lại mật khẩu cho tài khoản |
| `GET` | `/api/admin/users/roles-permissions` | Lấy danh mục các vai trò và quyền hạn có sẵn trong hệ thống |

### 4.13. `NotificationController` (`/api/notifications`)
| Method | Endpoint | Mô tả nghiệp vụ |
|---|---|---|
| `GET` | `/api/notifications` | Lấy danh sách thông báo của người dùng (lọc đã đọc, phân loại) |
| `GET` | `/api/notifications/summary` | Tóm tắt thông báo và số lượng chưa đọc (phục vụ chuông thông báo) |
| `GET` | `/api/notifications/unread-count` | Lấy số lượng thông báo chưa đọc |
| `PATCH` | `/api/notifications/{id}/read` | Đánh dấu 1 thông báo là đã đọc |
| `PATCH` | `/api/notifications/mark-all-read` | Đánh dấu tất cả thông báo của người dùng là đã đọc |
| `POST` | `/api/notifications` | Phát sinh và gửi thông báo mới vào hộp thư |
| `DELETE` | `/api/notifications/{id}` | Xóa thông báo khỏi danh sách |

### 4.14. `ReportController` (`/api/reports`)
| Method | Endpoint | Mô tả nghiệp vụ |
|---|---|---|
| `GET` | `/api/reports/dashboard` | Lấy số liệu thống kê điều hành phòng khám tổng thể |
| `GET` | `/api/reports/departments` | Lấy báo cáo hiệu suất tiếp nhận & doanh thu theo chuyên khoa |
| `GET` | `/api/reports/export` | Xuất dữ liệu báo cáo viện phí & vận hành tổng hợp |

---

## 5. QUY TẮC NGHIỆP VỤ SRS (BUSINESS RULES BR-01 -> BR-28)

Toàn bộ dịch vụ backend được xây dựng nhằm bảo đảm tính toàn vẹn y khoa theo 28 quy tắc nghiệp vụ:
- **BR-01, BR-02**: Kiểm soát bảo mật RBAC, người dùng chỉ thao tác đúng phạm vi dữ liệu của mình.
- **BR-03**: Tính duy nhất của hồ sơ bệnh nhân qua mã định danh, CCCD và số điện thoại.
- **BR-05**: Chống xung đột trùng lịch khám của bác sĩ.
- **BR-07**: Tiến trình hàng đợi đúng 3 trạng thái: `WAITING` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED`.
- **BR-10**: Bắt buộc mã hóa chẩn đoán theo chuẩn **ICD-10**.
- **BR-12, BR-13**: Cảnh báo tương tác thuốc đối kháng (DDI) và cảnh báo dị ứng trước khi kê đơn.
- **BR-16**: Công thức tổng hợp hóa đơn minh bạch: `Tổng tiền = Tiền khám + Dịch vụ + Tiền thuốc`.
- **BR-17, BR-18**: Hỗ trợ Tiền mặt và mã động VietQR; thu ngân đối soát xác nhận nhận tiền.
- **BR-19**: Tự động trừ tồn kho thuốc chỉ khi hóa đơn chuyển sang trạng thái đã thanh toán.
- **BR-21**: Cảnh báo đỏ khi số lượng tồn kho dược phẩm $\le 10$ đơn vị.
- **BR-23**: Khóa bất biến hồ sơ bệnh án EMR sau khi hoàn thành phiên khám.
- **BR-24**: Bảo toàn lịch sử y tế, danh mục thuốc/dịch vụ chỉ được chuyển cờ ngừng hoạt động, không xóa vật lý.

---

## 6. CẤU TRÚC GÓI MÃ NGUỒN (PACKAGE ARCHITECTURE)

```
vn.clinic
├── config/             # Cấu hình Spring Security, CORS filter
├── controller/         # 14 REST Controllers
├── dto/                # Data Transfer Objects & Jakarta Validation
├── exception/          # GlobalExceptionHandler & Custom Business Exceptions
├── model/              # Entities, Enums, DTO Domain Models
├── repository/         # Data Access Interfaces & InMemory Repositories
└── service/            # 14 Service Interfaces & Implementations
```
