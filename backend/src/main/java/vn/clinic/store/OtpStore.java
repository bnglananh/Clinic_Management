package vn.clinic.store;

import java.time.Duration;
import java.util.Optional;

/** Lưu mã OTP có thời hạn (Redis: hash {@code otp:reset:{email}} + EXPIRE). */
public interface OtpStore {

    void save(String email, String code, Duration ttl);

    Optional<OtpRecord> find(String email);

    /** Tăng số lần nhập sai và trả về giá trị mới. */
    int incrementFailedAttempts(String email);

    void delete(String email);

    record OtpRecord(String code, int failedAttempts) {
    }
}
