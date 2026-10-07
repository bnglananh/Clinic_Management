# SMART CLINIC EMR – HƯỚNG DẪN THIẾT KẾ VÀ KIẾN TRÚC FRONTEND
> **Tài liệu kim chỉ nam (Design System & Frontend Architecture Guide)**  
> **Dự án**: Smart Clinic EMR – Hệ thống Quản lý Phòng khám Thông minh  
> **Phiên bản**: 1.0.0  
> **Thời gian**: Tháng 10/2026  

---

## 1. TỔNG QUAN VÀ BỐI CẢNH DỰ ÁN

Smart Clinic EMR là hệ thống quản lý phòng khám và hồ sơ bệnh án điện tử cao cấp, hướng tới trải nghiệm liền mạch, sang trọng, tinh tế và đáng tin cậy.

Hệ thống được xây dựng theo tiêu chuẩn **Frontend-First** với Mock Service Observable/Signals để kiểm thử toàn diện UX/UI trước khi tích hợp vào Backend Spring Boot và CSDL NoSQL (MongoDB / Redis).

---

## 2. NỀN TẢNG CÔNG NGHỆ BẮT BUỘC

- **Framework**: Angular 19+ / 22+ (Standalone Components, Signals, new Control Flow `@if`, `@for`, `@switch`, Lazy-loaded routes).
- **TypeScript**: Strict mode 100%, tuyệt đối **không sử dụng `any`**. Định nghĩa interface/type chi tiết cho mọi model dữ liệu.
- **UI Component Library**: **NG-ZORRO (ng-zorro-antd)** bản mới nhất, tương thích Angular.
  - Tùy biến thông qua CSS Variables / Design Tokens và file `theme.less`.
  - Hạn chế tối đa việc ghi đè bằng `!important`.
- **Hiệu ứng & Chuyển cảnh**: `@angular/animations` kết hợp CSS transitions nhẹ nhàng, mượt mà (150ms – 350ms). Tôn trọng thuộc tính `prefers-reduced-motion`.
- **Biểu đồ**: `ngx-echarts` (hoặc `@antv/g2`), được cấu hình bảng màu đồng bộ theo Design System của phòng khám.
- **Mock Service & Realtime Integration**:
  - Mỗi service gọi dữ liệu phải có interface chuẩn xác.
  - Hiện tại trả về `Observable` mock: `of(mockData).pipe(delay(300))` hoặc Angular Signals.
  - Dự phòng sẵn cấu trúc tích hợp WebSocket qua RxStomp (hiện tại mô phỏng sự kiện hàng đợi realtime bằng `interval` / `Subject`).

---

## 3. PHONG CÁCH THIẾT KẾ (DESIGN SYSTEM)

### 3.1. Triết lý thiết kế (Design Philosophy)
- **Từ khóa**: *Hiện đại, Sang trọng, Tinh tế, Yên tĩnh, Đáng tin cậy*.
- Tạo cảm giác thư thái, chuyên nghiệp như không gian của một phòng khám quốc tế cao cấp.
- Sử dụng nhiều khoảng trắng (whitespace), bo góc mềm, đổ bóng nhẹ đa tầng, viền mảnh sắc nét.
- **Tuyệt đối tránh**: Gradient sặc sỡ, màu neon, icon lòe loẹt, viền dày thô ráp.

### 3.2. Bảng màu chuẩn (6 Tông màu Thương hiệu)

