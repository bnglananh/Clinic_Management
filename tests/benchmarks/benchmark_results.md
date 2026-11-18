# KẾT QUẢ BENCHMARK HIỆU NĂNG 4 CƠ SỞ DỮ LIỆU NOSQL
> Thời điểm thực nghiệm: `2026-11-18 20:05:09`

| CSDL | Tác vụ thực nghiệm | Số lần lặp | Mean (ms) | p50 (ms) | p95 (ms) | p99 (ms) | Thông lượng (ops/s) |
|:---|:---|---:|---:|---:|---:|---:|---:|
| **Redis 7.4** | INCR (Cấp số thứ tự) | 1000 | 0.76 | 0.519 | 1.491 | 3.621 | 1316.3 |
| **Redis 7.4** | SET NX EX (Khóa slot) | 1000 | 0.944 | 0.569 | 1.484 | 11.745 | 1059.5 |
| **Redis 7.4** | EXISTS (Check JWT Blacklist) | 1000 | 0.756 | 0.545 | 1.109 | 3.118 | 1322.8 |
| **Redis 7.4** | Concurrent INCR (20 luồng) | 2000 | 1.174 | - | - | - | 851.9 |
| **MongoDB 7.0** | Bulk Insert 2000 EMR nhúng | 1 | 138.59 | - | - | - | 14431.3 |
| **MongoDB 7.0** | Find EMR theo _id (IXSCAN) | 500 | 0.96 | 0.762 | 1.807 | 5.581 | 1041.4 |
| **MongoDB 7.0** | Aggregation Pipeline (2.000 bills) | 100 | 4.391 | 3.891 | 6.207 | 14.653 | 227.7 |
| **Cassandra 4.1** | Write Time-series Sinh hiệu (1.000 rows) | 1000 | 2.973 | 2.708 | 4.755 | 8.654 | 336.4 |
| **Cassandra 4.1** | Read 10 Sinh hiệu gần nhất O(1) | 500 | 3.345 | 3.04 | 5.519 | 7.61 | 298.9 |
| **Cassandra 4.1** | LOGGED BATCH 3 bảng Audit Log | 300 | 3.576 | 2.533 | 10.484 | 16.293 | 279.7 |
| **Neo4j 5.26** | Cypher Quét DDI (5 hoạt chất) | 200 | 4.469 | 3.493 | 10.75 | 25.857 | 223.7 |
| **Neo4j 5.26** | Cypher Chống chỉ định ICD-10 | 200 | 4.298 | 3.324 | 10.167 | 17.453 | 232.6 |
| **Neo4j 5.26** | Cypher Gợi ý thuốc thay thế | 200 | 5.885 | 4.983 | 10.731 | 23.053 | 169.9 |

## So sánh MongoDB Explain Plan (Index vs Full Collection Scan)
- **Primary Index (`IXSCAN` theo `_id`):** Quét `1` document trong `0 ms`.
- **Không có Index (`COLLSCAN`):** Phải quét `1` documents trong `2 ms`.
