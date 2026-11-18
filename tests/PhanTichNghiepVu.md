# TÀI LIỆU PHÂN TÍCH LUỒNG NGHIỆP VỤ HỆ THỐNG SMART CLINIC EMR
> **Mục đích tài liệu:** Hướng dẫn chi tiết luồng nghiệp vụ chức năng (workflow), tương tác giao diện (Frontend), điều hướng API (Backend) và các điểm biến động dữ liệu trên 4 hệ CSDL NoSQL (MongoDB, Redis, Cassandra, Neo4j). Phục vụ trực tiếp cho Tester/QA thiết kế kịch bản kiểm thử (Test Scenarios), viết Test Cases và kiểm định lỗi (Bug Hunting).

---

## MỤC LỤC TỔNG QUAN 24 USE CASE THEO 4 TÁC NHÂN

| Nhóm tác nhân | Mã UC | Tên Use Case | Phân hệ giao diện | CSDL đảm nhiệm |
|:---|:---:|:---|:---|:---|
| **BỆNH NHÂN** | **UC01** | Quản lý tài khoản cá nhân | `/auth`, `/patient/profile` | MongoDB, Redis |
| *(PATIENT)* | **UC02** | Đặt lịch hẹn | `/patient/booking` | Redis, MongoDB |
| | **UC03** | Quản lý lịch hẹn | `/patient/appointments` | MongoDB, Redis |
| | **UC04** | Theo dõi lượt khám | `/patient/queue-tracker` | Redis, MongoDB |
| | **UC05** | Tra cứu hồ sơ khám | `/patient/records` | MongoDB |
| | **UC06** | Tra cứu lịch sử khám | `/patient/history` | MongoDB, Cassandra |
| | **UC07** | Theo dõi hoá đơn | `/patient/billing` | MongoDB |
| | **UC08** | Nhận thông báo | `/patient/notifications` | MongoDB |
| **THU NGÂN / LỄ TÂN** | **UC09** | Tiếp nhận bệnh nhân | `/reception/check-in` | MongoDB, Redis |
| *(RECEPTIONIST)* | **UC10** | Quản lý lịch hẹn | `/reception/appointments` | MongoDB, Redis |
| | **UC11** | Quản lý hàng đợi | `/reception/queue`, `/reception/queue-board` | Redis, MongoDB |
| | **UC12** | Quản lý hồ sơ bệnh nhân | `/reception/patients` | MongoDB |
| | **UC13** | Quản lý hoá đơn | `/reception/billing` | MongoDB, Apache POI |
| **BÁC SĨ** | **UC14** | Quản lý khám bệnh | `/doctor/consultation` | Redis, MongoDB |
| *(DOCTOR)* | **UC15** | Quản lý hồ sơ bệnh án | `/doctor/emr` | MongoDB, Cassandra |
| | **UC16** | Chỉ định cận lâm sàng | `/doctor/services` | MongoDB |
| | **UC17** | Xem và đánh giá kết quả cận lâm sàng | `/doctor/service-results` | MongoDB |
| | **UC18** | Quản lý đơn thuốc | `/doctor/prescriptions` | Neo4j, MongoDB |
| **QUẢN TRỊ VIÊN** | **UC19** | Quản lý tài khoản và phân quyền | `/admin/users`, `/admin/audit-logs`| MongoDB, Cassandra |
| *(ADMIN)* | **UC20** | Quản lý danh mục thuốc | `/admin/pharmacy/drugs` | MongoDB, Neo4j |
| | **UC21** | Quản lý tồn kho thuốc | `/admin/pharmacy/inventory` | MongoDB |
| | **UC22** | Quản lý danh mục dịch vụ | `/admin/services` | MongoDB |
| | **UC23** | Quản lý lịch làm việc | `/admin/schedules` | MongoDB |
| | **UC24** | Báo cáo thống kê | `/admin/dashboard`, `/admin/reports` | MongoDB, Redis, Apache POI |

---

# PHẦN I: NHÓM CA SỬ DỤNG BỆNH NHÂN (PATIENT)

---

### UC01: QUẢN LÝ TÀI KHOẢN CÁ NHÂN
* **Tác nhân:** Bệnh nhân (`ROLE_PATIENT`).
* **Mục tiêu:** Đăng ký tài khoản, đăng nhập JWT, đăng xuất thu hồi token, phục hồi mật khẩu qua OTP email, đổi mật khẩu và cập nhật thông tin cá nhân/tiền sử dị ứng.
* **Tiền điều kiện:** Người dùng có trình duyệt truy cập ứng dụng web.

#### Luồng xử lý chi tiết (Flowwork):
1. **Đăng ký tài khoản:**
   * Bệnh nhân truy cập `/auth/register`, nhập: Số điện thoại, CCCD/CMND, họ tên, mật khẩu, email, ngày sinh, giới tính.
   * *Frontend:* Kiểm tra regex CCCD (12 số), SĐT (10 số), mật khẩu mạnh ($\ge 8$ ký tự, chữ hoa, chữ thường, số, ký tự đặc biệt).
   * *Backend:* Gửi `POST /api/auth/register`. Hệ thống kiểm tra trùng lặp qua MongoDB `patients` (duy nhất `identityCardNumber` và `phone`).
   * *Mã hóa:* Mật khẩu được băm một chiều qua `BCryptPasswordEncoder(cost=12)`.
   * *Tạo mã:* Sinh tự động mã bệnh nhân qua bộ đếm `counters` MongoDB (ví dụ: `BN-20261117-0001`).
2. **Đăng nhập & Cấp phát JWT:**
   * Nhập SĐT/CCCD và mật khẩu tại `/auth/login`.
   * *Backend:* Gửi `POST /api/auth/login`. Kiểm tra thông tin, nếu đúng trả về chuỗi JWT Token (thời hạn 8 giờ) chứa claims: `userId`, `patientCode`, `role = "ROLE_PATIENT"`.
   * *Frontend:* Lưu JWT vào `LocalStorage`, kích hoạt `AuthService` trạng thái đăng nhập.
3. **Quên mật khẩu & Xác thực OTP:**
   * Bệnh nhân bấm "Quên mật khẩu", nhập Email đăng ký.
   * *Backend:* Gửi `POST /api/auth/forgot-password`. Sinh mã OTP 6 số ngẫu nhiên, lưu vào **Redis Hash** `otp:reset:{email}` với trường `code` và `failedAttempts = 0`, thiết lập TTL 300 giây (5 phút). Kích hoạt `EmailService` gửi email cho bệnh nhân.
   * *Xác thực:* Bệnh nhân nhập mã OTP. Backend gửi `POST /api/auth/verify-otp`. Lệnh `HINCRBY` tăng số lần nhập sai nếu sai mã; nếu sai quá 3 lần tự động khóa phiên. Nhập đúng $\rightarrow$ cấp quyền đặt lại mật khẩu mới qua `POST /api/auth/reset-password`.
4. **Đăng xuất an toàn (JWT Blacklist):**
   * Bệnh nhân bấm "Đăng xuất" tại menu hồ sơ.
   * *Backend:* Gửi `POST /api/auth/logout`. Backend trích xuất mã định danh `jti` của Token và thời gian hết hạn còn lại, ghi vào **Redis String** `auth:blacklist:{jti}` với giá trị `"1"` và `TTL = expiration_time - now`.
   * *Bảo vệ:* Mọi request tiếp theo mang Token này sẽ bị `JwtAuthenticationFilter` chặn ngay từ tầng bộ lọc qua `redisTemplate.hasKey()` ($< 1\text{ ms}$) $\rightarrow$ Trả về `401 Unauthorized`.
5. **Cập nhật hồ sơ cá nhân:**
   * Bệnh nhân vào `/patient/profile`, cập nhật địa chỉ, nghề nghiệp, người liên hệ khẩn cấp và đặc biệt là **Tiền sử dị ứng thuốc** (Ví dụ: Dị ứng Penicillin, Aspirin).
   * *Backend:* Gửi `PUT /api/profile/{userId}` $\rightarrow$ Cập nhật document trong collection `patients` MongoDB.

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* **Validate:** Bỏ trống các trường bắt buộc; nhập sai định dạng CCCD/SĐT; mật khẩu không đủ độ phức tạp.
* **Bảo mật:** Dùng lại Token sau khi đã bấm Đăng xuất; thử bypass bằng cách sửa claims trong JWT.
* **OTP:** Nhập OTP sai 3 lần liên tiếp; nhập OTP đúng nhưng đã quá thời hạn 5 phút (TTL hết hạn).
* **Trùng lặp:** Đăng ký 2 tài khoản có cùng 1 số CCCD hoặc cùng 1 SĐT.

---

### UC02: ĐẶT LỊCH HẸN
* **Tác nhân:** Bệnh nhân (`ROLE_PATIENT`).
* **Mục tiêu:** Chọn chuyên khoa, chọn bác sĩ, chọn ngày/khung giờ khám và kích hoạt khóa phân tán Redis giữ chỗ 10 phút trước khi xác nhận.
* **Tiền điều kiện:** Bệnh nhân đã đăng nhập vào hệ thống.

