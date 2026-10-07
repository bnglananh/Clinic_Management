# SMART CLINIC EMR – QUY TẮC NGHIỆP VỤ & ĐẶC TẢ USE CASES
> **Tài liệu kim chỉ nam: 24 Use Cases, 28 Business Rules & Ma trận phân quyền RBAC**  
> **Nguồn trích xuất**: `SRS_WEB_QUAN_LY_PHONG_KHAM_FINAL.docx`  
> **Dự án**: Smart Clinic EMR – Hệ thống Quản lý Phòng khám Thông minh  

---

## 1. MA TRẬN PHÂN QUYỀN 4 VAI TRÒ (RBAC MATRIX)

Hệ thống phân chia 4 vai trò rõ rệt, chỉ hiển thị màn hình và chức năng đúng quyền hạn:

| Mã UC | Tên Use Case | Bệnh nhân | Thu ngân / Lễ tân | Bác sĩ | Quản trị viên (Admin) |
|---|---|:---:|:---:|:---:|:---:|
| **UC01** | Quản lý tài khoản cá nhân | ✓ | | | |
| **UC02** | Đặt lịch hẹn trực tuyến | ✓ | | | |
| **UC03** | Quản lý lịch hẹn (dời / hủy) | ✓ | | | |
| **UC04** | Theo dõi lượt khám realtime | ✓ | | | |
| **UC05** | Tra cứu hồ sơ khám cá nhân | ✓ (Hồ sơ của mình) | | | |
| **UC06** | Tra cứu lịch sử khám bệnh | ✓ (Lịch sử của mình) | | | |
| **UC07** | Theo dõi hóa đơn viện phí | ✓ | | | |
| **UC08** | Nhận thông báo hệ thống | ✓ | | | |
| **UC09** | Tiếp nhận bệnh nhân & cấp số STT | | ✓ | | |
| **UC010** | Quản lý lịch hẹn phòng khám | | ✓ | | |
| **UC011** | Điều phối hàng đợi phòng khám | | ✓ | | |
| **UC012** | Quản lý hồ sơ bệnh nhân (CCCD, SĐT) | | ✓ | | |
| **UC013** | Quản lý hóa đơn & thanh toán VietQR / Tiền mặt | | ✓ | | |
| **UC014** | Quản lý khám bệnh (Sinh hiệu, Triệu chứng, ICD-10) | | | ✓ | |
| **UC015** | Quản lý hồ sơ bệnh án EMR (Khóa EMR, Phụ lục) | | | ✓ | |
| **UC016** | Chỉ định dịch vụ kỹ thuật / cận lâm sàng | | | ✓ | |
| **UC017** | Xem & đánh giá kết quả dịch vụ kỹ thuật | | | ✓ | |
| **UC018** | Quản lý đơn thuốc & Cảnh báo tương tác DDI | | | ✓ | |
| **UC019** | Quản lý tài khoản người dùng & phân quyền | | | | ✓ |
| **UC020** | Quản lý danh mục thuốc | | | | ✓ |
| **UC021** | Quản lý tồn kho thuốc & cảnh báo tồn $\le 10$ | | | | ✓ |
| **UC022** | Quản lý danh mục dịch vụ kỹ thuật & bảng giá | | | | ✓ |
| **UC023** | Quản lý phân ca & lịch làm việc bác sĩ | | | | ✓ |
| **UC024** | Báo cáo thống kê (Doanh thu, Lượt khám, Dược) | | | | ✓ |

---

## 2. DANH SÁCH 28 QUY TẮC NGHIỆP VỤ BẤT BIẾN (BUSINESS RULES: BR-01 ĐẾN BR-28)

