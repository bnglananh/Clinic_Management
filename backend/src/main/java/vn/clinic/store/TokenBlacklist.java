package vn.clinic.store;

import java.time.Duration;

/** Danh sách JWT đã thu hồi khi đăng xuất (Redis: {@code auth:blacklist:{jti}} với TTL = thời gian còn lại của token). */
public interface TokenBlacklist {

    void revoke(String jti, Duration remaining);

    boolean isRevoked(String jti);
}