#### Luồng xử lý chi tiết (Flowwork):
```text
[Bệnh nhân]                 [Frontend]                     [Backend]                     [Redis]          [MongoDB]
     |                          |                              |                            |                 |
     |-- 1. Chọn ngày, Bác sĩ ->|                              |                            |                 |
     |                          |-- 2. GET /slots ------------>|                            |                 |
     |                          |                              |-- Kiểm tra slot đã khóa -->|                 |
     |                          |<-- 3. Trả về sơ đồ slot -----|                            |                 |
     |-- 4. Bấm chọn slot 08:30>|                              |                            |                 |
     |                          |-- 5. POST /slot-locks ------>|                            |                 |
     |                          |                              |-- SET NX EX 600 ---------->|                 |
     |                          |<-- 6. Khóa thành công (200)--|                            |                 |
     |                          |    (Bật đếm ngược 10p)       |                            |                 |
     |-- 7. Nhập lý do & bấm Đặt|                              |                            |                 |
     |                          |-- 8. POST /appointments ---->|                            |                 |
     |                          |                              |-- Lưu lịch hẹn (PENDING) ------------------->|
     |                          |                              |-- Xóa khóa slot ---------->|                 |
     |                          |                              |-- Gửi thông báo đặt hẹn -------------------->|
     |                          |<-- 9. Mã hẹn LH-xxxx (201)---|                            |                 |
```

1. **Xem danh mục lịch trực:** Bệnh nhân truy cập `/patient/booking`. Chọn Chuyên khoa (Nội, Ngoại, Sản, Nhi...) $\rightarrow$ Hệ thống lọc ra danh sách Bác sĩ có lịch làm việc trong ngày đã chọn.
2. **Hiển thị ma trận khung giờ (Slots):**
   * *Frontend:* Gọi `GET /api/appointments/slots?doctorId=...&date=...`.
   * *Backend:* Truy vấn lịch trực `doctor_schedules` trong MongoDB. Với mỗi khung giờ 30 phút (08:00, 08:30, 09:00...), kiểm tra trên **Redis** key `slot:lock:{doctorId}:{date}:{slot}` và lịch hẹn đã chốt trong `appointments`. Trả về trạng thái: `AVAILABLE`, `LOCKED_BY_OTHER`, `BOOKED`.
3. **Giữ chỗ tạm thời (Distributed Lock):**
   * Bệnh nhân click vào ô slot `08:30`.
   * *Backend:* Gửi `POST /api/appointments/slot-locks` với body `{ doctorId, date, timeSlot, patientId }`.
   * *Cơ chế kỹ thuật Redis:* Lệnh nguyên tử `SET slot:lock:{doctorId}:{date}:{slot} {patientId} NX EX 600`.
     * Nếu slot chưa ai giữ (`NX` thành công): Trả về `200 OK`.
     * Nếu có người khác đã giữ: Trả về `409 Conflict` kèm thông báo *"Khung giờ này đang có người giữ chỗ, vui lòng chọn khung giờ khác"*.
   * *Giao diện:* Khi thành công, hiển thị thanh tiến trình đếm ngược $10\text{ phút}$ ($600\text{ giây}$).
4. **Xác nhận đặt lịch hẹn:**
   * Bệnh nhân nhập: Lý do khám bệnh, triệu chứng ban đầu, chọn có/không BHYT.
   * Nhấn nút "Xác nhận đặt lịch".
   * *Backend:* Gửi `POST /api/appointments`. Hệ thống tạo document mới trong `appointments` MongoDB với: `appointmentCode` (ví dụ `LH-20261117-0012`), trạng thái `PENDING_CONFIRMATION` hoặc `CONFIRMED`.
   * *Dọn dẹp Redis:* Xóa key khóa giữ chỗ trên Redis.
   * *Bảng xếp hạng:* Tăng điểm số ca khám của bác sĩ trên **Redis ZSet** `leaderboard:doctors:{yyyy-MM}` qua lệnh `ZINCRBY`.
   * *Thông báo:* Tạo thông báo tự động trong collection `notifications` cho bệnh nhân và bác sĩ.

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* **Concurrency / Race Condition:** Dùng 2 trình duyệt (2 tài khoản) cùng click vào 1 slot tại cùng 1 giây $\rightarrow$ Bắt buộc đúng 1 người nhận được giữ chỗ, người kia bị từ chối `409 Conflict`.
* **Timeout TTL 10 phút:** Giữ chỗ nhưng để yên không bấm xác nhận quá 10 phút $\rightarrow$ Khóa tự hủy, slot phải tự động chuyển lại màu xanh (`AVAILABLE`) cho người khác đặt.
* **Huỷ giữ chỗ chủ động:** Bệnh nhân chọn slot nhưng sau đó bấm "Chọn lại" $\rightarrow$ Phải gọi API giải phóng slot `POST /api/appointments/slot-locks/release`.

---

### UC03: QUẢN LÝ LỊCH HẸN
* **Tác nhân:** Bệnh nhân (`ROLE_PATIENT`).
* **Mục tiêu:** Xem danh sách lịch hẹn của bản thân, lọc theo trạng thái, thực hiện dời lịch (Reschedule) hoặc hủy lịch hẹn (Cancel).
* **Tiền điều kiện:** Bệnh nhân đã đăng nhập.

#### Luồng xử lý chi tiết (Flowwork):
1. **Xem danh sách lịch hẹn:**
   * Bệnh nhân truy cập `/patient/appointments`.
   * *Backend:* Gửi `GET /api/appointments/patient/{patientId}`. Truy vấn MongoDB collection `appointments` có chỉ mục kép `{ patientId: 1, appointmentDate: -1 }`.
   * Trả về danh sách thẻ lịch hẹn với các trạng thái: `CONFIRMED` (Đã xác nhận), `CHECKED_IN` (Đã tiếp nhận tại quầy), `COMPLETED` (Đã khám xong), `CANCELLED` (Đã hủy).
2. **Dời lịch hẹn (Reschedule):**
   * Với lịch hẹn ở trạng thái `CONFIRMED` và trước giờ khám ít nhất 2 giờ, bệnh nhân bấm "Dời lịch".
   * Chọn ngày khám và slot mới $\rightarrow$ Kích hoạt quy trình khóa slot mới trên Redis $\rightarrow$ Gọi `PUT /api/appointments/{id}/reschedule`.
   * Hệ thống cập nhật `appointmentDate`, `timeSlot`, ghi nhận lịch sử dời lịch vào mảng `rescheduleHistory[]`, giải phóng slot cũ và chốt slot mới.
3. **Hủy lịch hẹn (Cancel):**
   * Bệnh nhân bấm "Hủy hẹn", nhập lý do hủy (ví dụ: bận việc đột xuất).
   * *Backend:* Gọi `PUT /api/appointments/{id}/cancel`.
   * Cập nhật trạng thái `status = "CANCELLED"`, `cancelReason`, `cancelledAt`.
   * Tự động gửi thông báo đến Bác sĩ phụ trách.

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* **Quyền hạn:** Bệnh nhân A không thể xem, dời hoặc hủy lịch hẹn của bệnh nhân B (kiểm tra token `patientId` khớp với chủ sở hữu).
* **Quy tắc thời gian:** Cố tình dời/hủy lịch hẹn khi chỉ còn dưới 30 phút hoặc lịch đã chuyển sang `CHECKED_IN` / `COMPLETED` $\rightarrow$ Nút bấm bị vô hiệu hóa hoặc API trả lỗi `400 Bad Request`.

---

### UC04: THEO DÕI LƯỢT KHÁM
* **Tác nhân:** Bệnh nhân (`ROLE_PATIENT`).
* **Mục tiêu:** Theo dõi trực tuyến số thứ tự khám của mình, số hiện đang được bác sĩ gọi vào phòng và số lượt người còn lại đang chờ phía trước.
* **Tiền điều kiện:** Bệnh nhân đã đến phòng khám và được lễ tân cấp số thứ tự hàng đợi.

#### Luồng xử lý chi tiết (Flowwork):
1. **Truy cập trang theo dõi hàng đợi:** Bệnh nhân mở ứng dụng tại `/patient/queue-tracker` hoặc quét mã QR in trên phiếu số thứ tự K80.
2. **Truy vấn trạng thái lượt khám thời gian thực:**
   * *Backend:* Gửi `GET /api/queue/ticket/{ticketNumber}/track` hoặc `GET /api/queue/patient/{patientId}/active`.
   * *Dữ liệu trả về:*
     * Số thứ tự của bệnh nhân (ví dụ: `A-015`).
     * Buồng khám chỉ định (ví dụ: `Phòng 102 - Chuyên khoa Nội`).
     * Số thứ tự hiện tại đang khám trong buồng (ví dụ: `A-012`).
     * Số người còn chờ phía trước: $15 - 12 - 1 = 2\text{ người}$.
     * Trạng thái lượt khám: `WAITING` (Đang chờ), `CALLING` (Đang được gọi - chuông rung/nhấp nháy), `IN_CONSULTATION` (Đang khám), `WAITING_RESULTS` (Chờ kết quả xét nghiệm).
3. **Cơ chế cập nhật tự động:** Giao diện sử dụng kỹ thuật polling ngắn (khoảng 3–5 giây/lần) hoặc Server-Sent Events (SSE) để đồng bộ trạng thái khi bác sĩ bấm gọi số mới.

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* Bác sĩ ở buồng khám bấm gọi số tiếp theo $\rightarrow$ Màn hình theo dõi của bệnh nhân phải cập nhật số đang khám ngay lập tức.
* Khi trạng thái chuyển sang `CALLING` $\rightarrow$ Giao diện đổi sang màu xanh lá/rung chuông cảnh báo bệnh nhân chuẩn bị bước vào buồng khám.

---

### UC05: TRA CỨU HỒ SƠ KHÁM
* **Tác nhân:** Bệnh nhân (`ROLE_PATIENT`).
* **Mục tiêu:** Xem chi tiết hồ sơ bệnh án điện tử (EMR) của đợt khám hiện tại hoặc một ca khám cụ thể sau khi bác sĩ đã hoàn tất và đóng băng hồ sơ.
* **Tiền điều kiện:** Ca khám đã hoàn tất và có mã hồ sơ bệnh án (`visitCode`).

