package vn.clinic.store;

import java.util.List;

/** Bảng xếp hạng (Redis Sorted Set: {@code ZINCRBY} / {@code ZREVRANGE ... WITHSCORES}). */
public interface Leaderboard {

    void increment(String board, String member, double delta);

    List<Entry> top(String board, int limit);

    record Entry(String member, double score) {
    }

    /** Bảng xếp hạng bác sĩ theo số lịch hẹn trong tháng, ví dụ {@code leaderboard:doctors:2026-10}. */
    static String doctorBookings(String yearMonth) {
        return "leaderboard:doctors:" + yearMonth;
    }
}
