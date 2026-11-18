import time
import statistics
from datetime import datetime, date, timezone, timedelta
from cassandra.cluster import Cluster
from cassandra.io.asyncioreactor import AsyncioConnection
from cassandra.query import BatchStatement, BatchType
from cassandra.util import uuid_from_time


def _stats(name: str, latencies_ms: list[float]) -> dict:
    s = sorted(latencies_ms)
    n = len(s)
    mean_ms = statistics.mean(s)
    return {
        "database": "Cassandra 4.1",
        "operation": name,
        "iterations": n,
        "mean_ms": round(mean_ms, 3),
        "p50_ms": round(s[int(0.50 * (n - 1))], 3),
        "p95_ms": round(s[int(0.95 * (n - 1))], 3),
        "p99_ms": round(s[int(0.99 * (n - 1))], 3),
        "ops_sec": round(1000.0 / mean_ms if mean_ms > 0 else 0.0, 1),
    }


def run_cassandra_benchmarks(host: str = "localhost", keyspace: str = "clinic_keyspace") -> list[dict]:
    cluster = Cluster([host], connection_class=AsyncioConnection)
    session = cluster.connect(keyspace)
    results = []

    bench_pat = "BENCH-PAT-01"
    bench_actor = "bench-actor"
    bench_action = "BENCH_ACTION"
    today = date(2026, 11, 18)

    # Prepared statements khớp 100% với CassandraStores.java
    ins_vital = session.prepare("""
        INSERT INTO patient_vital_signs (
            patient_id, recorded_at, visit_id, record_id, doctor_name,
            blood_pressure_systolic, blood_pressure_diastolic, heart_rate,
            temperature, weight_kg, height_cm, bmi, spo2
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """)
    sel_vital = session.prepare("SELECT * FROM patient_vital_signs WHERE patient_id = ? LIMIT 10")

    ins_ent = session.prepare("""
        INSERT INTO audit_logs_by_entity (entity_type, entity_id, event_id, action_type, actor_id,
            actor_role, action_time, summary, client_ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """)
    ins_act = session.prepare("""
        INSERT INTO audit_logs_by_actor (actor_id, log_date, event_id, actor_role, entity_type,
            entity_id, action_type, action_time, summary, client_ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """)
    ins_typ = session.prepare("""
        INSERT INTO audit_logs_by_action (action_type, log_date, event_id, actor_id, actor_role,
            entity_type, entity_id, action_time, summary, client_ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """)

    # 1. Ghi 1.000 bản ghi chuỗi thời gian sinh hiệu (Append-only)
    base_time = datetime.now(timezone.utc)
    lat_write_vital = []
    for i in range(1000):
        ts = base_time + timedelta(milliseconds=i)
        t0 = time.perf_counter()
        session.execute(ins_vital, (
            bench_pat, ts, f"VIS-{i}", f"REC-{i}", "BS Benchmark",
            120 + (i % 15), 80, 75, 36.8, 65.0, 170.0, 22.5, 98.5
        ))
        lat_write_vital.append((time.perf_counter() - t0) * 1000.0)
    results.append(_stats("Write Time-series Sinh hiệu (1.000 rows)", lat_write_vital))

    # 2. Đọc 10 bản ghi sinh hiệu gần nhất (Partition Key O(1))
    lat_read_vital = []
    for _ in range(500):
        t0 = time.perf_counter()
        _ = list(session.execute(sel_vital, (bench_pat,)))
        lat_read_vital.append((time.perf_counter() - t0) * 1000.0)
    results.append(_stats("Read 10 Sinh hiệu gần nhất O(1)", lat_read_vital))

    # 3. Ghi đồng bộ 3 bảng Audit Log qua LOGGED BATCH (300 batches = 900 writes)
    lat_batch = []
    for i in range(300):
        ts = base_time + timedelta(milliseconds=i)
        ev_id = uuid_from_time(ts)
        batch = BatchStatement(batch_type=BatchType.LOGGED)
        batch.add(ins_ent, ("BENCH_EMR", f"BENCH-REC-{i}", ev_id, bench_action, bench_actor, "DOCTOR", ts, "Benchmark audit", "127.0.0.1"))
        batch.add(ins_act, (bench_actor, today, ev_id, "DOCTOR", "BENCH_EMR", f"BENCH-REC-{i}", bench_action, ts, "Benchmark audit", "127.0.0.1"))
        batch.add(ins_typ, (bench_action, today, ev_id, bench_actor, "DOCTOR", "BENCH_EMR", f"BENCH-REC-{i}", ts, "Benchmark audit", "127.0.0.1"))
        t0 = time.perf_counter()
        session.execute(batch)
        lat_batch.append((time.perf_counter() - t0) * 1000.0)
    results.append(_stats("LOGGED BATCH 3 bảng Audit Log", lat_batch))

    # Cleanup
    session.execute("DELETE FROM patient_vital_signs WHERE patient_id = %s", (bench_pat,))
    session.execute("DELETE FROM audit_logs_by_actor WHERE actor_id = %s AND log_date = %s", (bench_actor, today))
    session.execute("DELETE FROM audit_logs_by_action WHERE action_type = %s AND log_date = %s", (bench_action, today))
    for i in range(300):
        session.execute("DELETE FROM audit_logs_by_entity WHERE entity_type = 'BENCH_EMR' AND entity_id = %s", (f"BENCH-REC-{i}",))

    cluster.shutdown()
    return results