#### Luồng xử lý chi tiết (Flowwork):
1. **Truy cập danh sách bệnh án:** Bệnh nhân vào `/patient/records`.
2. **Xem chi tiết hồ sơ bệnh án EMR:**
   * Chọn ca khám $\rightarrow$ Gọi `GET /api/records/{id}` hoặc `GET /api/records/code/{visitCode}`.
   * *Backend:* Truy vấn MongoDB collection `medical_records`.
   * *Hiển thị cấu trúc tài liệu nhúng hoàn chỉnh:*
     * Thông tin hành chính, bác sĩ thăm khám, buồng khám, ngày khám.
     * Lý do khám và triệu chứng lâm sàng.
     * Snapshot 5 chỉ số sinh tồn tại thời điểm khám (Huyết áp, Mạch, Nhiệt độ, Nhịp thở, $SpO_2$, Cân nặng, Chiều cao, BMI).
     * Danh sách chẩn đoán mã quốc tế ICD-10 (`diagnoses[]` gồm mã bệnh, tên bệnh, loại chẩn đoán chính/phụ).
     * Danh sách chỉ định cận lâm sàng và kết quả trả về (`serviceOrders[]`).
     * Đơn thuốc điều trị (`prescriptions[]` gồm tên biệt dược, hoạt chất, số lượng, liều dùng sáng/trưa/chiều/tối, dặn dò).
     * Lời dặn dò của bác sĩ và hẹn ngày tái khám (`followUpDays`).
     * Trạng thái hồ sơ: Badge `ĐÃ KHÓA BẢO MẬT` (`isLocked: true`).

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* **Bảo mật:** Bệnh nhân chỉ được xem bệnh án có `patientId` trùng khớp với tài khoản đang đăng nhập. Mọi nỗ lực thay đổi `id` trên URL để xem bệnh án của người khác phải trả về `403 Forbidden` hoặc `404 Not Found`.

---

### UC06: TRA CỨU LỊCH SỬ KHÁM
* **Tác nhân:** Bệnh nhân (`ROLE_PATIENT`).
* **Mục tiêu:** Xem dòng thời gian toàn bộ các lần khám bệnh trong quá khứ và theo dõi biểu đồ diễn tiến chuỗi thời gian các chỉ số sinh hiệu (Huyết áp, Mạch, Cân nặng...) qua các đợt khám.
* **Tiền điều kiện:** Bệnh nhân đã từng khám tại phòng khám ít nhất 1 lần.

#### Luồng xử lý chi tiết (Flowwork):
1. **Mở lịch sử khám:** Bệnh nhân vào `/patient/history`.
2. **Tải dữ liệu tóm tắt dòng thời gian:**
   * *Backend:* Gọi `GET /api/patients/{id}/history`. Truy vấn toàn bộ các đợt khám từ MongoDB sắp xếp theo ngày giảm dần.
3. **Tải chuỗi thời gian sinh hiệu từ Cassandra:**
   * *Frontend:* Yêu cầu vẽ biểu đồ biến thiên huyết áp/mạch $\rightarrow$ Gọi `GET /api/records/patient/{patientId}/vitals-history?limit=10`.
   * *Backend (Cassandra):* Truy vấn bảng **`patient_vital_signs`** theo Partition Key `patient_id` và Clustering Key `recorded_at DESC` với chi phí $O(1)$.
   * *Hiển thị:* Biểu đồ đường (Line Chart) biểu diễn đường huyết áp tâm thu/tâm trương và nhịp tim qua các lần đo, giúp bệnh nhân nhận biết xu hướng sức khỏe.

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* Kiểm tra thứ tự hiển thị: Ca khám mới nhất phải nằm ở trên cùng.
* Đối chiếu số liệu trên biểu đồ với dữ liệu thực tế được lưu trong bảng Cassandra `patient_vital_signs`.

---

### UC07: THEO DÕI HOÁ ĐƠN
* **Tác nhân:** Bệnh nhân (`ROLE_PATIENT`).
* **Mục tiêu:** Xem danh sách hóa đơn viện phí, chi tiết từng khoản mục chi phí (tiền khám, thuốc, xét nghiệm), trạng thái thanh toán và quét mã VietQR để thanh toán trực tuyến.
* **Tiền điều kiện:** Đã phát sinh hóa đơn từ ca khám.

#### Luồng xử lý chi tiết (Flowwork):
1. **Xem danh mục hóa đơn:** Bệnh nhân vào `/patient/billing`.
   * *Backend:* Gọi `GET /api/billing/patient/{patientId}`. Truy vấn collection `bills` trong MongoDB.
2. **Xem chi tiết hóa đơn:**
   * Bệnh nhân bấm xem chi tiết $\rightarrow$ Gọi `GET /api/billing/{id}`.
   * *Chi tiết hiển thị:* Mã hóa đơn (`billCode`), mã ca khám, tiền công khám (`consultationFee`), tiền cận lâm sàng (`serviceFee`), tiền thuốc (`medicineFee`), số tiền bảo hiểm chi trả, tổng tiền cần thanh toán (`totalAmount` lưu kiểu `Decimal128`).
3. **Lấy mã VietQR thanh toán:**
   * Nếu trạng thái hóa đơn là `UNPAID`, bệnh nhân bấm "Thanh toán VietQR".
   * *Backend:* Gọi `POST /api/billing/{id}/vietqr`. Hệ thống phát sinh chuỗi payload VietQR chuẩn Napas 247 gồm: Số tài khoản phòng khám, Ngân hàng thụ hưởng, Số tiền chính xác, Nội dung chuyển khoản chứa mã hóa đơn.
   * Bệnh nhân mở ứng dụng Mobile Banking quét mã chuyển khoản.

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* Kiểm tra độ chính xác tiền tệ: Tính tổng từng mục chi phí xem có khớp tuyệt đối với `totalAmount` hay không (không xảy ra lỗi sai số làm tròn floating-point).
* Khi trạng thái là `PAID` $\rightarrow$ Nút bấm quét VietQR ẩn đi, hiển thị thông tin ngày giờ thanh toán.

---

### UC08: NHẬN THÔNG BÁO
* **Tác nhân:** Bệnh nhân (`ROLE_PATIENT`).
* **Mục tiêu:** Nhận thông báo tự động từ hệ thống (chuông thông báo, badge đếm tin chưa đọc), đọc chi tiết và đánh dấu đã đọc.
* **Tiền điều kiện:** Bệnh nhân đã đăng nhập.

#### Luồng xử lý chi tiết (Flowwork):
1. **Hiển thị chuông thông báo:**
   * Góc phải thanh điều hướng hiển thị biểu tượng quả chuông kèm số badge màu đỏ tin chưa đọc.
   * *Backend:* Gọi `GET /api/notifications/unread-count?userId=...` $\rightarrow$ Trả về số lượng (ví dụ: `3`).
2. **Xem danh sách thông báo:**
   * Click vào quả chuông $\rightarrow$ Gọi `GET /api/notifications/summary?userId=...`.
   * Trả về danh sách thông báo phân loại theo `NotificationType`:
     * `APPOINTMENT_REMINDER`: Nhắc lịch khám trước ngày hẹn.
     * `QUEUE_UPDATE`: Thông báo còn 2 lượt nữa đến số thứ tự của bạn.
     * `LAB_RESULTS_READY`: Đã có kết quả xét nghiệm, mời quay lại buồng khám.
     * `BILL_CREATED`: Hóa đơn viện phí đã sẵn sàng thanh toán.
3. **Thao tác đọc / xóa:**
   * Click vào 1 thông báo $\rightarrow$ Gọi `PATCH /api/notifications/{id}/read` $\rightarrow$ Cập nhật `isRead = true`.
   * Bấm "Đánh dấu tất cả đã đọc" $\rightarrow$ Gọi `PATCH /api/notifications/mark-all-read`.

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* Bác sĩ khóa bệnh án hoặc lễ tân cấp số $\rightarrow$ Kiểm tra thông báo có phát sinh tương ứng cho bệnh nhân không.
* Click đọc tin $\rightarrow$ Số badge đếm đỏ phải giảm đi 1 ngay lập tức.

---

# PHẦN II: NHÓM CA SỬ DỤNG THU NGÂN / LỄ TÂN (RECEPTIONIST)

---

### UC09: TIẾP NHẬN BỆNH NHÂN
* **Tác nhân:** Lễ tân / Thu ngân (`ROLE_RECEPTIONIST`).
* **Mục tiêu:** Tiếp nhận bệnh nhân tại quầy tiếp đón: tra cứu bệnh nhân cũ qua CCCD/SĐT hoặc đăng ký hồ sơ bệnh nhân mới; phân luồng buồng khám và cấp phiếu số thứ tự.
* **Tiền điều kiện:** Lễ tân đã đăng nhập vào hệ thống tại máy trạm sảnh tiếp đón.

#### Luồng xử lý chi tiết (Flowwork):
```text
[Bệnh nhân đến quầy] -> [Lễ tân nhập CCCD/SĐT] -> [GET /api/patients?query=...]
                                |
             +------------------+------------------+
             | (Đã có hồ sơ)                       | (Bệnh nhân mới)
             v                                     v
   [Hiển thị thông tin cũ]               [Mở form tạo mới hồ sơ]
   [Kiểm tra lịch hẹn trước]             [Nhập CCCD, Họ tên, SĐT, Tiền sử dị ứng]
             |                                     v
             |                           [POST /api/patients] -> Sinh mã BN-xxxx
             +------------------+------------------+
                                |
                                v
                   [Chọn chuyên khoa/buồng khám]
                   [POST /api/reception/checkin]
                                |
             +------------------+------------------+
             |                                     |
    (Redis: INCR bộ đếm)                 (MongoDB: queue_tickets)
    Tăng số thứ tự STT                   Lưu vé: ticketNumber, status=WAITING
             |                                     |
             +------------------+------------------+
                                v
                   [In phiếu số khám K80]
```

