# SMART CLINIC EMR – TỔNG QUAN HỆ THỐNG QUẢN LÝ PHÒNG KHÁM
> **Tài liệu kim chỉ nam: Bối cảnh, Phạm vi, Kiến trúc tổng thể & Công nghệ**  
> **Nguồn trích xuất**: `SRS_WEB_QUAN_LY_PHONG_KHAM_FINAL.docx`  
> **Dự án**: Đồ án Quản lý Phòng khám Thông minh (Smart Clinic EMR) – Phân hệ Đa cơ sở dữ liệu NoSQL  
> **Phiên bản**: 1.0.0 (Tháng 10/2026)  

---

## 1. MỤC TIÊU VÀ BỐI CẢNH DỰ ÁN

Tại các phòng khám đa khoa hiện nay, quy trình vận hành truyền thống bộc lộ 4 điểm nghẽn nghiêm trọng:
1. **Tắc nghẽn khâu tiếp đón**: Xếp hàng lấy số thủ công gây ùn ứ giờ cao điểm, thiếu cơ chế giữ chỗ trước theo thời gian thực.
2. **Rủi ro tương tác thuốc**: Kiểm tra thủ công tương tác thuốc đối kháng (Drug-Drug Interaction - DDI) dễ bỏ sót phản ứng nguy hại.
3. **Phân mảnh dữ liệu sinh tồn**: Chỉ số huyết áp, nhịp tim, đường huyết ghi nhận rời rạc trên giấy, không trực quan hóa được biểu đồ diễn tiến.
4. **Hồ sơ bệnh án thiếu linh hoạt**: CSDL quan hệ (RDBMS) cứng nhắc, khó mở rộng trường dữ liệu khi cấu trúc bệnh án thay đổi theo chuyên khoa.

**Hệ thống Smart Clinic EMR** được xây dựng như một giải pháp số hóa toàn diện, giải quyết triệt để 4 vấn đề trên thông qua sự kết hợp giữa **Kiến trúc dữ liệu đa mô hình (Polyglot Persistence)** và **Giao diện người dùng y tế cao cấp (Luxury Healthcare Frontend)**.

---

## 2. PHẠM VI HỆ THỐNG (SYSTEM SCOPE)

### 2.1. Phạm vi bao gồm (In-Scope)
- **Quản lý người dùng & RBAC**: 4 vai trò độc lập gồm Bệnh nhân, Lễ tân/Thu ngân, Bác sĩ, Quản trị viên (Admin).
- **Hồ sơ bệnh nhân**: Quản lý thông tin hành chính, CCCD, số điện thoại, tiền sử dị ứng thuốc và lịch sử các lần khám cũ.
- **Đặt lịch & Tiếp đón**: Đặt hẹn trực tuyến 4 bước hoặc tiếp nhận khách vãng lai (Walk-in), cấp số thứ tự tự động.
- **Hàng đợi khám thời gian thực (Realtime Queue)**: Chuẩn hóa đúng **3 trạng thái**:
  $$\text{WAITING (Chờ khám)} \longrightarrow \text{IN\_PROGRESS (Đang khám)} \longrightarrow \text{COMPLETED (Đã khám)}$$
- **Khám bệnh lâm sàng**: Ghi nhận đủ **5 chỉ số sinh hiệu** (Huyết áp, Mạch, Nhiệt độ, Chiều cao, Cân nặng $\rightarrow$ tự động tính BMI), triệu chứng và chẩn đoán theo mã chuẩn **ICD-10**.
- **Chỉ định dịch vụ kỹ thuật đơn giản**: Siêu âm, xét nghiệm nhanh, thủ thuật (bác sĩ chỉ định, thực hiện và nhập kết quả trực tiếp).
- **Kê đơn thuốc & Cảnh báo DDI**: Kiểm tra tương tác thuốc qua mạng lưới tri thức đồ thị; kiểm tra tồn kho thuốc; tự động trừ kho ngay khi hóa đơn thanh toán thành công; cảnh báo thuốc sắp hết khi tồn $\le 10$.
- **Thanh toán viện phí tổng hợp**: Tiền khám + dịch vụ kỹ thuật + thuốc; hỗ trợ Tiền mặt và mã **VietQR** động (thu ngân đối soát xác nhận nhận tiền thủ công).
- **Báo cáo thống kê**: Doanh thu theo chu kỳ, số lượt khám theo chuyên khoa, thống kê xuất nhập tồn thuốc.

### 2.2. Giới hạn ngoài phạm vi (Out-of-Scope)
- Không quản lý điều trị nội trú, không quản lý giường bệnh lưu viện.
- Không xây dựng kho dược đa lô (Batches), không dùng FEFO hay cơ chế khóa tạm tồn kho (Stock Reservation).
- Không có hệ thống Cận lâm sàng riêng biệt (không có KTV riêng, không upload file ảnh DICOM dung lượng lớn).
- Không có hệ thống loa phát thanh TTS hay thuật toán cân bằng tải đa phòng khám.
- Không tích hợp webhook ngân hàng tự động; thanh toán VietQR được xác nhận thủ công bởi thu ngân.
- Chưa hỗ trợ nghiệp vụ giám định/thanh toán Bảo hiểm Y tế (BHYT).

---

## 3. KIẾN TRÚC ĐA CƠ SỞ DỮ LIỆU NOSQL (POLYGLOT PERSISTENCE)

Hệ thống không sử dụng CSDL quan hệ truyền thống làm kho chính mà phân bổ dữ liệu theo đúng thế mạnh của **4 hệ quản trị NoSQL**:

| Hệ CSDL NoSQL | Mô hình dữ liệu | Vai trò kỹ thuật & Dữ liệu đảm nhiệm | Tiêu chí hiệu năng cam kết |
|---|---|---|---|
| **MongoDB v6.0+** | Document Store | Bệnh án điện tử EMR bán cấu trúc, Hồ sơ bệnh nhân, Tài khoản, Danh mục dịch vụ & thuốc, Hóa đơn viện phí | Truy vấn hồ sơ EMR < 300 ms (tài liệu < 2MB) |
| **Redis v7.0+** | Key-Value In-Memory | Khóa giữ chỗ slot lịch hẹn (TTL = 10 phút), Hàng đợi số thứ tự realtime, Blacklist thu hồi token JWT | Đọc/ghi khóa slot & hàng đợi < 15 ms |
| **Apache Cassandra v4.1+** | Column-Family | Chuỗi thời gian (Time-Series) 5 chỉ số sinh tồn (`patient_vital_signs`) và Nhật ký kiểm toán y tế bất biến (`medical_audit_logs`, Append-Only) | Tốc độ ghi nhận chuỗi thời gian < 10 ms; chịu tải ghi $\ge 1.000$ bản ghi/s |
| **Neo4j v5.0+** | Graph Database | Mạng lưới tri thức y khoa (Thuốc $\leftrightarrow$ Hoạt chất $\leftrightarrow$ Bệnh lý), truy vấn đường đi Cypher phát hiện cảnh báo tương tác thuốc đối kháng (DDI) | Truy vấn kiểm tra DDI < 200 ms |

---

## 4. NGĂN XẾP CÔNG NGHỆ (TECHNOLOGY STACK)

### 4.1. Tầng Giao diện (Frontend Tier)
- **Framework**: Angular 19+ / 22+ (Standalone Components, Signals, Control Flow `@if`, `@for`, strict TypeScript).
- **Thư viện UI**: NG-ZORRO (Ant Design Angular), tùy biến giao diện bằng CSS Variables và `theme.less` với 6 tông màu nhận diện:
  - *Deep Teal* (`#0E4A55`) – Màu chính, nút, link, `IN_PROGRESS`
  - *Ink Slate* (`#1C2733`) – Sidebar, header tối, typography tiêu đề
  - *Champagne Gold* (`#B8955A`) – Điểm nhấn trang trí, VIP, số thứ tự, `WAITING`
  - *Ivory* (`#F6F3EC`) – Canvas nền trang chủ
  - *Sage* (`#5E8B7E`) – Thành công, `COMPLETED`, sinh hiệu bình thường
  - *Burgundy* (`#9B3D45`) – Cảnh báo tương tác thuốc nguy hại, sinh hiệu vượt ngưỡng
- **Biểu đồ**: `ngx-echarts` thể hiện biểu đồ diễn tiến sinh hiệu và doanh thu.
- **Thời gian thực**: Kết nối WebSocket qua STOMP (`RxStomp` / SockJS).

### 4.2. Tầng Nghiệp vụ (Backend Tier)
- **Nền tảng**: Java Spring Boot 3.x (Java 17 LTS / 21 LTS).
- **Bảo mật**: Spring Security + JWT (HMAC-SHA256 hoặc RSA-256), phân quyền chặt chẽ RBAC Filter. Access Token (60 phút), Refresh Token (Redis TTL 7 ngày).
- **Giao tiếp dữ liệu**: Spring Data MongoDB, Spring Data Redis, Spring Data Cassandra, Spring Data Neo4j (SDN với Cypher DSL).
- **Tài liệu API**: SpringDoc OpenAPI 3.0 (Swagger UI).

### 4.3. Hạ tầng & Triển khai (DevOps & Hosting)
- **Hệ điều hành máy chủ**: Ubuntu Server 22.04 LTS (64-bit).
- **Đóng gói container**: Docker Engine v24.0+ và Docker Compose v2.20+ cô lập từng dịch vụ và 4 node CSDL NoSQL.
- **Chuẩn bảo mật mạng**: HTTPS / WSS qua TLS v1.3. Dữ liệu nhạy cảm (CCCD, SĐT) mã hóa ứng dụng bằng AES-256; mật khẩu băm BCrypt (salt round $\ge 10$).

---

## 5. RÀNG BUỘC PHÁP LÝ & BẢO TOÀN DỮ LIỆU Y KHOA

1. **Quy tắc bất biến hồ sơ bệnh án (Audit & Medical Immutability)**:
   - Hồ sơ bệnh án EMR sau khi bác sĩ nhấn hoàn tất (`COMPLETED`) sẽ bị **khóa trực tiếp**.
   - **Tuyệt đối không có nút Xóa vật lý (No Hard Delete)** trên giao diện lẫn API.
   - Mọi bổ sung sau phiên khám chỉ được ghi nhận dưới dạng **phiên bản bổ sung (Versioning)** hoặc **phụ lục đính kèm**.
2. **Quy tắc bảng kiểm toán bất biến (Cassandra Append-Only)**:
   - Mọi thao tác truy cập, thay đổi trạng thái, kê đơn, thanh toán đều được tự động đẩy vào bảng `medical_audit_logs` trên Cassandra và chỉ được phép ghi thêm, không hỗ trợ API sửa/xóa.
3. **Quy tắc danh mục y tế**:
   - Thuốc hoặc dịch vụ kỹ thuật đã phát sinh trong đơn thuốc/hóa đơn cũ sẽ **không được xóa vật lý** khỏi hệ thống, mà chỉ chuyển cờ sang trạng thái `Ngừng kinh doanh / Ngừng cung cấp` nhằm bảo toàn lịch sử truy vết viện phí.
