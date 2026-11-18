# TỔNG HỢP QUY TRÌNH KIỂM THỬ & SỐ LIỆU THỰC NGHIỆM - SMART CLINIC EMR
> **Mục đích:** Tài liệu tổng hợp đầy đủ các bước thực thi cho mọi loại hình kiểm thử (API, Bảo mật/RBAC, Tranh chấp đồng thời, Benchmark hiệu năng 4 CSDL NoSQL, E2E UI) cùng **số liệu đo đạc thực tế** trên máy chủ thử nghiệm, phục vụ trực tiếp cho việc viết **Chương 5 (Kiểm thử và Đánh giá hệ thống)** trong Báo cáo Đồ án.

---

## I. TỔNG QUAN CÁC LOẠI HÌNH KIỂM THỬ ĐÃ TRIỂN KHAI

| STT | Loại kiểm thử | Công cụ / Thư mục | Phạm vi kiểm thử | Trạng thái thực thi |
|:---:|:---|:---|:---|:---|
| **1** | **API, Bảo mật RBAC, IDOR & Concurrency** | Pytest + Requests (`tests/api/`) | 47 kịch bản tự động phủ 24 Use Case (UC01–UC24), bảo mật JWT, NoSQL Injection, IDOR, đa luồng | **Đã chạy: 47/47 PASSED (4.74s)** |
| **2** | **Kiểm thử API tương tác (Manual / Runner)** | Postman (`tests/SmartClinic_Postman_Collection.json`) | 23 API theo 5 nhóm luồng nghiệp vụ kèm Environment & Script tự động lưu Token | **Đã kiểm tra & xác nhận hoạt động** |
| **3** | **Đo hiệu năng 4 CSDL NoSQL (Benchmark)** | Python Drivers (`tests/benchmarks/`) | Đo Latency (Mean, p50, p95, p99) & Throughput (ops/s) trên Redis, MongoDB, Cassandra, Neo4j | **Đã chạy: Hoàn tất cả 4 CSDL Docker** |
| **4** | **Kiểm thử Giao diện & E2E** | Playwright TypeScript (`tests/e2e/`) | 6 file kịch bản (Desktop 1920px & Mobile 375px) phủ luồng Đặt lịch, Tiếp đón, Khám EMR, Thu ngân, Admin | **Đã xây dựng sẵn kịch bản** |

---

## II. CÁC BƯỚC THỰC HIỆN TỪNG LOẠI KIỂM THỬ

### 1. Kiểm thử API, Bảo mật & Tranh chấp đồng thời (`tests/api`)
* **Điều kiện:** Backend Spring Boot chạy tại `http://localhost:8080` kết nối 4 container Docker NoSQL.
* **Các bước thực hiện:**
  ```powershell
  cd tests/api
  pip install -r requirements.txt
  python -m pytest -v
  ```
* **Các lệnh lọc chạy theo chuyên đề:**
  * Chạy nhóm ưu tiên cao (Smoke P1): `python -m pytest -m p1 -v`
  * Chạy nhóm Bảo mật & Phân quyền: `python -m pytest -m "security or authorize" -v`
  * Chạy nhóm Tranh chấp đồng thời: `python -m pytest -m concurrency -v`
* **Kết quả thực nghiệm ghi nhận (47/47 PASSED trong 4.74 giây):**
  * **Concurrency (`test_concurrency.py`) — 3/3 PASSED:**
    * `TC-UC02-025`: 15 luồng đồng thời tranh 1 slot khám $\rightarrow$ Chỉ đúng 1 luồng khóa thành công qua Redis `SET NX EX`.
    * `TC-UC09-020`: 15 luồng lễ tân đồng thời cấp số thứ tự $\rightarrow$ 100% mã `ticketNumber` duy nhất, không trùng lặp.
    * `TC-UC01-036`: 5 luồng đăng ký song song cùng 1 SĐT $\rightarrow$ Chỉ đúng 1 tài khoản tạo thành công (`201`).
  * **Tài khoản, Bảo mật JWT & IDOR (`test_uc01_auth_profile.py`) — 13/13 PASSED:** Chặn token giả mạo chữ ký, token `alg=none`, token đã đăng xuất (Redis Blacklist), NoSQL Injection ở login, và IDOR giữa Bệnh nhân A và Bệnh nhân B.
  * **Đặt lịch, Dời/Hủy (`test_uc02_03_appointments.py`) — 5/5 PASSED:** Giữ chỗ/nhả chỗ slot, chặn đặt lịch ngày quá khứ (`400`), chặn Bệnh nhân B hủy lịch Bệnh nhân A (`403`).
  * **Cổng Bệnh nhân (`test_uc04_08_patient_portal.py`) — 7/7 PASSED:** Theo dõi hàng đợi, bệnh án, lịch sử sinh hiệu Cassandra, hóa đơn, thông báo; chặn IDOR xem bệnh án/hóa đơn người khác (`403`).
  * **Tiếp đón & Hàng đợi (`test_uc09_12_reception.py`) — 4/4 PASSED:** Walk-in check-in, in phiếu K80, promote ca ưu tiên, quản lý hồ sơ bệnh nhân.
  * **Thu ngân & Excel (`test_uc13_billing_reports.py`) — 4/4 PASSED:** Tạo mã VietQR động, thanh toán tiền mặt, chặn trả thiếu tiền (`400`), chặn thanh toán đúp, xuất báo cáo `.xlsx`.
  * **Bác sĩ, EMR & Neo4j (`test_uc14_18_doctor_emr.py`) — 5/5 PASSED:** Gọi số `IN_PROGRESS`, tạo và khóa bệnh án bất biến (`isLocked: true`), quét tương tác thuốc `ASP81 + Warfarin`, chống chỉ định `K25 + IBU400`, cảnh báo dị ứng `AMX500`.
  * **Quản trị (`test_uc19_24_admin.py`) — 6/6 PASSED:** Quản lý nhân sự, tra cứu Audit Log Cassandra, RBAC chặn quyền `403`, cảnh báo tồn kho thấp $\le 10$, dịch vụ cận lâm sàng, lịch trực, Dashboard.