1. **Tra cứu hồ sơ:**
   * Bệnh nhân đến quầy xuất trình CCCD hoặc đọc số điện thoại.
   * Lễ tân nhập vào ô tìm kiếm $\rightarrow$ Gọi `GET /api/patients?query=...`.
2. **Xử lý theo đối tượng:**
   * **Bệnh nhân cũ:** Hệ thống hiển thị thông tin hành chính, mã bệnh nhân `patientCode`, tiền sử dị ứng thuốc và lịch hẹn trực tuyến đã đặt trong ngày (nếu có).
   * **Bệnh nhân mới:** Lễ tân bấm "Tạo hồ sơ mới", nhập họ tên, ngày sinh, giới tính, CCCD, SĐT, địa chỉ, tiền sử bệnh $\rightarrow$ Gọi `POST /api/patients`. Backend tạo document trong MongoDB `patients`, sinh mã tự động `BN-yyyyMMdd-xxxx`.
3. **Cấp phát số thứ tự tiếp nhận:**
   * Lễ tân chọn Chuyên khoa khám (ví dụ Khoa Nội) và Buồng khám (Phòng 101, Bác sĩ Nguyễn Văn A).
   * Bấm nút "Xác nhận tiếp nhận & Cấp số".
   * *Backend:* Gọi `POST /api/reception/checkin`.
   * *Cơ chế kỹ thuật:*
     * Kích hoạt lệnh **Redis `INCR counter:ticket:{prefix}:{date}`** (ví dụ: `counter:ticket:A:20261117`). Lệnh thực thi nguyên tử đơn luồng trên RAM trong $< 1\text{ ms}$, trả về số tự tăng liên tục (ví dụ: `15` $\rightarrow$ tạo chuỗi số `A-015`).
     * Tạo document mới trong collection **`queue_tickets`** MongoDB: `ticketNumber: "A-015"`, `department: "Khoa Nội"`, `roomName: "Phòng 101"`, `status: "WAITING"`, `priority: "NORMAL"`.
4. **In phiếu khám nhiệt khổ K80:**
   * Hệ thống trả về dữ liệu in phiếu `GET /api/reception/tickets/{id}/print`. Lễ tân in phiếu nhiệt đưa cho bệnh nhân (ghi rõ: Tên phòng khám, Mã bệnh nhân, Họ tên, Số thứ tự khám to rõ, Buồng khám chỉ định và số lượng người đang đợi).

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* **Cấp số đồng thời:** 5 máy tiếp đón cùng bấm cấp số tại cùng một thời điểm $\rightarrow$ Tuyệt đối không bao giờ phát sinh 2 phiếu có cùng `ticketNumber`.
* **Trường hợp khẩn cấp:** Chọn mức ưu tiên `EMERGENCY` $\rightarrow$ Hệ thống tự động gán tiền tố ưu tiên (ví dụ `C-xxx`) và đẩy lên đầu hàng đợi.

---

### UC10: QUẢN LÝ LỊCH HẸN (PHÍA LỄ TÂN)
* **Tác nhân:** Lễ tân / Thu ngân (`ROLE_RECEPTIONIST`).
* **Mục tiêu:** Theo dõi toàn bộ lịch hẹn khám bệnh trong ngày của phòng khám, xác nhận check-in khi bệnh nhân có mặt, hoặc hỗ trợ dời lịch / hủy lịch theo yêu cầu qua điện thoại.
* **Tiền điều kiện:** Lễ tân đã đăng nhập.

#### Luồng xử lý chi tiết (Flowwork):
1. **Xem danh sách lịch hẹn toàn phòng khám:**
   * Truy cập `/reception/appointments`.
   * *Backend:* Gọi `GET /api/appointments?date=...&doctorId=...&status=...`.
   * Lọc theo ngày hiện tại, theo bác sĩ phụ trách, theo trạng thái (`CONFIRMED`, `CHECKED_IN`, `CANCELLED`).
2. **Xác nhận Check-in cho bệnh nhân đã đặt trước:**
   * Khi bệnh nhân có lịch hẹn đến quầy, lễ tân nhập mã hẹn `appointmentCode` $\rightarrow$ Nhấn "Xác nhận Check-in".
   * *Backend:* Gọi `PUT /api/appointments/{id}/checkin`. Trạng thái lịch hẹn chuyển sang `CHECKED_IN`.
   * Tự động kích hoạt cấp số thứ tự ưu tiên khám đúng khung giờ đã đặt và chuyển vé vào buồng khám của bác sĩ đã hẹn.
3. **Hỗ trợ dời lịch / hủy lịch tại quầy:**
   * Khi bệnh nhân gọi điện xin đổi giờ hoặc hủy $\rightarrow$ Lễ tân thực hiện dời slot hoặc hủy tương tự quy trình UC03, ghi nhận tên lễ tân thao tác vào vết kiểm toán.

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* Check-in sai ngày hẹn (bệnh nhân đặt lịch ngày mai nhưng hôm nay đến check-in) $\rightarrow$ Hệ thống cảnh báo không thể check-in trước ngày hẹn.
* Đã check-in thành công 1 lần $\rightarrow$ Không thể bấm check-in lần thứ 2 (tránh cấp trùng số).

---

### UC11: QUẢN LÝ HÀNG ĐỢI
* **Tác nhân:** Lễ tân / Thu ngân (`ROLE_RECEPTIONIST`).
* **Mục tiêu:** Giám sát lưu lượng bệnh nhân tại các sảnh chờ, điều phối bệnh nhân giữa các buồng khám, ưu tiên ca nặng lên đầu hàng đợi và quản trị màn hình hiển thị LCD hàng đợi sảnh.
* **Tiền điều kiện:** Lễ tân đã đăng nhập.

#### Luồng xử lý chi tiết (Flowwork):
1. **Theo dõi bảng điều khiển hàng đợi:**
   * Truy cập `/reception/queue`. Gọi `GET /api/queue/summary`.
   * Hiển thị biểu đồ và số lượng theo thời gian thực: Số bệnh nhân đang chờ tại Khoa Nội, Khoa Ngoại, Nhi, Sản; thời gian chờ trung bình.
2. **Ưu tiên ca đặc biệt lên đầu hàng:**
   * Khi có bệnh nhân người già yếu, trẻ sơ sinh hoặc ca cấp cứu nhẹ $\rightarrow$ Lễ tân click vào hàng của bệnh nhân đó $\rightarrow$ Chọn "Đưa lên đầu hàng đợi".
   * *Backend:* Gọi `POST /api/queue/{id}/promote`. Hệ thống cập nhật độ ưu tiên `priority = "HIGH"` hoặc `"EMERGENCY"`, sắp xếp lại thứ tự ưu tiên trong hàng đợi buồng khám.
3. **Màn hình LCD công cộng sảnh chờ:**
   * Hệ thống cung cấp đường dẫn chuyên dụng `/reception/queue-board` hiển thị toàn màn hình (Full Screen) trên các tivi sảnh lớn.
   * Dữ liệu polling tự động mỗi 3 giây qua `GET /api/queue/board`.
   * Giao diện hiển thị:
     * Cột bên trái: Danh sách các buồng khám, số thứ tự đang khám (màu xanh lục nhấp nháy to rõ kèm âm thanh ding-dong khi có số mới).
     * Cột bên phải: Danh sách 3 số thứ tự chuẩn bị tiếp theo.

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* Bấm nút "Đưa lên đầu hàng" $\rightarrow$ Kiểm tra danh sách hàng đợi bên buồng khám của bác sĩ: bệnh nhân đó phải lập tức nhảy lên vị trí đầu tiên của lượt gọi tiếp theo.
* Kiểm tra giao diện LCD sảnh khi không có bệnh nhân nào chờ: hiển thị màn hình chờ thân thiện, không báo lỗi JS console.

---

### UC12: QUẢN LÝ HỒ SƠ BỆNH NHÂN
* **Tác nhân:** Lễ tân / Thu ngân (`ROLE_RECEPTIONIST`).
* **Mục tiêu:** Quản lý thông tin hành chính, định danh công dân và tiền sử sức khỏe tổng quát của bệnh nhân.
* **Tiền điều kiện:** Lễ tân đã đăng nhập.

#### Luồng xử lý chi tiết (Flowwork):
1. **Tìm kiếm danh sách bệnh nhân:**
   * Truy cập `/reception/patients`.
   * Nhập từ khóa: Họ tên (tìm kiếm mờ Text Index MongoDB), SĐT, số CCCD hoặc mã `BN-xxxx`.
   * *Backend:* Gọi `GET /api/patients?query=...`. Sử dụng Text Index trên collection `patients`: `{ fullName: "text", patientCode: "text" }`.
2. **Cập nhật thông tin bệnh nhân:**
   * Click vào bệnh nhân $\rightarrow$ Mở form chi tiết.
   * Cập nhật số thẻ BHYT, địa chỉ cư trú, người bảo hộ, nhóm máu.
   * Đặc biệt: Cập nhật **Cảnh báo dị ứng thuốc (Allergies)**. Đây là trường dữ liệu y tế sống còn để cảnh báo bác sĩ khi kê đơn.
   * Bấm "Lưu thay đổi" $\rightarrow$ Gọi `PUT /api/patients/{id}`.

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* Nhập trùng số CCCD với một bệnh nhân khác đã có trong hệ thống $\rightarrow$ Báo lỗi vi phạm Unique Index.
* Thêm tiền sử dị ứng thuốc Penicillin $\rightarrow$ Bác sĩ kê thuốc chứa Penicillin ở ca khám sau phải lập tức nhận cảnh báo màu đỏ.

