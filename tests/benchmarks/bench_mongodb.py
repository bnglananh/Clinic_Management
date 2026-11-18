import time
import statistics
from datetime import datetime, timezone
from bson.decimal128 import Decimal128
from pymongo import MongoClient


def _stats(name: str, latencies_ms: list[float]) -> dict:
    s = sorted(latencies_ms)
    n = len(s)
    mean_ms = statistics.mean(s)
    return {
        "database": "MongoDB 7.0",
        "operation": name,
        "iterations": n,
        "mean_ms": round(mean_ms, 3),
        "p50_ms": round(s[int(0.50 * (n - 1))], 3),
        "p95_ms": round(s[int(0.95 * (n - 1))], 3),
        "p99_ms": round(s[int(0.99 * (n - 1))], 3),
        "ops_sec": round(1000.0 / mean_ms if mean_ms > 0 else 0.0, 1),
    }


def run_mongodb_benchmarks(uri: str = "mongodb://localhost:27017", db_name: str = "clinic_db", n_docs: int = 2000) -> dict:
    client = MongoClient(uri)
    db = client[db_name]
    records_col = db["medical_records"]
    bills_col = db["bills"]
    tag = "BENCH-PERF-2026"

    # Dọn dữ liệu benchmark cũ nếu còn
    records_col.delete_many({"benchTag": tag})
    bills_col.delete_many({"benchTag": tag})

    # Seed 2.000 bệnh án nhúng đầy đủ (vitals, diagnoses, serviceOrders, prescriptions)
    now = datetime.now(timezone.utc)
    sample_records = []
    sample_bills = []
    for i in range(n_docs):
        sample_records.append({
            "visitCode": f"BENCH-KBN-{i:05d}",
            "visitId": f"BENCH-VIS-{i:05d}",
            "patientId": f"BENCH-PAT-{i % 200:03d}",
            "patientName": f"Bệnh Nhân Benchmark {i}",
            "department": "Khoa Tim Mạch" if i % 2 == 0 else "Khoa Nội",
            "doctorName": "TS.BS Trần Minh Hoàng",
            "vitals": {"bloodPressure": "125/80", "heartRate": 75, "temperature": 36.8, "spo2": 98.0},
            "diagnoses": [{"icdCode": "I10", "diseaseName": "Tăng huyết áp vô căn", "primary": True}],
            "serviceOrders": [{"serviceCode": "XN-MAU", "name": "Công thức máu", "price": Decimal128("120000"), "status": "COMPLETED"}],
            "prescriptions": [{"drugCode": "ASP81", "name": "Aspirin pH8", "quantity": 30, "dosage": "1 viên/ngày"}],
            "isLocked": True,
            "benchTag": tag,
            "createdAt": now,
        })
        sample_bills.append({
            "billCode": f"BENCH-HD-{i:05d}",
            "patientId": f"BENCH-PAT-{i % 200:03d}",
            "consultationFee": Decimal128("150000"),
            "serviceFee": Decimal128("120000"),
            "medicineFee": Decimal128("85000"),
            "totalAmount": Decimal128("355000"),
            "paymentStatus": "PAID" if i % 5 != 0 else "UNPAID",
            "benchTag": tag,
            "createdAt": now,
        })

    t_ins = time.perf_counter()
    res_ins = records_col.insert_many(sample_records)
    ins_ms = (time.perf_counter() - t_ins) * 1000.0
    bills_col.insert_many(sample_bills)
    target_id = res_ins.inserted_ids[n_docs // 2]

    results = [{
        "database": "MongoDB 7.0",
        "operation": f"Bulk Insert {n_docs} EMR nhúng",
        "iterations": 1,
        "mean_ms": round(ins_ms, 2),
        "p50_ms": "-",
        "p95_ms": "-",
        "p99_ms": "-",
        "ops_sec": round(n_docs / (ins_ms / 1000.0), 1),
    }]

    # 1. Đọc 1 bệnh án EMR nhúng theo _id (Primary Index IXSCAN)
    lat_read_id = []
    for _ in range(500):
        t0 = time.perf_counter()
        _ = records_col.find_one({"_id": target_id})
        lat_read_id.append((time.perf_counter() - t0) * 1000.0)
    results.append(_stats("Find EMR theo _id (IXSCAN)", lat_read_id))

    # 2. So sánh Explain Plan: IXSCAN (_id) vs COLLSCAN (không index)
    exp_ix = db.command("explain", {"find": "medical_records", "filter": {"_id": target_id}}, verbosity="executionStats")
    exp_col = db.command("explain", {"find": "medical_records", "filter": {"visitCode": f"BENCH-KBN-{n_docs//2:05d}"}}, verbosity="executionStats")

    # 3. Aggregation Pipeline tổng hợp doanh thu trên 2.000 hóa đơn
    pipeline = [
        {"$match": {"benchTag": tag, "paymentStatus": "PAID"}},
        {"$group": {
            "_id": None,
            "count": {"$sum": 1},
            "totalRevenue": {"$sum": "$totalAmount"},
            "totalConsultation": {"$sum": "$consultationFee"},
            "totalMedicine": {"$sum": "$medicineFee"},
        }}
    ]
    lat_agg = []
    for _ in range(100):
        t0 = time.perf_counter()
        _ = list(bills_col.aggregate(pipeline))
        lat_agg.append((time.perf_counter() - t0) * 1000.0)
    results.append(_stats("Aggregation Pipeline (2.000 bills)", lat_agg))

    # Cleanup
    records_col.delete_many({"benchTag": tag})
    bills_col.delete_many({"benchTag": tag})

    return {
        "metrics": results,
        "explain": {
            "ixscan_docs_examined": exp_ix["executionStats"]["totalDocsExamined"],
            "ixscan_time_ms": exp_ix["executionStats"]["executionTimeMillis"],
            "collscan_docs_examined": exp_col["executionStats"]["totalDocsExamined"],
            "collscan_time_ms": exp_col["executionStats"]["executionTimeMillis"],
        }
    }
