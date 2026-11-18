# HỆ THỐNG KIỂM THỬ TỰ ĐỘNG - SMART CLINIC EMR

Thư mục `tests/` được tổ chức theo mô hình chuẩn 2 tầng Automation (`API/DB/Concurrency` + `UI/E2E`) dựa trên 519 Test Cases trong [SmartClinic_TestCases.xlsx](./SmartClinic_TestCases.xlsx) và 24 Use Cases trong [PhanTichNghiepVu.md](./PhanTichNghiepVu.md).

---

## 1. CẤU TRÚC THƯ MỤC CHUẨN

```text
tests/
├── README.md                              # Tài liệu hướng dẫn chạy và quản lý suite
├── BAO_CAO_KET_QUA_KIEM_THU.md            # Tổng hợp quy trình test, số liệu đo đạc & bảng đối chiếu viết Chương 5
├── SmartClinic_TestCases.xlsx             # Bộ 519 Test Cases (Tổng hợp, Chi tiết, Hướng dẫn)
├── SmartClinic_Postman_Collection.json    # Bộ 23 API test cases import vào Postman
├── SmartClinic_Postman_Environment.json   # Biến môi trường Postman
├── PhanTichNghiepVu.md                    # Tài liệu đặc tả luồng nghiệp vụ 24 Use Case
├── strategy/                              # Tài liệu chiến lược kiểm thử chi tiết
│
├── benchmarks/                            # ĐO HIỆU NĂNG 4 CSDL NOSQL (Python Drivers)
│   ├── run_all_benchmarks.py              # Script chạy tổng hợp & xuất benchmark_results.md/.json
│   ├── bench_redis.py                     # Đo INCR, SET NX EX, Blacklist, Concurrent 20 luồng
│   ├── bench_mongodb.py                   # Đo Bulk Insert, Find IXSCAN, Aggregation Pipeline
│   ├── bench_cassandra.py                 # Đo Write Time-series, Read O(1), LOGGED BATCH
│   ├── bench_neo4j.py                     # Đo Cypher DDI, ICD-10, Gợi ý thuốc thay thế
│   └── benchmark_results.md               # Bảng số liệu đo đạc thực tế trên Docker
│
├── api/                                   # TẦNG 1: API, RBAC, Security, DB & Concurrency (Pytest)
│   ├── pytest.ini                         # Định nghĩa markers: p1, p2, security, authorize, uc01..uc24
│   ├── requirements.txt                   # Thư viện Python (pytest, requests, pymongo, redis...)
│   ├── conftest.py                        # Fixtures đăng nhập 4 vai trò & BN A/B cho IDOR
│   ├── utils/                             # Helper client, sinh dữ liệu test & DB verifier
│   ├── test_uc01_auth_profile.py          # UC01: Register, Login, OTP, Blacklist, JWT, NoSQLi, IDOR
│   ├── test_uc02_03_appointments.py       # UC02 & UC03: Slot Lock Redis, Đặt/Dời/Hủy lịch hẹn
│   ├── test_uc04_08_patient_portal.py     # UC04..UC08: Queue, EMR, Vitals, Billing, Notifications
│   ├── test_uc09_12_reception.py          # UC09..UC12: Check-in, Cấp STT, Promote, Hồ sơ BN
│   ├── test_uc13_billing_reports.py       # UC13: Cash, VietQR, $inc, Excel Export
│   ├── test_uc14_18_doctor_emr.py         # UC14..UC18: Call-next, EMR Lock, Neo4j DDI & ICD-10
│   ├── test_uc19_24_admin.py              # UC19..UC24: Users/RBAC, Thuốc, Tồn kho, Dịch vụ, Lịch, Dashboard
│   └── test_concurrency.py                # Race Condition: Song song slot-locks, INCR STT, đăng ký
│
└── e2e/                                   # TẦNG 2: UI & End-to-End Automation (Playwright TypeScript)
    ├── package.json
    ├── playwright.config.ts               # Cấu hình Chrome Desktop (1920px) & Mobile (375px)
    ├── fixtures/                          # Helper đăng nhập UI dùng chung
    └── specs/                             # 6 bộ kịch bản E2E theo từng phân hệ
        ├── 01_patient_auth_booking.spec.ts
        ├── 02_reception_queue_lcd.spec.ts
        ├── 03_doctor_emr_ddi.spec.ts
        ├── 04_billing_vietqr_excel.spec.ts
        ├── 05_admin_operations.spec.ts
        └── 06_ui_responsive_nav.spec.ts
```

---

## 2. HƯỚNG DẪN CHẠY KIỂM THỬ

> ⚠️ **Điều kiện tiên quyết:** Đảm bảo Backend (`http://localhost:8080`) và Frontend (`http://localhost:4200`) đang chạy trước khi thực thi test.

### A. Chạy API, Security & Concurrency Tests (`tests/api`)
1. Di chuyển vào thư mục `tests/api` và cài đặt thư viện (nếu chưa cài):
   ```powershell
   cd tests/api
   pip install -r requirements.txt
   ```
2. Chạy toàn bộ API test suite:
   ```powershell
   pytest
   ```
3. Chạy lọc theo mức độ ưu tiên hoặc loại test (markers):
   ```powershell
   # Chạy nhóm Smoke / Critical (P1)
   pytest -m p1

   # Chỉ chạy các test Bảo mật & Phân quyền (JWT, NoSQLi, IDOR, RBAC)
   pytest -m "security or authorize"

   # Chỉ chạy test Tranh chấp đồng thời (Race Condition)
   pytest -m concurrency

   # Chạy riêng theo từng Use Case (ví dụ UC02 hoặc UC18 Neo4j)
   pytest -m uc02
   pytest -m uc18

   # Xuất báo cáo HTML trực quan
   pytest --html=api_report.html --self-contained-html
   ```

---

### B. Chạy E2E & UI Tests bằng Playwright (`tests/e2e`)
1. Di chuyển vào thư mục `tests/e2e` và cài đặt Playwright:
   ```powershell
   cd tests/e2e
   npm install
   npx playwright install chromium
   ```
2. Chạy các kịch bản kiểm thử:
   ```powershell
   # Chạy chế độ ngầm (Headless) toàn bộ E2E
   npm test

   # Chạy có giao diện trình duyệt trực quan (UI Mode - Khuyên dùng để debug/demo)
   npm run test:ui

   # Xem lại báo cáo HTML kèm ảnh chụp lỗi & trace
   npm run report
   ```