---

### UC13: QUẢN LÝ HOÁ ĐƠN
* **Tác nhân:** Lễ tân / Thu ngân (`ROLE_RECEPTIONIST`).
* **Mục tiêu:** Tiếp nhận hóa đơn viện phí tự động từ buồng khám, thu tiền mặt hoặc thanh toán VietQR động, trừ kho thuốc tự động và xuất sổ thu ngân ra file Excel `.xlsx`.
* **Tiền điều kiện:** Bác sĩ tại buồng khám đã kết thúc ca khám và bấm "Khóa bệnh án EMR".

#### Luồng xử lý chi tiết (Flowwork):
```text
[Bác sĩ khóa EMR] -> [Hệ thống tự động sinh Hóa đơn trong bills]
                              |
                     [Thu ngân mở /billing]
             [Hóa đơn ở trạng thái CHỜ THANH TOÁN]
                              |
             +----------------+----------------+
             | (Tiền mặt)                      | (Chuyển khoản QR)
             v                                 v
   [Nhập số tiền khách đưa]           [POST /billing/{id}/vietqr]
   [Hệ thống tính tiền thừa]          [Hiển thị mã VietQR động NAPAS 247]
   [POST /billing/{id}/pay-cash]      [Bệnh nhân quét mã thanh toán]
             |                        [POST /billing/{id}/confirm-vietqr]
             +----------------+----------------+
                              |
                              v
                  [Cập nhật status = "PAID"]
                              |
             +----------------+----------------+
             |                                 |
   (MongoDB: pharmacy_drugs)         (Cassandra: audit_logs)
   Toán tử $inc trừ số lượng         Ghi nhận giao dịch tài chính
   tồn kho thuốc theo đơn            vào 3 bảng Logged Batch
             |                                 |
             +----------------+----------------+
                              v
              [In phiếu thu tiền viện phí]
              [Xuất sổ thu ngân ra file Excel .xlsx]
```

1. **Tiếp nhận hóa đơn tự động:**
   * Ngay khi bác sĩ khóa bệnh án EMR, hệ thống tự động tổng hợp chi phí thành 1 document mới trong collection `bills` MongoDB với trạng thái `paymentStatus: "UNPAID"`.
   * Thu ngân mở màn hình `/reception/billing` $\rightarrow$ Hóa đơn mới lập tức xuất hiện đầu danh sách kèm mã `HD-yyyyMMdd-xxxx`.
   * Chi tiết chi phí bao gồm: Tiền công khám, Tiền dịch vụ cận lâm sàng (xét nghiệm, X-quang), Tiền thuốc theo đơn. Toàn bộ tính toán với kiểu dữ liệu chính xác tuyệt đối `Decimal128`.
2. **Thanh toán bằng Tiền mặt (Cash Payment):**
   * Bệnh nhân thanh toán tiền mặt $\rightarrow$ Thu ngân nhập "Số tiền nhận từ khách". Hệ thống tự tính "Tiền thối lại".
   * Bấm "Xác nhận thu tiền mặt" $\rightarrow$ Gọi `POST /api/billing/{id}/pay-cash`.
3. **Thanh toán bằng Chuyển khoản VietQR động:**
   * Bệnh nhân chọn chuyển khoản $\rightarrow$ Thu ngân bấm "Tạo mã VietQR".
   * *Backend:* Gọi `POST /api/billing/{id}/vietqr`. Hệ thống sinh mã VietQR động chuẩn NAPAS 247 hiển thị trực tiếp lên màn hình phụ hướng về phía bệnh nhân.
   * Khi tiền vào tài khoản $\rightarrow$ Thu ngân bấm "Xác nhận đã nhận chuyển khoản" $\rightarrow$ Gọi `POST /api/billing/{id}/confirm-vietqr`.
4. **Cơ chế trừ tồn kho thuốc nguyên tử:**
   * Ngay khi hóa đơn chuyển sang `PAID`, Backend duyệt qua mảng chi tiết thuốc trong đơn, kích hoạt toán tử **`$inc: { stockQuantity: -qty }`** trên collection `pharmacy_drugs` trong MongoDB. Đảm bảo số lượng tồn kho giảm ngay lập tức, không bị âm kho và không xảy ra Race Condition.
5. **Ghi vết kiểm toán & Xuất báo cáo Excel:**
   * Ghi nhận giao dịch thanh toán vào Cassandra qua `LOGGED BATCH`.
   * Cuối ca trực, thu ngân bấm "Xuất sổ thu ngân Excel" $\rightarrow$ Gọi `GET /api/reports/cashier-book/export-excel`. Thư viện **Apache POI** kết xuất trực tiếp tệp bảng tính `.xlsx` gồm danh sách hóa đơn, phân loại tiền mặt/QR, tổng doanh thu ca trực.

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* **Tính toàn vẹn kho:** Sau khi thanh toán đơn thuốc có 20 viên Paracetamol $\rightarrow$ Kiểm tra kho dược collection `pharmacy_drugs`: số lượng Paracetamol phải giảm chính xác đúng 20 viên.
* **Xác thực trạng thái:** Hóa đơn đã thanh toán (`PAID`) không thể thanh toán lại lần thứ 2.
* **File Excel:** Mở file `.xlsx` tải về, kiểm tra định dạng số tiền, tiêu đề cột, chữ ký và công thức tính tổng trong Excel.

---

# PHẦN III: NHÓM CA SỬ DỤNG BÁC SĨ (DOCTOR)

---

### UC14: QUẢN LÝ KHÁM BỆNH
* **Tác nhân:** Bác sĩ chuyên khoa (`ROLE_DOCTOR`).
* **Mục tiêu:** Quản lý danh sách hàng đợi tại buồng khám cá nhân, gọi bệnh nhân vào phòng, tạm dừng ca khám hoặc chuyển trạng thái bệnh nhân đi làm xét nghiệm.
* **Tiền điều kiện:** Bác sĩ đã đăng nhập và đang ngồi tại buồng khám được phân công.

#### Luồng xử lý chi tiết (Flowwork):
1. **Mở buồng khám:** Bác sĩ truy cập `/doctor/consultation`.
   * Hệ thống hiển thị: Danh sách bệnh nhân đang chờ tại buồng khám của bác sĩ (sắp xếp theo mức độ ưu tiên `priority` và thời gian cấp số).
2. **Gọi khám bệnh nhân:**
   * Bác sĩ bấm nút "Gọi số tiếp theo".
   * *Backend:* Gọi `POST /api/queue/call-next` với `{ roomName, doctorId }`.
   * *Xử lý:* Hệ thống lấy vé số đầu tiên ở trạng thái `WAITING`, chuyển trạng thái thành `CALLING`, phát âm thanh/hiển thị trên màn hình LCD cửa buồng khám.
   * Khi bệnh nhân bước vào phòng $\rightarrow$ Chuyển trạng thái sang `IN_CONSULTATION`.
3. **Điều phối trong ca khám:**
   * Nếu bệnh nhân cần đi làm xét nghiệm/X-quang $\rightarrow$ Chuyển trạng thái vé sang `WAITING_RESULTS` (Chờ kết quả).
   * Khi phòng xét nghiệm trả kết quả về $\rightarrow$ Trạng thái tự động đổi thành `RESULTS_READY` (Đã có kết quả) và được ưu tiên gọi lại ngay khi bác sĩ kết thúc ca hiện tại.

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* Khi hàng đợi buồng khám hết người $\rightarrow$ Bấm "Gọi số tiếp theo" phải thông báo phù hợp, không gây crash ứng dụng.
* Bệnh nhân có kết quả xét nghiệm (`RESULTS_READY`) phải được hiển thị nổi bật để bác sĩ gọi lại khám kết luận.

---

### UC15: QUẢN LÝ HỒ SƠ BỆNH ÁN
* **Tác nhân:** Bác sĩ chuyên khoa (`ROLE_DOCTOR`).
* **Mục tiêu:** Tạo lập bệnh án điện tử EMR, ghi nhận 5 chỉ số sinh hiệu (lưu đồng thời MongoDB và Cassandra), chẩn đoán bệnh theo mã ICD-10 và thực thi đóng băng hồ sơ bệnh án bất biến.
* **Tiền điều kiện:** Đang trong phiên khám lâm sàng với bệnh nhân.

#### Luồng xử lý chi tiết (Flowwork):
1. **Khởi tạo bệnh án EMR:**
   * Khi bắt đầu khám, hệ thống tạo bản ghi `medical_records` ở trạng thái mở `isLocked: false`.
   * Bác sĩ nhập: Lý do đến khám (`chiefComplaint`), quá trình bệnh lý (`clinicalSymptoms`).
2. **Nhập và lưu trữ 5 chỉ số sinh hiệu (Polyglot Dual-write):**
   * Nhập: Huyết áp tâm thu/tâm trương (mmHg), Mạch (lần/phút), Thân nhiệt (°C), Nhịp thở, $SpO_2$ (%), Chiều cao (cm), Cân nặng (kg) $\rightarrow$ Tự động tính chỉ số BMI.
   * *Backend:* Gửi `POST /api/records/emr/vital-signs`.
   * *Cơ chế lưu trữ đa mô hình:*
     * Ghi **1 bản Snapshot** nhúng trực tiếp vào tài liệu bệnh án trên **MongoDB** (phục vụ hiển thị nhanh cho đợt khám này).
     * Ghi **1 bản ghi chuỗi thời gian Append-only** vào bảng **`patient_vital_signs`** trên **Apache Cassandra** với `patient_id` và dấu thời gian chính xác (phục vụ truy vấn diễn tiến lịch sử lâu dài).
