package vn.clinic.store;

import java.time.Duration;
import java.util.Optional;

/**
 * Khóa giữ chỗ khung giờ khám trong lúc bệnh nhân hoàn tất đặt lịch
 * (Redis: {@code SET slot:lock:{doctorId}:{date}:{slot} owner NX EX 600}).
 */
public interface SlotLockStore {

    /** Giữ chỗ nếu slot đang trống hoặc đã do chính owner giữ. Trả về false nếu người khác đang giữ. */
    boolean tryLock(String doctorId, String date, String timeSlot, String ownerId, Duration ttl);

    Optional<String> currentOwner(String doctorId, String date, String timeSlot);

    /** Số giây còn lại của khóa, -1 nếu không có khóa. */
    long remainingSeconds(String doctorId, String date, String timeSlot);

    /** Nhả khóa nếu đúng owner đang giữ. */
    void release(String doctorId, String date, String timeSlot, String ownerId);

    static String key(String doctorId, String date, String timeSlot) {
        return "slot:lock:" + doctorId + ":" + date + ":" + timeSlot.replace(" ", "");
    }
}
