package vn.clinic.store.memory;

import org.springframework.stereotype.Component;
import vn.clinic.config.StorageMode;
import vn.clinic.store.Leaderboard;
import vn.clinic.store.OtpStore;
import vn.clinic.store.SlotLockStore;
import vn.clinic.store.TicketCounter;
import vn.clinic.store.TokenBlacklist;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.LongSupplier;

/** Bản thay thế Redis lưu trong RAM – chỉ dùng cho unit test và profile "memory". */
public final class InMemoryStores {

    private InMemoryStores() {
    }

    private record Expiring<T>(T value, Instant expiresAt) {
        boolean expired() {
            return expiresAt != null && Instant.now().isAfter(expiresAt);
        }
    }

    @Component
    @StorageMode.Memory
    public static class InMemoryOtpStore implements OtpStore {
        private final Map<String, Expiring<OtpRecord>> data = new ConcurrentHashMap<>();

        private static String key(String email) {
            return email.trim().toLowerCase();
        }

        @Override
        public void save(String email, String code, Duration ttl) {
            data.put(key(email), new Expiring<>(new OtpRecord(code, 0), Instant.now().plus(ttl)));
        }

        @Override
        public Optional<OtpRecord> find(String email) {
            Expiring<OtpRecord> e = data.get(key(email));
            if (e == null) return Optional.empty();
            if (e.expired()) {
                data.remove(key(email));
                return Optional.empty();
            }
            return Optional.of(e.value());
        }

        @Override
        public int incrementFailedAttempts(String email) {
            Expiring<OtpRecord> e = data.computeIfPresent(key(email), (k, old) ->
                    new Expiring<>(new OtpRecord(old.value().code(), old.value().failedAttempts() + 1), old.expiresAt()));
            return e == null ? 0 : e.value().failedAttempts();
        }

        @Override
        public void delete(String email) {
            data.remove(key(email));
        }
    }

    @Component
    @StorageMode.Memory
    public static class InMemorySlotLockStore implements SlotLockStore {
        private final Map<String, Expiring<String>> locks = new ConcurrentHashMap<>();

        private Optional<Expiring<String>> live(String key) {
            Expiring<String> e = locks.get(key);
            if (e != null && e.expired()) {
                locks.remove(key);
                return Optional.empty();
            }
            return Optional.ofNullable(e);
        }

        @Override
        public synchronized boolean tryLock(String doctorId, String date, String timeSlot, String ownerId, Duration ttl) {
            String key = SlotLockStore.key(doctorId, date, timeSlot);
            Optional<Expiring<String>> current = live(key);
            if (current.isPresent() && !current.get().value().equals(ownerId)) return false;
            locks.put(key, new Expiring<>(ownerId, Instant.now().plus(ttl)));
            return true;
        }

        @Override
        public Optional<String> currentOwner(String doctorId, String date, String timeSlot) {
            return live(SlotLockStore.key(doctorId, date, timeSlot)).map(Expiring::value);
        }

        @Override
        public long remainingSeconds(String doctorId, String date, String timeSlot) {
            return live(SlotLockStore.key(doctorId, date, timeSlot))
                    .map(e -> Math.max(0, Duration.between(Instant.now(), e.expiresAt()).toSeconds()))
                    .orElse(-1L);
        }

        @Override
        public synchronized void release(String doctorId, String date, String timeSlot, String ownerId) {
            String key = SlotLockStore.key(doctorId, date, timeSlot);
            live(key).filter(e -> e.value().equals(ownerId)).ifPresent(e -> locks.remove(key));
        }
    }

    @Component
    @StorageMode.Memory
    public static class InMemoryTicketCounter implements TicketCounter {
        private final Map<String, Long> counters = new ConcurrentHashMap<>();

        @Override
        public long next(String prefix, String date, LongSupplier initialValue) {
            return counters.compute(prefix + ":" + date,
                    (k, v) -> (v == null ? initialValue.getAsLong() : v) + 1);
        }
    }

    @Component
    @StorageMode.Memory
    public static class InMemoryLeaderboard implements Leaderboard {
        private final Map<String, Map<String, Double>> boards = new ConcurrentHashMap<>();

        @Override
        public void increment(String board, String member, double delta) {
            boards.computeIfAbsent(board, b -> new ConcurrentHashMap<>()).merge(member, delta, Double::sum);
        }

        @Override
        public List<Entry> top(String board, int limit) {
            return boards.getOrDefault(board, Map.of()).entrySet().stream()
                    .map(e -> new Entry(e.getKey(), e.getValue()))
                    .sorted(Comparator.comparingDouble(Entry::score).reversed())
                    .limit(limit)
                    .toList();
        }
    }

    @Component
    @StorageMode.Memory
    public static class InMemoryTokenBlacklist implements TokenBlacklist {
        private final Map<String, Instant> revoked = new ConcurrentHashMap<>();

        @Override
        public void revoke(String jti, Duration remaining) {
            if (jti != null && !remaining.isNegative()) revoked.put(jti, Instant.now().plus(remaining));
        }

        @Override
        public boolean isRevoked(String jti) {
            Instant until = jti == null ? null : revoked.get(jti);
            if (until == null) return false;
            if (Instant.now().isAfter(until)) {
                revoked.remove(jti);
                return false;
            }
            return true;
        }
    }
}
