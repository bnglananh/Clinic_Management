import time
import statistics
from concurrent.futures import ThreadPoolExecutor
import redis


def _stats(name: str, latencies_ms: list[float]) -> dict:
    s = sorted(latencies_ms)
    n = len(s)
    mean_ms = statistics.mean(s)
    p50 = s[int(0.50 * (n - 1))]
    p95 = s[int(0.95 * (n - 1))]
    p99 = s[int(0.99 * (n - 1))]
    ops_sec = 1000.0 / mean_ms if mean_ms > 0 else 0.0
    return {
        "database": "Redis 7.4",
        "operation": name,
        "iterations": n,
        "mean_ms": round(mean_ms, 3),
        "p50_ms": round(p50, 3),
        "p95_ms": round(p95, 3),
        "p99_ms": round(p99, 3),
        "ops_sec": round(ops_sec, 1),
    }


def run_redis_benchmarks(host: str = "localhost", port: int = 6379, n_ops: int = 1000) -> list[dict]:
    r = redis.Redis(host=host, port=port, decode_responses=True)
    r.ping()
    results = []

    # Warm-up
    for _ in range(50):
        r.ping()

    # 1. Atomic INCR (Cấp số thứ tự)
    lat_incr = []
    for _ in range(n_ops):
        t0 = time.perf_counter()
        r.incr("bench:counter:ticket:A:20261118")
        lat_incr.append((time.perf_counter() - t0) * 1000.0)
    results.append(_stats("INCR (Cấp số thứ tự)", lat_incr))

    # 2. Distributed Lock SET NX EX (Giữ chỗ slot 10 phút)
    lat_lock = []
    for i in range(n_ops):
        t0 = time.perf_counter()
        r.set(f"bench:slot:lock:{i}", "patient-bench", nx=True, ex=600)
        lat_lock.append((time.perf_counter() - t0) * 1000.0)
    results.append(_stats("SET NX EX (Khóa slot)", lat_lock))

    # 3. Blacklist Lookup EXISTS (Kiểm tra JWT Blacklist)
    r.set("bench:auth:blacklist:sample-jti", "1", ex=600)
    lat_bl = []
    for _ in range(n_ops):
        t0 = time.perf_counter()
        r.exists("bench:auth:blacklist:sample-jti")
        lat_bl.append((time.perf_counter() - t0) * 1000.0)
    results.append(_stats("EXISTS (Check JWT Blacklist)", lat_bl))

    # 4. Concurrent Throughput (20 threads x 100 INCR)
    def worker(cnt: int):
        local_r = redis.Redis(host=host, port=port, decode_responses=True)
        for _ in range(cnt):
            local_r.incr("bench:counter:concurrent")

    t_start = time.perf_counter()
    with ThreadPoolExecutor(max_workers=20) as pool:
        for _ in range(20):
            pool.submit(worker, 100)
    total_sec = time.perf_counter() - t_start
    total_ops = 2000
    results.append({
        "database": "Redis 7.4",
        "operation": "Concurrent INCR (20 luồng)",
        "iterations": total_ops,
        "mean_ms": round((total_sec * 1000.0) / total_ops, 3),
        "p50_ms": "-",
        "p95_ms": "-",
        "p99_ms": "-",
        "ops_sec": round(total_ops / total_sec, 1),
    })

    # Cleanup
    keys = r.keys("bench:*")
    if keys:
        r.delete(*keys)

    return results