3. **Thiết lập chẩn đoán mã ICD-10:**
   * Bác sĩ gõ tìm kiếm mã bệnh quốc tế ICD-10 (ví dụ gõ "tăng huyết áp" $\rightarrow$ gợi ý mã `I10`; gõ "viêm dạ dày" $\rightarrow$ gợi ý mã `K29`).
   * Gắn nhãn chẩn đoán chính và các chẩn đoán phụ đi kèm.
4. **Đóng băng và Khóa bệnh án bất biến (Lock EMR):**
   * Sau khi hoàn tất khám, chỉ định cận lâm sàng và kê đơn thuốc, bác sĩ bấm nút **"Hoàn tất & Khóa bệnh án"**.
   * Hệ thống hiển thị hộp thoại xác nhận: *"Bệnh án sau khi khóa sẽ không thể chỉnh sửa nội dung lâm sàng theo quy định của Bộ Y tế. Bạn có chắc chắn muốn khóa?"*.
   * *Backend:* Gọi `PATCH /api/records/{id}/lock`.
   * *Thực thi:*
     * Cập nhật nguyên tử trên MongoDB: `isLocked: true`, `lockedAt: Instant.now()`.
     * Tự động kích hoạt tạo hóa đơn viện phí bên phân hệ thu ngân (UC13).
     * Ghi nhận hành vi `LOCK_EMR` vào Cassandra qua `LOGGED BATCH` để lưu vết thanh tra y tế.
   * *Giao diện:* Toàn bộ các trường nhập liệu chuyển sang trạng thái chỉ đọc (Read-only), hiển thị biểu tượng ổ khóa màu xanh/xám.

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* **Tính bất biến pháp lý:** Bệnh án đã khóa (`isLocked: true`), cố tình dùng Postman gửi request sửa chẩn đoán hoặc sửa đơn thuốc $\rightarrow$ Backend bắt buộc phải từ chối và trả về mã lỗi `400 Bad Request`.
* **Toàn vẹn sinh hiệu:** Kiểm tra chỉ số sinh hiệu nhập vào có xuất hiện đồng thời trong MongoDB EMR và bảng Cassandra `patient_vital_signs` hay không.

---

### UC16: CHỈ ĐỊNH CẬN LÂM SÀNG
* **Tác nhân:** Bác sĩ chuyên khoa (`ROLE_DOCTOR`).
* **Mục tiêu:** Phát hành phiếu chỉ định các kỹ thuật cận lâm sàng (xét nghiệm, siêu âm, X-quang, điện tâm đồ) từ danh mục kỹ thuật y tế của phòng khám.
* **Tiền điều kiện:** Hồ sơ bệnh án EMR đang mở (`isLocked: false`).

#### Luồng xử lý chi tiết (Flowwork):
1. **Mở danh mục kỹ thuật cận lâm sàng:** Tại màn hình bệnh án EMR, bác sĩ chuyển sang tab "Cận lâm sàng & Xét nghiệm".
2. **Chọn kỹ thuật:**
   * Bác sĩ tìm kiếm và chọn các dịch vụ: Xét nghiệm công thức máu, Sinh hóa máu, X-quang tim phổi thẳng, Siêu âm ổ bụng tổng quát...
   * Nhập ghi chú lâm sàng cho kỹ thuật viên (ví dụ: *Nghi ngờ sỏi thận, kiểm tra kỹ vùng hạ sườn phải*).
3. **Cập nhật vào hồ sơ bệnh án:**
   * Nhấn "Lưu chỉ định".
   * *Backend:* Cập nhật mảng tài liệu nhúng `serviceOrders[]` trong `medical_records` MongoDB. Mỗi phần tử chứa: `serviceCode`, `serviceName`, `price`, `department`, `status: "PENDING"`, `notes`.
   * Trạng thái lượt khám của bệnh nhân chuyển sang `WAITING_RESULTS`. Bệnh nhân cầm phiếu in chỉ định sang phòng chức năng lấy mẫu / chụp chiếu.

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* Chọn trùng lặp 1 dịch vụ xét nghiệm 2 lần trong cùng một phiếu chỉ định $\rightarrow$ Cảnh báo xác nhận tránh chỉ định thừa.
* Giá tiền các dịch vụ cận lâm sàng phải được lấy chính xác từ danh mục `medical_services` tại thời điểm chỉ định.

---

### UC17: XEM VÀ ĐÁNH GIÁ KẾT QUẢ CẬN LÂM SÀNG
* **Tác nhân:** Bác sĩ chuyên khoa (`ROLE_DOCTOR`).
* **Mục tiêu:** Tiếp nhận và đối chiếu các kết quả xét nghiệm, chẩn đoán hình ảnh từ phòng chức năng gửi về; đưa ra kết luận chẩn đoán xác định.
* **Tiền điều kiện:** Kỹ thuật viên cận lâm sàng đã nhập kết quả lên hệ thống.

#### Luồng xử lý chi tiết (Flowwork):
1. **Thông báo kết quả sẵn sàng:**
   * Khi phòng xét nghiệm hoàn tất, trạng thái dịch vụ chuyển sang `COMPLETED`, cập nhật trường `resultValue`, `normalRange`, `evaluation` và đính kèm đường dẫn ảnh chụp X-quang/siêu âm.
   * Bác sĩ nhận thông báo `RESULTS_READY` trên giao diện buồng khám.
2. **Xem và phân tích kết quả:**
   * Bác sĩ click mở xem chi tiết kết quả cận lâm sàng của bệnh nhân.
   * Giao diện đánh dấu nổi bật màu đỏ các chỉ số sinh hóa vượt ngưỡng tham chiếu bình thường (ví dụ: Đường huyết Glucozơ $> 7.0\text{ mmol/L}$, Axit Uric tăng cao...).
3. **Đưa ra chẩn đoán xác định:**
   * Dựa trên kết quả cận lâm sàng, bác sĩ quay lại tab chẩn đoán, hoàn thiện mã bệnh ICD-10 và chuyển sang kê đơn điều trị.

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* Kiểm tra việc hiển thị dải tham chiếu bình thường và cảnh báo chỉ số bất thường.
* Kết quả cận lâm sàng phải được nhúng trực tiếp vào bệnh án EMR của bệnh nhân để lưu trữ vĩnh viễn.

---

### UC18: QUẢN LÝ ĐƠN THUỐC (AN TOÀN DƯỢC LÝ NEO4J)
* **Tác nhân:** Bác sĩ chuyên khoa (`ROLE_DOCTOR`).
* **Mục tiêu:** Kê đơn thuốc điện tử với sự hỗ trợ của **Đồ thị tri thức dược lý Neo4j**: Tự động phát hiện tương tác thuốc đối kháng (DDI), kiểm tra chống chỉ định theo mã bệnh ICD-10 và tiền sử dị ứng, đề xuất thuốc thay thế an toàn.
* **Tiền điều kiện:** Bệnh án EMR đang mở và đã có chẩn đoán bệnh.

#### Luồng xử lý chi tiết (Flowwork):
```text
[Bác sĩ thêm thuốc vào đơn] -> [Frontend: danh sách thuốc tạm thời]
                                          |
                      [POST /api/prescriptions/safety-check]
                                          |
                 +------------------------+------------------------+
                 | (MongoDB)                                       | (Neo4j Graph Database)
                 v                                                 v
   [Lấy tiền sử dị ứng bệnh nhân]                     [Cypher: MATCH (a)-[:INTERACTS_WITH]-(b)]
   [Đối chiếu hoạt chất với dị ứng]                   [Cypher: MATCH (a)-[:CONTRAINDICATED_IN]->(d)]
                 |                                                 |
                 +------------------------+------------------------+
                                          |
                                          v
                         [Tổng hợp PrescriptionSafetyReport]
                                          |
                +-------------------------+-------------------------+
                | (Không có cảnh báo)                               | (Phát hiện nguy cơ DDI/ICD)
                v                                                   v
   [Đơn thuốc an toàn - Màu xanh]                       [BẬT MODAL CẢNH BÁO MÀU ĐỎ]
   [Cho phép bấm Hoàn tất]                              [Mức độ: CRITICAL / MAJOR]
                                                        [Hiển thị cơ chế & khuyến cáo]
                                                                    |
                                                        [Bấm: "Gợi ý thuốc thay thế"]
                                                                    |
                                                        [Neo4j Cypher tìm thuốc thay thế]
                                                        [Loại trừ hoạt chất gây tương tác]
```

1. **Chọn thuốc vào đơn:**
   * Bác sĩ gõ tên biệt dược tại ô tìm kiếm (tìm kiếm từ kho thuốc `pharmacy_drugs`).
   * Chọn thuốc, nhập số lượng, đơn vị, liều dùng (ví dụ: *Ngày 2 lần, mỗi lần 1 viên sau ăn*).