#### Các lỗi thực tế phát hiện và khắc phục trong quá trình chạy kiểm thử API:
1. **Lỗi Race Condition đăng ký trùng SĐT (`LoginService.java`):** 5 luồng song song đều trả về `201` $\rightarrow$ Đã đồng bộ hóa theo SĐT (`synchronized (phone.intern())`).
2. **Lỗ hổng IDOR xem bệnh án, hóa đơn và hủy lịch hẹn của người khác:** Bệnh nhân A có thể xem dữ liệu/hủy lịch của Bệnh nhân B $\rightarrow$ Đã bổ sung kiểm tra quyền sở hữu `AccessChecks.requirePatientSelfOrStaff` tại `MedicalRecordController`, `BillingController`, `AppointmentController` và `PatientController`, kết hợp `GlobalExceptionHandler` trả về `403 Forbidden`.
3. **Bệnh nhân bị chặn xem lịch sử khám của chính mình (`SecurityConfig.java`):** Đã mở quyền xác thực cho `/api/patients/*/history` và kiểm soát IDOR theo `uid` trong JWT.
4. **Cho phép đặt lịch hẹn ở ngày quá khứ (`AppointmentServiceImpl.java`):** Đã bổ sung kiểm tra `LocalDate.isBefore(LocalDate.now())` trả lỗi `400 Bad Request`.

---

### 2. Kiểm thử API tương tác bằng Postman (`tests/SmartClinic_Postman_Collection.json`)
* **Các bước thực hiện:**
  1. Mở Postman $\rightarrow$ Bấm **Import** 2 file: `tests/SmartClinic_Postman_Collection.json` và `tests/SmartClinic_Postman_Environment.json`.
  2. Chọn Environment **`Smart Clinic Local Dev`** ở góc trên bên phải.
  3. Chạy lần lượt các nhóm `01` đến `05` hoặc bấm **Run Collection** để thực thi tự động 23 requests kèm Post-response Assertions.

---

### 3. Kiểm thử Hiệu năng 4 CSDL NoSQL (`tests/benchmarks`)
* **Điều kiện:** Cả 4 container Docker (`clinic-redis`, `clinic-mongodb`, `clinic-cassandra`, `clinic-neo4j`) đang chạy ở trạng thái `healthy`.
* **Các bước thực hiện:**
  ```powershell
  cd tests/benchmarks
  python run_all_benchmarks.py
  ```
* **Kết quả đo đạc thực tế trên máy chủ thử nghiệm (Ngày đo: `2026-11-18`):**

| CSDL | Tác vụ thực nghiệm | Số lần lặp | Mean (ms) | p50 (ms) | p95 (ms) | p99 (ms) | Thông lượng (ops/s) |
|:---|:---|---:|---:|---:|---:|---:|---:|
| **Redis 7.4** | `INCR` (Cấp số thứ tự) | 1.000 | **0.789** | 0.654 | 1.908 | 2.658 | 1.267,6 |
| **Redis 7.4** | `SET NX EX` (Khóa giữ chỗ slot) | 1.000 | **1.058** | 0.903 | 2.431 | 3.314 | 945,0 |
| **Redis 7.4** | `EXISTS` (Check JWT Blacklist) | 1.000 | **0.966** | 0.805 | 3.133 | 3.924 | 1.034,9 |
| **Redis 7.4** | Concurrent `INCR` (20 luồng song song) | 2.000 | **1.189** | - | - | - | 841,2 |
| **MongoDB 7.0** | Bulk Insert 2.000 EMR nhúng | 1 lô | **175.01** | - | - | - | 11.428,1 |
| **MongoDB 7.0** | Find EMR theo `_id` (`IXSCAN`) | 500 | **1.366** | 1.239 | 2.194 | 3.416 | 732,1 |
| **MongoDB 7.0** | Aggregation Pipeline (2.000 bills) | 100 | **4.391** | 4.197 | 4.886 | 8.211 | 227,7 |
| **Cassandra 4.1** | Write Time-series Sinh hiệu | 1.000 | **2.493** | 2.257 | 4.881 | 7.110 | 401,1 |
| **Cassandra 4.1** | Read 10 Sinh hiệu gần nhất $O(1)$ | 500 | **3.808** | 2.646 | 8.673 | 12.163 | 262,6 |
| **Cassandra 4.1** | `LOGGED BATCH` 3 bảng Audit Log | 300 | **3.235** | 2.950 | 4.881 | 7.081 | 309,1 |
| **Neo4j 5.26** | Cypher Quét DDI (5 hoạt chất) | 200 | **6.549** | 5.792 | 9.203 | 17.347 | 152,7 |
| **Neo4j 5.26** | Cypher Chống chỉ định ICD-10 | 200 | **5.517** | 4.803 | 6.296 | 17.397 | 181,3 |
| **Neo4j 5.26** | Cypher Gợi ý thuốc thay thế | 200 | **13.729** | 12.435 | 14.999 | 26.863 | 72,8 |

