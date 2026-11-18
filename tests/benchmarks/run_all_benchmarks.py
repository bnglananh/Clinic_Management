import json
import os
from datetime import datetime
from bench_redis import run_redis_benchmarks
from bench_mongodb import run_mongodb_benchmarks
from bench_cassandra import run_cassandra_benchmarks
from bench_neo4j import run_neo4j_benchmarks


def main():
    print("=" * 85)
    print("   SMART CLINIC EMR - BENCHMARK HIỆU NĂNG 4 HỆ CƠ SỞ DỮ LIỆU NOSQL")
    print(f"   Thời điểm đo: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 85)

    all_metrics = []
    mongo_explain = {}

    print("\n[1/4] Đang đo hiệu năng Redis 7.4...")
    all_metrics.extend(run_redis_benchmarks())

    print("[2/4] Đang đo hiệu năng MongoDB 7.0 (2.000 EMR + 2.000 Bills)...")
    mongo_res = run_mongodb_benchmarks()
    all_metrics.extend(mongo_res["metrics"])
    mongo_explain = mongo_res["explain"]

    print("[3/4] Đang đo hiệu năng Apache Cassandra 4.1 (1.000 Time-series + 300 Logged Batch)...")
    all_metrics.extend(run_cassandra_benchmarks())

    print("[4/4] Đang đo hiệu năng Neo4j 5.26 (Cypher DDI, ICD-10, Alternatives)...")
    all_metrics.extend(run_neo4j_benchmarks())

    # In bảng ra Console
    print("\n" + "-" * 95)
    print(f"{'CSDL':<15} | {'Tác vụ đo lường':<36} | {'Số lần':>6} | {'Mean(ms)':>8} | {'p95(ms)':>8} | {'Ops/sec':>9}")
    print("-" * 95)
    for m in all_metrics:
        print(
            f"{m['database']:<15} | {m['operation']:<36} | {m['iterations']:>6} | "
            f"{str(m['mean_ms']):>8} | {str(m['p95_ms']):>8} | {str(m['ops_sec']):>9}"
        )
    print("-" * 95)
    print(
        f"\n[MongoDB Explain Comparison] IXSCAN (_id): {mongo_explain['ixscan_docs_examined']} doc examined "
        f"({mongo_explain['ixscan_time_ms']} ms) vs COLLSCAN (no index): {mongo_explain['collscan_docs_examined']} "
        f"docs examined ({mongo_explain['collscan_time_ms']} ms)"
    )

    # Xuất ra Markdown để chép vào Chương 5 Báo cáo
    out_dir = os.path.dirname(os.path.abspath(__file__))
    md_path = os.path.join(out_dir, "benchmark_results.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# KẾT QUẢ BENCHMARK HIỆU NĂNG 4 CƠ SỞ DỮ LIỆU NOSQL\n")
        f.write(f"> Thời điểm thực nghiệm: `{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}`\n\n")
        f.write("| CSDL | Tác vụ thực nghiệm | Số lần lặp | Mean (ms) | p50 (ms) | p95 (ms) | p99 (ms) | Thông lượng (ops/s) |\n")
        f.write("|:---|:---|---:|---:|---:|---:|---:|---:|\n")
        for m in all_metrics:
            f.write(
                f"| **{m['database']}** | {m['operation']} | {m['iterations']} | "
                f"{m['mean_ms']} | {m['p50_ms']} | {m['p95_ms']} | {m['p99_ms']} | {m['ops_sec']} |\n"
            )
        f.write("\n## So sánh MongoDB Explain Plan (Index vs Full Collection Scan)\n")
        f.write(f"- **Primary Index (`IXSCAN` theo `_id`):** Quét `{mongo_explain['ixscan_docs_examined']}` document trong `{mongo_explain['ixscan_time_ms']} ms`.\n")
        f.write(f"- **Không có Index (`COLLSCAN`):** Phải quét `{mongo_explain['collscan_docs_examined']}` documents trong `{mongo_explain['collscan_time_ms']} ms`.\n")

    json_path = os.path.join(out_dir, "benchmark_results.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"metrics": all_metrics, "mongo_explain": mongo_explain}, f, ensure_ascii=False, indent=2)

    print(f"\nĐã lưu báo cáo số liệu tại:\n- {md_path}\n- {json_path}")


if __name__ == "__main__":
    main()