2. **Kích hoạt tự động quét an toàn đơn thuốc (Safety Check):**
   * Ngay khi bác sĩ thêm từ 2 loại thuốc trở lên hoặc thêm thuốc mới vào đơn $\rightarrow$ *Frontend* tự động gửi `POST /api/prescriptions/safety-check`.
   * *Backend kết hợp 2 CSDL:*
     * **Kiểm tra dị ứng (MongoDB):** Đối chiếu hoạt chất thuốc vừa chọn với mảng `allergies[]` trong hồ sơ `PatientProfile`. Nếu trùng $\rightarrow$ Bật cảnh báo `ALLERGY_WARNING`.
     * **Quét tương tác thuốc đối kháng DDI (Neo4j):** Khởi chạy câu truy vấn Cypher duyệt qua quan hệ `[:INTERACTS_WITH]` giữa các hoạt chất trong đơn:
       ```cypher
       MATCH (a:ActiveIngredient)-[r:INTERACTS_WITH]-(b:ActiveIngredient)
       WHERE a.name IN $ingredients AND b.name IN $ingredients AND a.name < b.name
       RETURN a.name AS a, b.name AS b, r.severity AS severity, r.title AS title,
              r.mechanism AS mechanism, r.recommendation AS recommendation
       ```
     * **Kiểm tra chống chỉ định bệnh nền (Neo4j):** Duyệt qua quan hệ `[:CONTRAINDICATED_IN]` kết nối tới các mã ICD-10 đã chẩn đoán trong bệnh án:
       ```cypher
       MATCH (a:ActiveIngredient)-[r:CONTRAINDICATED_IN]->(s:Disease)
       WHERE a.name IN $ingredients AND any(code IN $icdCodes WHERE code = s.icdCode OR code STARTS WITH s.icdCode + '.')
       RETURN a.name AS ingredient, s.icdCode AS icdCode, r.reason AS reason
       ```
3. **Phản hồi giao diện và Đề xuất thay thế:**
   * Nếu có tương tác nguy hiểm (`CRITICAL` hoặc `MAJOR`): Bật hộp thoại cảnh báo khẩn cấp màu đỏ nêu rõ cơ chế (Ví dụ: *Aspirin + Warfarin: Nguy cơ xuất huyết tiêu hóa nghiêm trọng do ức chế kết tập tiểu cầu kết hợp kháng đông*).
   * Bác sĩ bấm nút "Gợi ý thuốc an toàn" $\rightarrow$ Backend chạy thuật toán Cypher tìm thuốc thuộc cùng phân nhóm điều trị `[:TREATS]` nhưng loại trừ các hoạt chất gây tương tác $\rightarrow$ Bác sĩ click chọn thuốc thay thế chỉ bằng 1 thao tác.
4. **Lưu đơn thuốc vào EMR:**
   * Sau khi đơn thuốc được xác nhận an toàn, các mục thuốc được ghi vào mảng nhúng `prescriptions[]` của bệnh án trên MongoDB.

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* **Test cặp tương tác điển hình:** Kê đồng thời *Aspirin* và *Clopidogrel* hoặc *Warfarin* $\rightarrow$ Modal cảnh báo DDI màu đỏ phải bật lên với đầy đủ thông tin cơ chế và khuyến cáo lâm sàng.
* **Test chống chỉ định ICD-10:** Chẩn đoán bệnh `K25` (Loét dạ dày) nhưng kê thuốc NSAID (*Ibuprofen*) $\rightarrow$ Phải cảnh báo chống chỉ định với bệnh loét dạ dày.
* **Test dị ứng:** Hồ sơ bệnh nhân có dị ứng *Amoxicillin*, bác sĩ kê thuốc chứa *Amoxicillin* $\rightarrow$ Phải báo động dị ứng thuốc.

---

# PHẦN IV: NHÓM CA SỬ DỤNG QUẢN TRỊ VIÊN (ADMIN)

---

### UC19: QUẢN LÝ TÀI KHOẢN VÀ PHÂN QUYỀN
* **Tác nhân:** Quản trị viên hệ thống (`ROLE_ADMIN`).
* **Mục tiêu:** Quản lý tài khoản nhân viên y tế (Bác sĩ, Lễ tân, Thu ngân, Admin); cấp phát vai trò RBAC; khóa/mở tài khoản; đặt lại mật khẩu và thanh tra lịch sử kiểm toán y tế (Audit Trail) trên Cassandra.
* **Tiền điều kiện:** Quản trị viên đã đăng nhập thành công.

#### Luồng xử lý chi tiết (Flowwork):
1. **Xem danh sách nhân sự:**
   * Truy cập `/admin/users`. Gọi `GET /api/admin/users`.
   * Lọc danh sách theo vai trò (`ROLE_DOCTOR`, `ROLE_RECEPTIONIST`, `ROLE_ADMIN`) và trạng thái (`ACTIVE`, `LOCKED`).
2. **Tạo tài khoản nhân viên mới:**
   * Bấm "Thêm nhân viên", nhập: Họ tên, Tên đăng nhập, Email, Chuyên khoa, Chức danh, Chọn vai trò RBAC.
   * *Backend:* Gửi `POST /api/admin/users`. Mật khẩu mặc định được băm qua BCrypt, lưu vào collection `staff_accounts` MongoDB.
3. **Phân quyền và Quản lý trạng thái:**
   * Thay đổi quyền hạn: Gọi `PUT /api/admin/users/{id}/permissions`.
   * Khóa tài khoản tạm thời: Gọi `PATCH /api/admin/users/{id}/toggle-status`. Khi tài khoản bị khóa, token đang lưu hành của tài khoản đó lập tức bị đẩy vào Redis Blacklist để thu hồi quyền truy cập tức thì.
4. **Thanh tra vết kiểm toán y tế (Cassandra Audit Trail):**
   * Truy cập `/admin/audit-logs`.
   * Gọi các API tra cứu trực tiếp trên Cassandra:
     * Theo thực thể: `GET /api/admin/audit-logs/entity?type=EMR&id=...` (Bảng `audit_logs_by_entity`).
     * Theo nhân sự: `GET /api/admin/audit-logs/actor?actorId=...&date=...` (Bảng `audit_logs_by_actor`).
     * Theo hành vi nhạy cảm: `GET /api/admin/audit-logs/action?action=LOCK_EMR&date=...` (Bảng `audit_logs_by_action`).

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* Khóa tài khoản nhân viên A $\rightarrow$ Nhân viên A đang mở trình duyệt thực hiện request tiếp theo phải bị đá văng ra màn hình đăng nhập (`401 Unauthorized`).
* Bác sĩ hoặc Lễ tân cố tình truy cập vào URL `/admin/users` $\rightarrow$ Phải bị chặn bởi `RoleGuard` ở Frontend và `SecurityFilterChain` ở Backend trả về `403 Forbidden`.

---

### UC20: QUẢN LÝ DANH MỤC THUỐC
* **Tác nhân:** Quản trị viên (`ROLE_ADMIN`).
* **Mục tiêu:** Quản lý danh mục biệt dược lưu hành tại phòng khám: Thêm mới, cập nhật giá nhập/bán, hàm lượng, hoạt chất và đồng bộ ánh xạ nút thuốc trên đồ thị Neo4j.
* **Tiền điều kiện:** Đã đăng nhập tài khoản Quản trị viên.

#### Luồng xử lý chi tiết (Flowwork):
1. **Xem danh mục biệt dược:** Truy cập `/admin/pharmacy/drugs`. Gọi `GET /api/admin/pharmacy/drugs`.
2. **Thêm biệt dược mới:**
   * Nhập: Mã thuốc (duy nhất), Tên thương mại, Hoạt chất chính, Hàm lượng/Quy cách, Đơn vị tính (Viên, Vỉ, Chai), Đường dùng, Đơn giá nhập, Đơn giá bán, Hạn sử dụng, Vị trí kệ kho.
   * *Backend:* Gọi `POST /api/admin/pharmacy/drugs`. Lưu vào MongoDB collection `pharmacy_drugs`. Đồng thời kiểm tra nếu trên Neo4j chưa có nút `:Drug` tương ứng thì tạo liên kết đồ thị tới nút `:ActiveIngredient`.
3. **Cập nhật đơn giá & Trạng thái:**
   * Điều chỉnh giá bán lẻ: Gọi `PATCH /api/admin/pharmacy/drugs/{id}/price`.
   * Ngừng kinh doanh thuốc: Gọi `PATCH /api/admin/pharmacy/drugs/{id}/toggle-status` $\rightarrow$ Thuốc chuyển sang `INACTIVE`, bác sĩ sẽ không thể tìm thấy thuốc này khi kê đơn ở UC18.

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* Nhập trùng mã thuốc `code` đã tồn tại $\rightarrow$ Báo lỗi trùng lặp Unique Index.
* Đơn giá bán không được nhỏ hơn đơn giá nhập.

---

### UC21: QUẢN LÝ TỒN KHO THUỐC
* **Tác nhân:** Quản trị viên (`ROLE_ADMIN`).
* **Mục tiêu:** Nhập kho thuốc theo lô, điều chỉnh tồn kho thực tế, cảnh báo thuốc dưới ngưỡng an toàn ($\le 10$ đơn vị) và cảnh báo thuốc sắp hết hạn dưới 90 ngày.
* **Tiền điều kiện:** Đã đăng nhập tài khoản Quản trị viên.

#### Luồng xử lý chi tiết (Flowwork):
1. **Theo dõi tồn kho tổng quát:**
   * Truy cập `/admin/pharmacy/inventory`.
   * Hệ thống hiển thị danh sách tồn kho khả dụng, giá trị tồn kho tổng cộng.
2. **Cảnh báo tồn kho nguy cơ (Low Stock & Expiry Alert):**
   * Gọi `GET /api/admin/pharmacy/drugs/low-stock?threshold=10`.
   * Lọc ra toàn bộ các biệt dược có số lượng tồn kho $\le 10$ đơn vị $\rightarrow$ Hiển thị badge đỏ `CẢNH BÁO HẾT THUỐC`.
   * Lọc các lô thuốc có ngày hết hạn cách ngày hiện tại $< 90\text{ ngày}$ $\rightarrow$ Hiển thị badge vàng `SẮP HẾT HẠN`.