- **BR-01**: Người dùng chỉ được sử dụng chức năng tương ứng với vai trò và quyền đã được cấp.
- **BR-02**: Bệnh nhân chỉ được xem và thao tác trên thông tin cá nhân, lịch hẹn và hồ sơ của chính mình.
- **BR-03**: Mỗi bệnh nhân có một mã định danh duy nhất (`patientCode`); hệ thống bắt buộc kiểm tra tính duy nhất (trùng CCCD hoặc SĐT) trước khi tạo mới hồ sơ.
- **BR-04**: Lịch hẹn bắt buộc phải có thông tin bệnh nhân, thời gian khám, chuyên khoa/bác sĩ và trạng thái hợp lệ.
- **BR-05**: Không cho phép đặt trùng khung giờ khi lịch làm việc hoặc sức chứa của bác sĩ/buồng khám đã đạt giới hạn (Redis Lock TTL = 10 phút chống xung đột đặt trùng).
- **BR-06**: Bệnh nhân đến trực tiếp (không hẹn trước) được tiếp nhận theo luồng khám vãng lai (Walk-in).
- **BR-07 (Quy tắc Hàng đợi duy nhất)**: Trạng thái lượt khám tuân theo đúng tiến trình:
  $$\text{WAITING (Chờ khám)} \longrightarrow \text{IN\_PROGRESS (Đang khám)} \longrightarrow \text{COMPLETED (Đã khám)}$$
  Chỉ người dùng có thẩm quyền mới được chuyển trạng thái.
- **BR-08**: Số thứ tự hàng đợi gắn liền với ngày khám và buồng khám, không được phép gây nhầm lẫn giữa các ca.
- **BR-09**: Dấu hiệu sinh tồn được ghi nhận phải gắn liền với đúng bệnh nhân, lượt khám và dấu thời gian (timestamp) lưu trữ vào Cassandra.
- **BR-10**: Chẩn đoán bệnh bắt buộc sử dụng danh mục và mã bệnh chuẩn quốc tế **ICD-10** (ví dụ: `I10` - Tăng huyết áp vô căn, `E11` - Đái tháo đường type 2).
- **BR-11**: Dịch vụ kỹ thuật được chỉ định phải thuộc danh mục đang hoạt động và có thông tin đơn giá/đơn vị tính hợp lệ.
- **BR-12 (Cảnh báo DDI)**: Khi kê đơn, hệ thống tự động kiểm tra cảnh báo tương tác thuốc đối kháng (Drug-Drug Interaction) dựa trên mạng lưới đồ thị tri thức trong Neo4j.
- **BR-13 (Cảnh báo Dị ứng)**: Banner cảnh báo tiền sử dị ứng thuốc/thực phẩm màu đỏ Burgundy bắt buộc phải hiển thị ở đầu hồ sơ khám cho bác sĩ nhận biết trước khi kê đơn.
- **BR-14**: Đơn thuốc hợp lệ bắt buộc phải có bệnh nhân, lượt khám, danh sách thuốc, số lượng, liều dùng và hướng dẫn sử dụng chi tiết.
- **BR-15**: Trước khi xác nhận đơn, hệ thống kiểm tra số lượng tồn khả dụng trong kho thuốc.
- **BR-16**: Hóa đơn viện phí được tự động tổng hợp từ 3 khoản phí hợp lệ:
  $$\text{Tổng tiền hóa đơn} = \text{Tiền khám} + \text{Tiền dịch vụ kỹ thuật} + \text{Tiền thuốc}$$
  Tuyệt đối không tự ý thêm khoản ngoài phạm vi nghiệp vụ.