| Vai trò / Tên màu | Mã HEX | Ánh xạ & Ứng dụng |
|---|---|---|
| **Deep Teal** (Primary) | `#0E4A55` | Nút chính, link tương tác, mục đang chọn, tiêu điểm nhận diện, trạng thái `IN_PROGRESS` |
| **Ink Slate** (Dark / Ink) | `#1C2733` | Sidebar, header tối, typography tiêu đề chính, khối nền nhấn mạnh |
| **Champagne Gold** (Accent) | `#B8955A` | Đường kẻ trang trí, badge VIP/ưu tiên, số thứ tự nổi bật, vòng pulse hàng đợi, trạng thái `WAITING` |
| **Ivory** (Background) | `#F6F3EC` | Nền canvas toàn bộ trang (tôn lớp card nền trắng `#FFFFFF` nổi nhẹ bên trên) |
| **Sage** (Success) | `#5E8B7E` | Trạng thái `COMPLETED`, thanh toán thành công, chỉ số sinh hiệu trong ngưỡng chuẩn |
| **Burgundy** (Danger) | `#9B3D45` | Cảnh báo tương tác thuốc, sinh hiệu vượt ngưỡng nguy cơ, thao tác hủy/xóa |

#### Quy ước mở rộng sắc độ (Tints & Tokens)
- Màu chữ phụ: `#5B6672`
- Màu viền chuẩn: `#E4DED2`
- Nền Tag/Alert: Sử dụng các sắc độ nhạt (tint 8% – 15%) pha từ 6 màu gốc, không tự ý đưa màu lạ vào.
- **Tỷ lệ thị giác**: 60% Ivory/White, 25% Ink Slate & Text, 10% Deep Teal, 5% Gold/Sage/Burgundy.
- **Tương phản**: Đạt chuẩn WCAG 2.1 AA cho tất cả cặp text/background.

### 3.3. Typography & Hình khối
- **Font tiêu đề lớn / Hero**: Cormorant Garamond hoặc Playfair Display (hỗ trợ đầy đủ tiếng Việt có dấu).
- **Font nội dung / UI / Data Grid**: Be Vietnam Pro hoặc Inter.
- **Số liệu / Tiền tệ**: Sử dụng `font-variant-numeric: tabular-nums` để hiển thị cột số thẳng hàng.
- **Bo góc (Border Radius)**:
  - Card & Container: `16px`
  - Input, Button, Dropdown: `10px`
  - Tag, Chip, Pill: `999px`
- **Đổ bóng (Layered Shadows)**:
  - Card Shadow: `0 4px 20px -2px rgba(28, 39, 51, 0.05), 0 2px 6px -1px rgba(28, 39, 51, 0.03)`
  - Hover Shadow: `0 12px 28px -4px rgba(28, 39, 51, 0.08), 0 4px 10px -2px rgba(28, 39, 51, 0.04)`
- **Lưới khoảng cách**: Hệ số 8px (8px, 16px, 24px, 32px, 48px).

---

## 4. QUY TẮC NGHIỆP VỤ & 4 VAI TRÒ (RBAC)

Hệ thống có 4 vai trò độc lập, mỗi vai trò có giao diện và quyền truy cập riêng:

### 4.1. Bệnh nhân (Patient Portal)
- Đặt lịch khám trực tuyến qua quy trình Stepper 4 bước (Chuyên khoa → Bác sĩ → Ngày/Giờ → Xác nhận) hoàn thành trong < 3 phút.
- Quản lý lịch hẹn (xem chi tiết, dời lịch, hủy hẹn theo quy định).
- Theo dõi lượt khám & số thứ tự realtime trong ngày.
- Tra cứu hồ sơ sức khỏe & lịch sử khám (lọc theo thời gian, chuyên khoa, bác sĩ).
- Xem đơn thuốc, hóa đơn, nhận thông báo nhắc khám, quản lý hồ sơ cá nhân.

### 4.2. Lễ tân / Thu ngân (Reception & Cashier)
- Tiếp nhận & check-in bệnh nhân (theo lịch hẹn hoặc khách Walk-in).
- Cấp số thứ tự khám tự động và in phiếu K80.
- Điều phối hàng đợi phòng khám (ưu tiên ca cấp cứu, người cao tuổi, trẻ nhỏ).
- Quản lý hồ sơ hành chính, kiểm tra trùng CCCD/SĐT, cảnh báo tiền sử dị ứng.
- Lập hóa đơn tổng hợp (tiền khám + dịch vụ cận lâm sàng + thuốc).
- Thanh toán đa kênh: Tiền mặt (tự động tính tiền thừa/thiếu) hoặc VietQR (hiển thị mã QR động, thu ngân xác nhận tiền về).

