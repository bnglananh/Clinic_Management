package vn.clinic.store;

import java.util.function.LongSupplier;

/** Bộ đếm số thứ tự theo phòng khám và theo ngày (Redis: {@code INCR counter:ticket:{prefix}:{date}}). */
public interface TicketCounter {

    /**
     * Lấy số tiếp theo. Nếu bộ đếm chưa tồn tại, khởi tạo bằng {@code initialValue} rồi mới tăng
     * (tránh trùng số với các phiếu đã có).
     */
    long next(String prefix, String date, LongSupplier initialValue);
}