- **BR-17**: Hỗ trợ 2 phương thức thanh toán: **Tiền mặt** hoặc **VietQR**.
- **BR-18**: Đối với thanh toán VietQR, hóa đơn chỉ chuyển sang trạng thái đã thanh toán sau khi thu ngân đối soát biến động số dư và xác nhận thủ công đã nhận tiền.
- **BR-19 (Quy tắc trừ kho)**: Chỉ khi hóa đơn chuyển sang trạng thái thanh toán thành công mới kích hoạt việc tự động trừ kho thuốc. Phải có cơ chế chống trừ kho lặp (Idempotent update).
- **BR-20**: Hủy hoặc hoàn tiền cần có quy trình và quyền riêng biệt của quản trị viên; không tự ý hoàn tồn kho thuốc nếu chưa có biên bản xử lý thuốc thực tế.
- **BR-21 (Cảnh báo tồn kho thấp)**: Hệ thống tự động phát sinh cảnh báo bổ sung dược phẩm khi số lượng tồn kho $\le 10$ đơn vị (hoặc ngưỡng cấu hình của Admin).
- **BR-22**: Mọi thao tác điều chỉnh số lượng tồn kho thuốc bắt buộc ghi nhận lý do, số lượng thay đổi, người thực hiện và dấu thời gian.
- **BR-23 (Khóa hồ sơ bệnh án EMR)**: Hồ sơ bệnh án đã ở trạng thái `COMPLETED` sẽ **bị khóa trực tiếp, không cho phép sửa đè hoặc xóa**. Mọi thay đổi sau đó chỉ được ghi nhận dưới dạng **phiên bản bổ sung / phụ lục**.
- **BR-24 (Không xóa vật lý danh mục)**: Danh mục thuốc hoặc dịch vụ kỹ thuật đã phát sinh giao dịch/lịch sử khám chỉ được chuyển cờ sang `Ngừng hoạt động / Ngừng kinh doanh`, tuyệt đối không xóa vật lý khỏi CSDL.
- **BR-25**: Thay đổi hoặc hủy lịch hẹn phải cập nhật trạng thái và bắn thông báo kịp thời cho bệnh nhân và bác sĩ liên quan.
- **BR-26**: Báo cáo thống kê chỉ tổng hợp dữ liệu trong phạm vi thời gian và quyền truy cập được cấp.
- **BR-27**: Dữ liệu đầu vào phải được kiểm tra định dạng, miền giá trị và trường bắt buộc trước khi lưu vào CSDL NoSQL.
- **BR-28 (Audit Log bất biến)**: Toàn bộ thao tác trọng yếu (đổi trạng thái khám, xác nhận thanh toán, điều chỉnh kho, cập nhật bệnh án) bắt buộc ghi vào nhật ký kiểm toán bất biến trên Cassandra (`medical_audit_logs`).

---

## 3. CHI TIẾT 24 USE CASES HỆ THỐNG