3. **Nhập kho / Điều chỉnh kiểm kê:**
   * Quản trị viên tạo phiếu nhập kho: Chọn thuốc, số lượng nhập thêm, số lô (`batchNumber`), hạn sử dụng mới, lý do nhập $\rightarrow$ Gọi `POST /api/admin/pharmacy/drugs/{id}/stock`.
   * *Backend:* Tăng số lượng tồn kho trong `pharmacy_drugs` và ghi 1 bản ghi nhật ký biến động kho vào collection `stock_transactions` MongoDB.

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* Kiểm tra lịch sử giao dịch kho `stock_transactions`: Phải ghi nhận rõ người thực hiện, thời gian, số lượng thay đổi và số tồn sau biến động.
* Thu ngân thanh toán hóa đơn trừ kho $\rightarrow$ Số lượng tồn kho tại màn hình này phải tự động giảm tương ứng.

---

### UC22: QUẢN LÝ DANH MỤC DỊCH VỤ
* **Tác nhân:** Quản trị viên (`ROLE_ADMIN`).
* **Mục tiêu:** Thiết lập biểu giá và danh mục dịch vụ kỹ thuật cận lâm sàng (Xét nghiệm máu, Nước tiểu, Chụp X-quang, Siêu âm, Điện tâm đồ...).
* **Tiền điều kiện:** Đã đăng nhập tài khoản Quản trị viên.

#### Luồng xử lý chi tiết (Flowwork):
1. **Xem danh mục dịch vụ:** Truy cập `/admin/services`. Gọi `GET /api/admin/services`.
2. **Thêm / Cập nhật dịch vụ y tế:**
   * Nhập: Mã dịch vụ (`serviceCode`), Tên kỹ thuật cận lâm sàng, Chuyên khoa phụ trách, Phòng thực hiện, Đơn giá dịch vụ (`price` kiểu Decimal), Thời gian trả kết quả dự kiến.
   * *Backend:* Gọi `POST /api/admin/services` hoặc `PUT /api/admin/services/{id}` $\rightarrow$ Lưu vào collection `medical_services` MongoDB.
3. **Bật / Tắt dịch vụ:** Khi máy chụp X-quang bảo trì $\rightarrow$ Bấm tắt trạng thái dịch vụ $\rightarrow$ Bác sĩ tại buồng khám sẽ không chọn được dịch vụ này khi chỉ định ở UC16.

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* Đổi giá dịch vụ Xét nghiệm máu từ 100.000đ lên 120.000đ $\rightarrow$ Các ca chỉ định mới phải áp dụng giá 120.000đ, các hóa đơn cũ đã tạo trước đó vẫn giữ nguyên giá cũ 100.000đ (bảo đảm tính toàn vẹn lịch sử).

---

### UC23: QUẢN LÝ LỊCH LÀM VIỆC
* **Tác nhân:** Quản trị viên (`ROLE_ADMIN`).
* **Mục tiêu:** Phân bổ ca trực và buồng làm việc của các bác sĩ chuyên khoa theo từng ngày trong tuần; quản lý giới hạn số lượng bệnh nhân tối đa trong mỗi ca khám.
* **Tiền điều kiện:** Đã đăng nhập tài khoản Quản trị viên.

#### Luồng xử lý chi tiết (Flowwork):
1. **Xem bảng phân ca trực:** Truy cập `/admin/schedules`.
   * Hiển thị dạng lịch tuần/tháng. Gọi `GET /api/admin/schedules?date=...&doctorId=...`.
2. **Khởi tạo ca trực mới:**
   * Chọn Bác sĩ, Ngày làm việc, Ca trực (Ca sáng: 07:30 - 11:30, Ca chiều: 13:00 - 17:00), Buồng khám phân bổ (Phòng 101, Phòng 102), Số lượng bệnh nhân tối đa (ví dụ: `40 ca/buổi`).
   * *Backend:* Gửi `POST /api/admin/schedules`. Kiểm tra trùng lặp: Một bác sĩ không thể trực 2 buồng khám trong cùng 1 ca; một buồng khám không thể có 2 bác sĩ trực cùng 1 lúc.
   * Lưu vào collection `doctor_schedules` MongoDB.
3. **Khóa ca trực đột xuất:** Bác sĩ xin nghỉ phép đột xuất $\rightarrow$ Quản trị viên bấm "Khóa ca trực" $\rightarrow$ Hệ thống tự động hủy các slot còn trống trên Redis và gửi thông báo cho bệnh nhân đã đặt hẹn trước để dời lịch.

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* Thử xếp 2 bác sĩ vào cùng 1 buồng khám trong cùng 1 ca trực sáng $\rightarrow$ Hệ thống phải bắt lỗi xung đột buồng khám.
* Thử xếp 1 bác sĩ trực 2 ca cùng khung giờ ở 2 khoa khác nhau $\rightarrow$ Hệ thống bắt lỗi xung đột lịch bác sĩ.

---

### UC24: BÁO CÁO THỐNG KÊ
* **Tác nhân:** Quản trị viên (`ROLE_ADMIN`).
* **Mục tiêu:** Bảng điều khiển (Dashboard) thông minh tổng hợp theo thời gian thực về doanh thu tài chính, lưu lượng bệnh nhân theo khoa, bảng xếp hạng năng suất bác sĩ và xuất báo cáo tổng hợp ra file Excel.
* **Tiền điều kiện:** Đã đăng nhập tài khoản Quản trị viên.

#### Luồng xử lý chi tiết (Flowwork):
1. **Truy cập Dashboard điều hành:** Truy cập `/admin/dashboard`.
   * *Backend:* Gọi `GET /api/reports/dashboard` và `GET /api/billing/summary`.
2. **Tổng hợp dữ liệu đa nguồn:**
   * **Doanh thu viện phí (MongoDB Aggregation):** Thực thi đường ống Aggregation Pipeline trên collection `bills`:
     ```javascript
     db.bills.aggregate([
       { $match: { paymentStatus: "PAID", createdAt: { $gte: startOfMonth } } },
       { $group: {
           _id: null,
           totalRevenue: { $sum: "$totalAmount" },
           totalConsultation: { $sum: "$consultationFee" },
           totalMedicine: { $sum: "$medicineFee" },
           totalServices: { $sum: "$serviceFee" }
       }}
     ])
     ```
   * **Lưu lượng bệnh nhân theo khoa:** Thống kê từ collection `queue_tickets` theo `department`.
   * **Bảng xếp hạng năng suất Bác sĩ (Redis Sorted Set):** Truy vấn top 5 bác sĩ khám nhiều nhất tháng qua lệnh Redis `ZREVRANGE leaderboard:doctors:{yyyy-MM} 0 4 WITHSCORES` ($O(\log N)$).
3. **Kết xuất báo cáo Excel tổng hợp:**
   * Quản trị viên bấm "Xuất báo cáo tài chính tháng (.xlsx)".
   * *Backend:* Gọi `GET /api/reports/export`. Thư viện **Apache POI** sinh file bảng tính Excel gồm các sheet: Tổng hợp doanh thu, Chi tiết theo khoa, Danh mục thuốc tiêu thụ nhiều nhất.

#### Các góc nhìn kiểm thử (QA/Tester Focus):
* Đối chiếu số tiền tổng doanh thu trên Dashboard với tổng các hóa đơn `PAID` trong database MongoDB: số liệu phải trùng khớp $100\%$.
* Bác sĩ vừa hoàn tất 1 ca khám $\rightarrow$ Điểm số trên bảng xếp hạng Redis Leaderboard phải tăng ngay lập tức.

---

# PHẦN V: BẢN ĐỒ VÒNG ĐỜI TRẠNG THÁI THỰC THỂ (STATE MACHINES)
*(Dành riêng cho QA/Tester thiết lập ma trận kiểm thử trạng thái)*

### 1. Vòng đời Lịch hẹn (`AppointmentStatus`)
```text
[Khách chọn slot] -> (Redis Lock 10p)
                           |
                           v
                     [CONFIRMED] (Đã chốt lịch)
                           |
            +--------------+--------------+
            |                             |
            v                             v
      [CHECKED_IN]                   [CANCELLED]
   (Đã đến quầy tiếp đón)           (Bệnh nhân hủy hẹn)
```

### 2. Vòng đời Phiếu khám hàng đợi (`QueueStatus`)
```text
[Cấp số STT] -> [WAITING] (Đang chờ ở sảnh)
                     |
                     v
                 [CALLING] (Đang gọi vào phòng)
                     |
                     v
             [IN_CONSULTATION] (Đang ngồi khám với bác sĩ)
                     |
            +--------+--------+
            |                 | (Có chỉ định CLS)
            |                 v
            |         [WAITING_RESULTS] (Đi làm xét nghiệm)
            |                 |
            |                 v
            |         [RESULTS_READY] (Đã có kết quả - Ưu tiên gọi lại)
            |                 |
            +--------+--------+
                     |
                     v
                [COMPLETED] (Bác sĩ hoàn tất ca khám)
```

### 3. Vòng đời Hồ sơ bệnh án EMR (`MedicalRecord`)
```text
[Bác sĩ bắt đầu khám] -> [isLocked = false] (Được phép nhập/sửa sinh hiệu, chẩn đoán, thuốc)
                               |
                               v (Bác sĩ bấm "Khóa bệnh án")
                         [isLocked = true] (ĐÓNG BĂNG VĨNH VIỄN - Chỉ đọc)
                               |
                               +---> Sinh Hóa đơn tự động trong bills
                               +---> Ghi vết kiểm toán Cassandra Logged Batch
```

### 4. Vòng đời Hóa đơn viện phí (`PaymentStatus`)
```text
[Bệnh án khóa] -> [UNPAID] (Chờ bệnh nhân ra quầy thu ngân)
                      |
                      v (Thu tiền mặt hoặc Quét VietQR thành công)
                    [PAID] (Đã thanh toán)
                      |
                      +---> Kích hoạt $inc trừ tồn kho thuốc MongoDB
                      +---> Ghi vết giao dịch tài chính Cassandra
```
