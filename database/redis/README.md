# PHÂN HỆ REDIS (IN-MEMORY KEY-VALUE STORE)

> **Hệ CSDL**: Redis v7.0+  
> **Mô hình**: In-Memory Key-Value & Data Structures (String, List, Hash, ZSet)

---

## 1. VAI TRÒ TRONG HỆ THỐNG
Redis đóng vai trò là tầng đệm tốc độ cao (< 15 ms), giải quyết 3 bài toán lớn:
1. **Khóa chống đặt trùng slot lịch hẹn (Concurrency Booking Slot Lock)**: Đảm bảo hai bệnh nhân không thể cùng chọn một khung giờ của một bác sĩ tại cùng một thời điểm. Tự động giải phóng sau 10 phút (TTL = 600s) nếu chưa hoàn tất xác nhận.
2. **Hàng đợi khám bệnh thời gian thực (Realtime Queue FIFO)**: Quản lý hàng đợi tiếp nhận và gọi số thứ tự vào phòng khám.
3. **Bảo mật phiên & Thu hồi JWT (Blacklist)**: Thu hồi Access Token ngay khi người dùng đăng xuất.

---

## 2. QUY CHUẨN ĐẶT TÊN KEY VÀ CẤU TRÚC DỮ LIỆU

| Mục đích nghiệp vụ | Cấu trúc Key | Kiểu dữ liệu | TTL (Thời gian sống) | Lệnh thao tác chính |
|---|---|---|---|---|
| **Khóa giữ chỗ slot hẹn** | `slot:lock:{doctorId}:{date}:{timeSlot}` | `String` | 600 giây (10 phút) | `SET key "LOCKED_BY_USER_ID" NX EX 600`<br>`DEL key` |
| **Hàng đợi phòng khám (FIFO)** | `queue:room:{roomCode}:{date}` | `List` | 24 giờ | `RPUSH` (tiếp nhận), `LPOP` (gọi số), `LRANGE` (danh sách) |
| **Hàng đợi ưu tiên (Priority)** | `queue:priority:{roomCode}:{date}` | `Sorted Set (ZSET)` | 24 giờ | `ZADD` (điểm ưu tiên theo timestamp), `ZRANGE` |
| **Bộ đếm số thứ tự trong ngày** | `counter:ticket:{roomCode}:{date}` | `String` (Integer) | 24 giờ | `INCR key` (sinh STT tự động: 1, 2, 3...) |
| **Thu hồi JWT (Blacklist)** | `blacklist:jwt:{jti}` | `String` | Bằng thời gian sống JWT | `SET key "REVOKED" EX {remainingSeconds}` |
| **Session Cache người dùng** | `session:user:{userId}` | `Hash` | 7 ngày | `HSET`, `HGETALL` |
