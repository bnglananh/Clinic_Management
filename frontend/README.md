# SMART CLINIC EMR – FRONTEND APPLICATION

> **Phân hệ Giao diện Người dùng Y tế Cao cấp (Luxury Healthcare Frontend)**  
> Ứng dụng phát triển trên nền tảng **Angular 22+**, thư viện **NG-ZORRO (Ant Design)**, thiết kế sang trọng chuẩn y khoa, quản lý trạng thái phản ứng với **Signals**.

---

## 1. YÊU CẦU MÔI TRƯỜNG

- **Node.js**: v18.x, v20.x hoặc v22.x+ (Khuyến nghị bản LTS)
- **npm**: v9.x, v10.x hoặc v11.x (Tự động đi kèm theo Node.js)

---

## 2. HƯỚNG DẪN KHỞI CHẠY FRONTEND

### Bước 1: Mở Terminal tại thư mục `frontend`
```bash
cd frontend
```

### Bước 2: Cài đặt các gói thư viện phụ thuộc
```bash
npm install
```

### Bước 3: Khởi chạy máy chủ phát triển (Dev Server)
```bash
npm start
```
*(hoặc chạy lệnh: `npx ng serve`)*

- Ứng dụng sẽ hoạt động tại: **`http://localhost:4200`**
- Hỗ trợ Hot-Reload: Mọi thay đổi trong mã nguồn sẽ tự động cập nhật ngay trên trình duyệt.

---

## 3. CÁC LỆNH ĐÓNG GÓI & KIỂM THỬ

- **Đóng gói dự án (Production Build)**:
  ```bash
  npm run build
  ```
  *(Sản phẩm đầu ra được biên dịch trong thư mục `dist/clinic-frontend`, hỗ trợ hơn 25 Lazy Chunks tối ưu hóa bộ nhớ và tốc độ tải trang).*

- **Chạy kiểm thử tự động (Unit Test)**:
  ```bash
  npm test
  ```

---

## 4. TÀI KHOẢN VÀ CÁC PHÂN HỆ SỬ DỤNG

Truy cập trang đăng nhập tại: `http://localhost:4200/auth/login` (hỗ trợ chuyển nhanh vai trò 1-chạm hoặc nhập tài khoản thủ công):

| Phân hệ | Tài khoản | Mật khẩu | Vai trò (Role) | Chức năng chính |
|---|---|---|---|---|
| **Lễ tân & Thu ngân** | `letan` | `123456` | `RECEPTIONIST` | Tiếp đón khám (Check-in), cấp số thứ tự tự động, in phiếu K80 nhiệt, quản lý hàng đợi, quản lý hồ sơ bệnh nhân, thanh toán viện phí VietQR & Tiền mặt |
| **Bác sĩ Lâm sàng** | `bacsi` | `123456` | `DOCTOR` | Không gian khám bệnh lâm sàng, nhập 5 chỉ số sinh hiệu & BMI, chẩn đoán ICD-10, chỉ định cận lâm sàng, kê toa & cảnh báo tương tác thuốc DDI, khóa bệnh án EMR |
| **Quản trị hệ thống** | `admin` | `123456` | `ADMIN` | Quản lý nhân sự & phân quyền RBAC, quản lý tồn kho thuốc & cảnh báo cận kiệt ($\le 10$), cấu hình dịch vụ y tế & bảng giá, phân ca lịch trực bác sĩ, dashboard thống kê |
| **Cổng Bệnh nhân** | `benhnhan` | `123456` | `PATIENT` | Đặt lịch khám 4 bước, theo dõi số thứ tự hàng đợi thời gian thực, xem lịch sử bệnh án & đơn thuốc, theo dõi viện phí, nhận thông báo nhắc hẹn |

> 🔑 **Ghi chú**: Mật khẩu mặc định cho toàn bộ 4 tài khoản thử nghiệm là **`123456`**. Bạn có thể nhấn icon con mắt tại ô mật khẩu để kiểm tra hoặc bấm trực tiếp vào thẻ vai trò để hệ thống tự động điền sẵn.

---

## 5. BẢN ĐỒ ĐƯỜNG DẪN ĐẦY ĐỦ (APPLICATION ROUTES)