### 4.3. Bác sĩ (Doctor Clinical Workspace)
- Màn hình làm việc tập trung dạng 3 cột:
  - **Cột trái**: Hàng đợi bệnh nhân của phòng khám, nút gọi số tiếp theo.
  - **Cột giữa**: Form khám bệnh phân tab (Sinh hiệu & Triệu chứng, Chẩn đoán ICD-10, Chỉ định cận lâm sàng, Kê đơn thuốc).
  - **Cột phải**: Tóm tắt bệnh nhân, Banner cảnh báo dị ứng màu Burgundy, timeline lịch sử khám cũ.
- Theo dõi 5 chỉ số sinh hiệu (Huyết áp, Mạch, Nhiệt độ, Chiều cao, Cân nặng) kèm cảnh báo ngưỡng bất thường và biểu đồ diễn tiến.
- Cảnh báo tương tác thuốc tự động khi kê đơn.
- Hoàn tất lượt khám và **Khóa hồ sơ bệnh án**.

### 4.4. Quản trị viên (Admin Portal)
- Quản lý người dùng, tài khoản nhân viên & phân quyền theo vai trò.
- Danh mục thuốc & quản lý tồn kho (cảnh báo tồn kho $\le$ 10 đơn vị).
- Danh mục dịch vụ kỹ thuật, cận lâm sàng, bảng giá.
- Phân ca & quản lý lịch làm việc của đội ngũ bác sĩ.
- Báo cáo thống kê: Doanh thu theo chu kỳ, số lượt khám theo chuyên khoa, thống kê xuất nhập tồn thuốc.

### 4.5. Hai quy tắc nghiệp vụ bất biến
1. **Trạng thái hàng đợi duy nhất (3 bước)**:
   $$\text{WAITING (Chờ khám)} \longrightarrow \text{IN\_PROGRESS (Đang khám)} \longrightarrow \text{COMPLETED (Đã khám)}$$
   - `WAITING`: Tone Champagne Gold.
   - `IN_PROGRESS`: Tone Deep Teal (hiệu ứng pulse).
   - `COMPLETED`: Tone Sage.
2. **Quy tắc hồ sơ bệnh án (EMR Lock Rule)**:
   - Hồ sơ đã ở trạng thái `COMPLETED` sẽ **bị khóa chỉnh sửa trực tiếp**.
   - UI hiển thị nhãn `Đã khóa` với biểu tượng ổ khóa bảo mật.
   - **Tuyệt đối không có nút Xóa**.
   - Bác sĩ chỉ được phép **"Thêm phụ lục / Phiên bản bổ sung"** để ghi nhận diễn tiến mới.

---

## 5. CẤU TRÚC LAYOUT HỆ THỐNG

### 5.1. Authentication (Đăng nhập / Đăng ký)
- Layout Split-Screen 50/50:
  - Nửa trái: Visual cao cấp phủ màu Ink Slate pha Teal, slogan serif sang trọng, biểu tượng y tế tối giản.
  - Nửa phải: Form đăng nhập, chuyển đổi vai trò nhanh (phục vụ demo/mock), đăng ký bệnh nhân, quên mật khẩu.

### 5.2. Internal Shell (Dành cho Lễ tân, Bác sĩ, Admin)
- **Sidebar**: Nền Ink Slate (`#1C2733`), hỗ trợ thu gọn (collapsed icon-only). Item đang chọn có thanh chỉ báo bên trái màu Champagne Gold (`#B8955A`) và nền Deep Teal trong suốt (`rgba(14, 74, 85, 0.18)`).
- **Header**: Thiết kế glassmorphism nhẹ (`backdrop-filter: blur(8px)`), breadcrumb điều hướng, thanh tìm kiếm bệnh nhân nhanh (phím tắt `Ctrl + K`), chuông thông báo, menu tài khoản.
- **Content Canvas**: Nền Ivory (`#F6F3EC`), các khối dữ liệu là card trắng bo góc `16px`.

