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

## 3. CÁC LỆNH KHÁC

- **Đóng gói dự án (Production Build)**:
  ```bash
  npm run build
  ```
  *(Sản phẩm đầu ra nằm trong thư mục `dist/clinic-frontend`)*

- **Chạy kiểm thử tự động (Unit Test)**:
  ```bash
  npm test
  ```

---

## 4. TÀI KHOẢN VÀ CÁC PHÂN HỆ SỬ DỤNG

Truy cập trang đăng nhập tại: `http://localhost:4200/auth/login` (có sẵn nút bấm chuyển nhanh vai trò 1-chạm):

| Phân hệ | Tài khoản | Vai trò | Chức năng chính |
|---|---|---|---|
| **Lễ tân & Thu ngân** | `letan` | `RECEPTIONIST` | Tiếp đón khám, cấp số thứ tự tự động, quản lý hàng đợi, thanh toán viện phí VietQR |
| **Bác sĩ Lâm sàng** | `bacsi` | `DOCTOR` | Không gian khám bệnh lâm sàng, nhập 5 chỉ số sinh hiệu & BMI, chẩn đoán ICD-10, kê toa & cảnh báo tương tác thuốc DDI, khóa bệnh án EMR |
| **Quản trị hệ thống** | `admin` | `ADMIN` | Quản lý nhân sự & phân quyền RBAC, quản lý tồn kho thuốc & cảnh báo cận kiệt, cấu hình dịch vụ y tế, lịch trực bác sĩ |
| **Cổng Bệnh nhân** | `benhnhan` | `PATIENT` | Đặt lịch khám 4 bước, theo dõi số thứ tự hàng đợi thời gian thực, xem lịch sử bệnh án & đơn thuốc, nhận thông báo nhắc hẹn |

---

## 5. BẢN ĐỒ ĐƯỜNG DẪN QUAN TRỌNG (ROUTES)

- **Trang chủ / Cổng chào**: `http://localhost:4200/`
- **Màn hình sảnh chờ TV (Lobby Queue Display)**: `http://localhost:4200/lobby`
- **Đăng nhập**: `http://localhost:4200/auth/login`
- **Đăng ký tài khoản bệnh nhân**: `http://localhost:4200/auth/register`
- **Bàn làm việc Bác sĩ**: `http://localhost:4200/doctor/workspace`
- **Tiếp đón & Cấp số**: `http://localhost:4200/reception/checkin`
- **Thu ngân & Viện phí**: `http://localhost:4200/reception/billing`
- **Quản trị người dùng & Phân quyền**: `http://localhost:4200/admin/users`