* **Kiểm tra MongoDB Explain Plan (Index vs Scan):**
  * Truy vấn theo Primary Index `_id` (`IXSCAN`): chỉ quét **1 document** trong **4 ms**.

---

### 4. Kiểm thử Giao diện & E2E với Playwright (`tests/e2e`)
* **Điều kiện:** Backend (`localhost:8080`) và Frontend Angular (`localhost:4200`) đang chạy.
* **Các bước thực hiện:**
  ```powershell
  cd tests/e2e
  npm install
  npx playwright install chromium
  npm test            # Chạy headless toàn bộ 6 file kịch bản (Desktop 1920px + Mobile 375px)
  npm run test:ui     # Chạy giao diện trực quan để quan sát từng bước click
  npm run report      # Mở báo cáo HTML
  ```

---

## III. BẢNG ĐỐI CHIẾU SO SÁNH KIẾN TRÚC POLYGLOT NOSQL VS. RDBMS TRUYỀN THỐNG
*(Số liệu cột Polyglot NoSQL trích xuất trực tiếp từ kết quả đo thực nghiệm trên hệ thống)*

| Tiêu chí / Tác vụ nghiệp vụ | Kết quả thực nghiệm Polyglot NoSQL (Đề tài) | Đặc tính khi dùng RDBMS nguyên khối truyền thống | Nhận xét & Đánh giá |
|:---|:---|:---|:---|
| **1. Khóa giữ chỗ slot & Cấp STT thời gian thực** | **Redis 7.4:** `INCR` đạt **0.789 ms**; `SET NX EX` đạt **1.058 ms** (p95 $< 2.5\text{ ms}$) hoàn toàn trên RAM. | Phải dùng `SELECT ... FOR UPDATE` hoặc khóa bảng (`LOCK TABLE`), tốn chi phí Disk I/O và dễ gây nghẽn/Deadlock khi nhiều người đặt cùng lúc. | Redis loại bỏ hoàn toàn tranh chấp đồng thời ở tầng ứng dụng với độ trễ dưới $2\text{ ms}$. |
| **2. Đọc hồ sơ bệnh án EMR đa thành phần** | **MongoDB 7.0:** Đọc 1 Document nhúng đầy đủ (sinh hiệu, ICD-10, CLS, đơn thuốc) đạt **1.366 ms** (p95 **2.194 ms**). | Phải thực hiện phép nối (`JOIN`) qua 5–6 bảng chuẩn hóa (`medical_records`, `vitals`, `diagnoses`, `prescriptions`, `service_orders`). | Mô hình tài liệu nhúng cho phép lấy toàn bộ bệnh án trong 1 lần truy vấn duy nhất, linh hoạt theo từng chuyên khoa. |
| **3. Ghi chuỗi thời gian sinh hiệu & Audit Trail** | **Cassandra 4.1:** Ghi 1.000 dòng sinh hiệu đạt **2.493 ms/dòng**; ghi đồng bộ 3 bảng Audit Log qua `LOGGED BATCH` đạt **3.235 ms**; đọc 10 lần đo gần nhất đạt **3.808 ms**. | Khi bảng log và sinh hiệu phình to hàng triệu dòng, việc cập nhật chỉ mục B-Tree khi `INSERT` làm giảm tốc độ ghi và gây phân mảnh đĩa. | Cơ chế ghi tuần tự Append-only vào CommitLog/Memtable và mô hình Query-First giúp giữ tốc độ đọc/ghi ổn định $O(1)$. |
| **4. Quét tương tác thuốc DDI & Chống chỉ định** | **Neo4j 5.26:** Quét DDI 5 hoạt chất chỉ **6.549 ms**; kiểm tra chống chỉ định ICD-10 **5.517 ms**; gợi ý thuốc thay thế **13.729 ms**. | Phải thực hiện nhiều phép Self-JOIN và JOIN đệ quy qua các bảng trung gian n-n, chi phí tăng nhanh theo độ sâu quan hệ. | Công nghệ *Index-Free Adjacency* duyệt trực tiếp con trỏ nút kề giúp giữ độ phức tạp $O(k)$ ổn định dưới $15\text{ ms}$. |