### 5.3. Patient Portal Shell (Dành cho Bệnh nhân)
- Top Navigation sang trọng, không dùng sidebar chiếm diện tích.
- Hero chào đón cá nhân hóa theo tên bệnh nhân.
- Card "Lượt khám hôm nay" hiển thị số thứ tự và dự kiến thời gian nổi bật ở đầu trang.
- Tối ưu hóa mobile-first với kích thước vùng chạm $\ge 44\text{px}$.

---

## 6. THƯ VIỆN COMPONENT DÙNG CHUNG (STANDALONE)

Mọi component đều được thiết kế độc lập (Standalone Component) trong thư mục `src/app/shared/components/`:

1. `StatusTagComponent`: Hiển thị trạng thái chuẩn (WAITING, IN_PROGRESS, COMPLETED, PAID, UNPAID, CANCELLED) với phối màu tint chuẩn xác.
2. `QueueBoardComponent` & `QueueTicketComponent`: Hiển thị bảng số thứ tự lớn tại phòng khám; hỗ trợ in phiếu khám K80 qua CSS `@media print`.
3. `VitalSignCardComponent` & `VitalTrendChartComponent`: Hiển thị 5 chỉ số sinh hiệu (Huyết áp, Nhịp tim/Mạch, Nhiệt độ, Chiều cao, Cân nặng) kèm tự động tính BMI và cảnh báo đỏ Burgundy khi vượt ngưỡng; biểu đồ ECharts thể hiện xu hướng.
4. `Icd10SelectComponent`: Ô tìm kiếm chẩn đoán bệnh theo mã hoặc tên bệnh ICD-10 (hỗ trợ tiếng Việt không dấu).
5. `DrugInteractionModalComponent`: Hộp thoại cảnh báo xung đột thuốc tone Burgundy, hiển thị tương tác nguy hiểm và bắt buộc checkbox xác nhận *"Tôi đã xem xét cảnh báo"* mới cho phép kê đơn.
6. `AllergyBannerComponent`: Banner đỏ nổi bật đặt ở đầu hồ sơ bệnh án khi bệnh nhân có tiền sử dị ứng thuốc/thực phẩm.
7. `StockBadgeComponent`: Huy hiệu hiển thị lượng tồn kho; tự động đổi màu cảnh báo khi tồn $\le 10$ kèm thanh tiến độ trực quan.
8. `PaymentPanelComponent`: Bảng thanh toán hóa đơn viện phí, tính toán tự động tiền khám + xét nghiệm + thuốc, hỗ trợ tiền mặt và VietQR code động kèm xác nhận chuyển khoản.
9. `EmrLockBadgeComponent` & `VersionHistoryComponent`: Nhãn hồ sơ đã khóa và danh sách lịch sử các phiên bản bổ sung (không cho phép xóa dữ liệu y khoa).
10. `StatCardComponent`, `PageHeaderComponent`, `EmptyStateComponent`, `ConfirmDialogComponent`.

---

## 7. CẤU TRÚC THƯ MỤC DỰ ÁN FRONTEND