### 5.1. Trang công khai (Public Routes)
- **Trang chủ giới thiệu phòng khám**: `http://localhost:4200/`
- **Màn hình sảnh chờ TV (Lobby Queue Display)**: `http://localhost:4200/lobby-display`
- **Chi tiết dịch vụ kỹ thuật y tế**: `http://localhost:4200/services/:code` (vd: `http://localhost:4200/services/DV-SA-01`)
- **Đăng nhập**: `http://localhost:4200/auth/login`
- **Đăng ký tài khoản bệnh nhân**: `http://localhost:4200/auth/register`
- **Quên mật khẩu & xác minh OTP**: `http://localhost:4200/auth/forgot-password`

### 5.2. Phân hệ Lễ tân & Thu ngân (`/reception`)
- **Tiếp đón bệnh nhân & cấp số STT**: `http://localhost:4200/reception/checkin`
- **Hàng đợi khám phòng khám**: `http://localhost:4200/reception/queue`
- **Quản lý danh sách hồ sơ bệnh nhân**: `http://localhost:4200/reception/patients`
- **Thu ngân & Quyết toán viện phí**: `http://localhost:4200/reception/billing`

### 5.3. Phân hệ Bác sĩ Lâm sàng (`/doctor`)
- **Tổng quan bàn làm việc Bác sĩ**: `http://localhost:4200/doctor`
- **Hàng đợi bệnh nhân chờ khám**: `http://localhost:4200/doctor/queue`
- **Không gian khám bệnh & Kê toa (Workspace)**: `http://localhost:4200/doctor/workspace`
- **Lịch sử các ca khám đã hoàn thành**: `http://localhost:4200/doctor/history`

### 5.4. Phân hệ Quản trị viên (`/admin`)
- **Báo cáo điều hành Dashboard**: `http://localhost:4200/admin/dashboard`
- **Quản lý tài khoản nhân viên & RBAC**: `http://localhost:4200/admin/users`
- **Quản lý danh bạ bệnh nhân**: `http://localhost:4200/admin/patients`
- **Quản lý kho dược & tồn kho thuốc**: `http://localhost:4200/admin/pharmacy`
- **Quản lý danh mục dịch vụ kỹ thuật**: `http://localhost:4200/admin/services`
- **Quản lý phân ca lịch làm việc bác sĩ**: `http://localhost:4200/admin/schedules`

### 5.5. Phân hệ Cổng Bệnh nhân (`/patient`)
- **Bảng điều khiển cá nhân (Dashboard)**: `http://localhost:4200/patient/dashboard`
- **Đặt lịch khám trực tuyến (4 bước)**: `http://localhost:4200/patient/booking`
- **Theo dõi lượt khám thời gian thực**: `http://localhost:4200/patient/queue`
- **Hồ sơ bệnh án điện tử cá nhân**: `http://localhost:4200/patient/records`
- **Hóa đơn viện phí & thanh toán**: `http://localhost:4200/patient/billing`
- **Hồ sơ cá nhân & đổi mật khẩu**: `http://localhost:4200/patient/profile`

---

## 6. KIẾN TRÚC FRONTEND & THÀNH PHẦN DÙNG CHUNG (SHARED)

- **Layouts độc lập**:
  - `AuthLayoutComponent`: Giao diện đăng nhập / đăng ký / quên mật khẩu với background hình ảnh phòng khám sang trọng.
  - `InternalLayoutComponent`: Sidebar tối (Ink Slate), header điều khiển, hỗ trợ menu theo vai trò nhân viên.
  - `PatientLayoutComponent`: Thanh điều hướng tinh tế dành riêng cho cổng bệnh nhân.
- **Shared Components & Pipes**:
  - `VitalTrendChartComponent`: Trực quan hóa diễn tiến 5 chỉ số sinh tồn (Huyết áp, Mạch, Nhiệt độ, BMI).
  - `PaymentPanelComponent`: Module thanh toán tiền mặt (tính tiền thối tự động) và hiển thị VietQR động.
  - `ViDatePipe`: Format thời gian và ngày khám theo chuẩn tiếng Việt.
  - `EmrLockBadgeComponent`: Hiển thị nhãn khóa bất biến bệnh án điện tử theo quy tắc BR-23.
- **Bảng màu nhận diện Luxury Healthcare**:
  - Deep Teal (`#0E4A55`), Ink Slate (`#1C2733`), Champagne Gold (`#B8955A`), Ivory (`#F6F3EC`), Sage (`#5E8B7E`), Burgundy (`#9B3D45`).
