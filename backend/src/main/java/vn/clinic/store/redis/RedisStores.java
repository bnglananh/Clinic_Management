package vn.clinic.store.redis;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;
import vn.clinic.config.StorageMode;
import vn.clinic.store.Leaderboard;
import vn.clinic.store.OtpStore;
import vn.clinic.store.SlotLockStore;
import vn.clinic.store.TicketCounter;
import vn.clinic.store.TokenBlacklist;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.LongSupplier;

/**
 * Các kho dữ liệu tạm thời trên Redis. Mỗi nhóm key có một tiền tố riêng:
 * <pre>
 *   otp:reset:{email}                         HASH  {code, failedAttempts}   TTL 300s
 *   slot:lock:{doctorId}:{date}:{slot}        STRING owner                   TTL 600s
 *   counter:ticket:{prefix}:{date}            STRING số nguyên (INCR)        TTL 36h
 *   leaderboard:doctors:{yyyy-MM}             ZSET  member=bác sĩ, score=số lịch hẹn  TTL 400 ngày
 *   auth:blacklist:{jti}                      STRING "1"                     TTL = thời gian còn lại của JWT
 * </pre>
 */
public final class RedisStores {

    private RedisStores() {
    }

    @Component
    @StorageMode.NoSql
    public static class RedisOtpStore implements OtpStore {

        private final StringRedisTemplate redis;

        public RedisOtpStore(StringRedisTemplate redis) {
            this.redis = redis;
        }

        private static String key(String email) {
            return "otp:reset:" + email.trim().toLowerCase();
        }

        @Override
        public void save(String email, String code, Duration ttl) {
            String key = key(email);
            redis.delete(key);
            redis.opsForHash().putAll(key, Map.of("code", code, "failedAttempts", "0"));
            redis.expire(key, ttl);
        }

        @Override
        public Optional<OtpRecord> find(String email) {
            Map<Object, Object> hash = redis.opsForHash().entries(key(email));
            if (hash.isEmpty() || hash.get("code") == null) return Optional.empty();
            int attempts = Integer.parseInt(Objects.toString(hash.getOrDefault("failedAttempts", "0")));
            return Optional.of(new OtpRecord(hash.get("code").toString(), attempts));
        }

        @Override
        public int incrementFailedAttempts(String email) {
            Long value = redis.opsForHash().increment(key(email), "failedAttempts", 1);
            return value == null ? 0 : value.intValue();
        }

        @Override
        public void delete(String email) {
            redis.delete(key(email));
        }
    }

    @Component
    @StorageMode.NoSql
    public static class RedisSlotLockStore implements SlotLockStore {

        /** Chỉ xóa khóa khi đúng người đang giữ (so sánh và xóa nguyên tử). */
        private static final DefaultRedisScript<Long> RELEASE_IF_OWNER = new DefaultRedisScript<>(
                "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end",
                Long.class);

        private final StringRedisTemplate redis;

        public RedisSlotLockStore(StringRedisTemplate redis) {
            this.redis = redis;
        }

        @Override
        public boolean tryLock(String doctorId, String date, String timeSlot, String ownerId, Duration ttl) {
            String key = SlotLockStore.key(doctorId, date, timeSlot);
            Boolean acquired = redis.opsForValue().setIfAbsent(key, ownerId, ttl);
            if (Boolean.TRUE.equals(acquired)) return true;
            if (ownerId.equals(redis.opsForValue().get(key))) {
                redis.expire(key, ttl); // gia hạn khi chính người đó chọn lại
                return true;
            }
            return false;
        }

        @Override
        public Optional<String> currentOwner(String doctorId, String date, String timeSlot) {
            return Optional.ofNullable(redis.opsForValue().get(SlotLockStore.key(doctorId, date, timeSlot)));
        }

        @Override
        public long remainingSeconds(String doctorId, String date, String timeSlot) {
            Long ttl = redis.getExpire(SlotLockStore.key(doctorId, date, timeSlot));
            return ttl == null || ttl < 0 ? -1 : ttl;
        }

        @Override
        public void release(String doctorId, String date, String timeSlot, String ownerId) {
            redis.execute(RELEASE_IF_OWNER, List.of(SlotLockStore.key(doctorId, date, timeSlot)), ownerId);
        }
    }

    @Component
    @StorageMode.NoSql
    public static class RedisTicketCounter implements TicketCounter {

        private static final Duration TTL = Duration.ofHours(36);
        private final StringRedisTemplate redis;

        public RedisTicketCounter(StringRedisTemplate redis) {
            this.redis = redis;
        }

        @Override
        public long next(String prefix, String date, LongSupplier initialValue) {
            String key = "counter:ticket:" + prefix + ":" + date;
            if (Boolean.FALSE.equals(redis.hasKey(key))) {
                redis.opsForValue().setIfAbsent(key, String.valueOf(initialValue.getAsLong()), TTL);
            }
            Long value = redis.opsForValue().increment(key);
            return value == null ? initialValue.getAsLong() + 1 : value;
        }
    }

    @Component
    @StorageMode.NoSql
    public static class RedisLeaderboard implements Leaderboard {

        private static final Duration TTL = Duration.ofDays(400);
        private final StringRedisTemplate redis;

        public RedisLeaderboard(StringRedisTemplate redis) {
            this.redis = redis;
        }

        @Override
        public void increment(String board, String member, double delta) {
            redis.opsForZSet().incrementScore(board, member, delta);
            redis.expire(board, TTL);
        }

        @Override
        public List<Entry> top(String board, int limit) {
            Set<ZSetOperations.TypedTuple<String>> tuples =
                    redis.opsForZSet().reverseRangeWithScores(board, 0, Math.max(0, limit - 1));
            List<Entry> result = new ArrayList<>();
            if (tuples != null) {
                for (ZSetOperations.TypedTuple<String> t : tuples) {
                    result.add(new Entry(t.getValue(), t.getScore() == null ? 0 : t.getScore()));
                }
            }
            return result;
        }
    }

    @Component
    @StorageMode.NoSql
    public static class RedisTokenBlacklist implements TokenBlacklist {

        private final StringRedisTemplate redis;

        public RedisTokenBlacklist(StringRedisTemplate redis) {
            this.redis = redis;
        }

        @Override
        public void revoke(String jti, Duration remaining) {
            if (jti == null || remaining.isNegative() || remaining.isZero()) return;
            redis.opsForValue().set("auth:blacklist:" + jti, "1", remaining);
        }

        @Override
        public boolean isRevoked(String jti) {
            return jti != null && Boolean.TRUE.equals(redis.hasKey("auth:blacklist:" + jti));
        }
    }
}