### Phân hệ 1: Bệnh nhân (Patient Portal)
1. **UC01 - Quản lý tài khoản cá nhân**: Xem và cập nhật họ tên, số điện thoại, địa chỉ, đổi mật khẩu bảo mật.
2. **UC02 - Đặt lịch hẹn trực tuyến**: Quy trình Stepper 4 bước: Chọn Chuyên khoa $\rightarrow$ Chọn Bác sĩ $\rightarrow$ Chọn Ngày/Khung giờ còn trống $\rightarrow$ Xác nhận đặt lịch (< 3 phút).
3. **UC03 - Quản lý lịch hẹn**: Xem danh sách lịch hẹn sắp tới, thực hiện Dời lịch hoặc Hủy lịch hẹn (chỉ cho phép trước khung giờ quy định và khi chưa check-in).
4. **UC04 - Theo dõi lượt khám**: Xem tiến trình hàng đợi khám trong ngày theo thời gian thực (số thứ tự, trạng thái `WAITING` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED`).
5. **UC05 - Tra cứu hồ sơ khám**: Xem chi tiết kết quả chẩn đoán, toa thuốc, dịch vụ kỹ thuật của từng lần thăm khám cá nhân.
6. **UC06 - Tra cứu lịch sử khám bệnh**: Bộ lọc nâng cao theo khoảng thời gian, theo chuyên khoa hoặc theo bác sĩ điều trị.
7. **UC07 - Theo dõi hóa đơn**: Xem chi tiết các khoản phí viện phí và trạng thái đã thanh toán / chưa thanh toán.
8. **UC08 - Nhận thông báo**: Nhận thông báo nhắc lịch khám, thông báo gọi số thứ tự và thông báo hóa đơn mới.

### Phân hệ 2: Tiếp tân & Thu ngân (Reception & Cashier)
9. **UC09 - Tiếp nhận bệnh nhân**: Tìm kiếm hồ sơ cũ hoặc tạo hồ sơ mới, xác nhận check-in cho khách có hẹn hoặc tiếp nhận khách vãng lai (Walk-in), cấp số thứ tự vào hàng đợi với trạng thái `WAITING`, hỗ trợ in phiếu K80.
10. **UC010 - Quản lý lịch hẹn**: Tạo mới, dời lịch, hủy hẹn theo yêu cầu bệnh nhân qua tổng đài hoặc tại quầy.
11. **UC011 - Quản lý hàng đợi**: Xem danh sách bệnh nhân chờ khám theo số thứ tự; điều phối đưa ca ưu tiên (cấp cứu, người già, trẻ nhỏ) lên vị trí đầu hàng đợi.
12. **UC012 - Quản lý hồ sơ bệnh nhân**: Tra cứu, cập nhật thông tin hành chính, CCCD, số điện thoại và ghi nhận tiền sử dị ứng thuốc ban đầu.
13. **UC013 - Quản lý hóa đơn & Thanh toán**: Tổng hợp chi phí tự động (tiền khám + dịch vụ + thuốc); thanh toán Tiền mặt (tự tính tiền thối) hoặc VietQR (hiển thị mã QR động, thu ngân đối soát và xác nhận đã nhận tiền); in biên lai viện phí; tự động kích hoạt trừ kho thuốc.

### Phân hệ 3: Bác sĩ (Doctor Clinical Workspace)
14. **UC014 - Quản lý khám bệnh**: Gọi bệnh nhân tiếp theo từ hàng đợi (chuyển sang `IN_PROGRESS`); ghi nhận 5 chỉ số sinh hiệu (Huyết áp, Mạch, Nhiệt độ, Chiều cao, Cân nặng $\rightarrow$ BMI); nhập triệu chứng cơ năng; chẩn đoán theo mã ICD-10; hoàn tất lượt khám (chuyển sang `COMPLETED`).
15. **UC015 - Quản lý hồ sơ bệnh án (EMR)**: Xem tóm tắt bệnh sử, tiền sử dị ứng; hồ sơ sau khi `COMPLETED` sẽ tự động khóa chỉnh sửa trực tiếp, hỗ trợ tạo phiên bản bổ sung / phụ lục nếu cần đính chính.
16. **UC016 - Chỉ định dịch vụ kỹ thuật**: Chọn các dịch vụ đơn giản (siêu âm, điện tâm đồ, xét nghiệm nhanh); bác sĩ trực tiếp thực hiện và nhập kết quả vào bệnh án.
17. **UC017 - Xem & đánh giá kết quả dịch vụ**: Xem chi tiết kết quả cận lâm sàng và ghi nhận kết luận y khoa vào hồ sơ bệnh án.
18. **UC018 - Quản lý đơn thuốc & Cảnh báo DDI**: Tìm kiếm và kê đơn thuốc; hệ thống tự động quét tương tác thuốc (DDI) qua Neo4j và hiển thị cảnh báo đỏ Burgundy bắt buộc bác sĩ xác nhận trước khi lưu đơn.

### Phân hệ 4: Quản trị viên (Admin Portal)
19. **UC019 - Quản lý tài khoản & phân quyền**: Tạo mới, chỉnh sửa thông tin, phân vai trò (RBAC) và khóa/mở khóa tài khoản nhân viên.
20. **UC020 - Quản lý danh mục thuốc**: Thêm mới, chỉnh sửa thông tin thuốc, chuyển trạng thái ngừng kinh doanh (không xóa vật lý).
21. **UC021 - Quản lý tồn kho thuốc**: Cập nhật số lượng nhập kho, theo dõi số lượng tồn kho theo thời gian thực; hiển thị cảnh báo đỏ cho các mặt hàng có tồn kho $\le 10$ đơn vị.
22. **UC022 - Quản lý danh mục dịch vụ**: Cập nhật danh mục dịch vụ khám, bảng giá và đơn vị tính.
23. **UC023 - Quản lý lịch làm việc bác sĩ**: Phân ca làm việc (Sáng / Chiều / Tối) theo bác sĩ và phòng khám chuyên khoa, kiểm soát xung đột trùng lịch.
24. **UC024 - Báo cáo thống kê**: Báo cáo tổng hợp doanh thu theo ngày/tháng/năm, báo cáo số lượt khám theo chuyên khoa/bác sĩ, báo cáo xuất nhập tồn dược phẩm.