```text
frontend/src/
├── app/
│   ├── core/                          # Dịch vụ cốt lõi, Guards, Interceptors, Models chung
│   │   ├── guards/                    # AuthGuard, RoleGuard
│   │   ├── interceptors/              # TokenInterceptor, ErrorInterceptor
│   │   ├── models/                    # TypeScript interfaces (User, Patient, Queue, EMR, Billing, Medicine, ICD10)
│   │   ├── services/                  # AuthService, QueueService, PatientService, MedicalService, BillingService
│   │   └── mock-data/                 # Dữ liệu mẫu thực tế tiếng Việt, mã ICD-10, danh mục thuốc
│   ├── shared/                        # Reusable Standalone Components, Directives, Pipes
│   │   ├── components/                # StatusTag, VitalCard, PaymentPanel, AllergyBanner, etc.
│   │   ├── pipes/                     # VndCurrencyPipe, ViDatePipe, TabularNumPipe
│   │   └── directives/                # PrintDirective, HotkeyDirective
│   ├── layouts/                       # Layout shells cho từng đối tượng
│   │   ├── auth-layout/               # Layout đăng nhập/đăng ký split-screen
│   │   ├── internal-layout/           # Sidebar + Header (Reception, Doctor, Admin)
│   │   └── patient-layout/            # Top-nav cho cổng bệnh nhân
│   ├── features/                      # Các phân hệ nghiệp vụ (Lazy Loaded)
│   │   ├── auth/                      # Login, Quick role switch, Register, Forgot Password
│   │   ├── reception/                 # Tiếp nhận, Hàng đợi, Quản lý bệnh nhân, Hóa đơn & Thu ngân
│   │   ├── doctor/                    # Workspace khám bệnh, Kê đơn, Cận lâm sàng, Diễn tiến sinh hiệu
│   │   ├── patient/                   # Đặt lịch 4 bước, Theo dõi lượt khám, Lịch sử khám, Hóa đơn
│   │   └── admin/                     # Quản trị tài khoản, Dược & Tồn kho, Dịch vụ, Lịch trực, Báo cáo
│   ├── app.config.ts                  # Provider config (NgZorro, I18n vi_VN, Router, Animations)
│   ├── app.routes.ts                  # Cấu hình routes cha & phân quyền RBAC
│   └── app.ts                         # Root component
├── assets/                            # Ảnh minh họa, logo, icons
├── styles/                            # Design tokens & Global Styles
│   ├── _variables.scss                # Định nghĩa 6 màu chính, font, spacing, shadows
│   ├── _tokens.scss                   # CSS Custom Properties / Design Tokens
│   ├── _typography.scss               # Font faces & typography utility classes
│   └── _print.scss                    # Stylesheet cho in phiếu số thứ tự K80 & toa thuốc
├── theme.less                         # Override NG-ZORRO theme tokens
└── styles.scss                        # Root stylesheet
```

---

## 8. LỘ TRÌNH THỰC HIỆN 5 GIAI ĐOẠN

- **GIAI ĐOẠN 1 (ĐANG THỰC HIỆN)**:
  - Thiết lập Design tokens (SCSS variables, CSS variables, `theme.less` NG-ZORRO).
  - Tích hợp Typography (Google Fonts tiếng Việt) & Icons.
  - Xây dựng Layout Shells (Auth Layout, Internal Shell với Sidebar Ink Slate + Gold, Patient Shell với Top-nav).
  - Xây dựng trang Đăng nhập đa vai trò (có switch nhanh để kiểm thử Role-based Access Control).
  - Xây dựng bộ thư viện Shared Components cốt lõi.

- **GIAI ĐOẠN 2**:
  - Phân hệ Lễ tân / Thu ngân: Tiếp nhận Check-in, Cấp số thứ tự, Quản lý hàng đợi, Lập hóa đơn và thanh toán Tiền mặt / VietQR.

- **GIAI ĐOẠN 3**:
  - Phân hệ Bác sĩ: Workspace 3 cột, Gọi số khám, Khám bệnh phân tab, Sinh hiệu & ECharts, Cảnh báo tương tác thuốc, Khóa hồ sơ EMR.

- **GIAI ĐOẠN 4**:
  - Cổng Bệnh nhân: Stepper đặt lịch 4 bước, Bảng theo dõi số thứ tự realtime, Tra cứu hồ sơ & toa thuốc.

- **GIAI ĐOẠN 5**:
  - Phân hệ Quản trị (Admin): Quản lý thuốc & cảnh báo tồn kho, Dịch vụ kỹ thuật, Phân lịch bác sĩ, Dashboard báo cáo doanh thu & lượt khám.
