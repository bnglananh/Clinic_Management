import threading
from concurrent.futures import ThreadPoolExecutor
import pytest
from utils.api_client import ApiClient
from utils.data_factory import build_register_payload, future_date_str, random_cccd, random_phone, unique_suffix


pytestmark = [pytest.mark.api, pytest.mark.concurrency]


@pytest.mark.p1
@pytest.mark.uc02
def test_tc_uc02_025_concurrent_slot_lock_race_condition(anon_client):
    """TC-UC02-025: 15 luồng đồng thời tranh 1 slot khám -> Chỉ đúng 1 luồng khóa thành công."""
    import random
    appt_date = future_date_str(random.randint(30, 180))
    slot = f"10:{random.randint(10, 59):02d}"
    doctor_id = "usr-doc-01"
    n_threads = 15
    barrier = threading.Barrier(n_threads)
    results = []
    lock = threading.Lock()

    # Tạo token bệnh nhân dùng chung để bắn request song song
    payload = build_register_payload()
    reg = anon_client.post("/api/auth/register", json=payload)
    assert reg.status_code == 201
    token = ApiClient.unwrap(reg)["accessToken"]

    def attempt(idx: int):
        client = anon_client.with_token(token)
        req = {
            "doctorId": doctor_id,
            "appointmentDate": appt_date,
            "timeSlot": slot,
            "ownerId": f"owner-{idx}-{unique_suffix()}",
        }
        barrier.wait()
        r = client.post("/api/appointments/slot-locks", json=req)
        acquired = False
        if r.status_code == 200:
            data = ApiClient.unwrap(r)
            acquired = bool(data.get("acquired", True))
        with lock:
            results.append((idx, r.status_code, acquired))

    with ThreadPoolExecutor(max_workers=n_threads) as pool:
        for i in range(n_threads):
            pool.submit(attempt, i)

    winners = [res for res in results if res[2]]
    assert len(winners) == 1, f"Expected exactly 1 lock winner, got {len(winners)}: {results}"


@pytest.mark.p1
@pytest.mark.uc09
def test_tc_uc09_020_concurrent_queue_ticket_issuance(receptionist_client):
    """TC-UC09-020: 15 luồng lễ tân đồng thời cấp số thứ tự -> 100% số thứ tự duy nhất, không trùng."""
    n_threads = 15
    barrier = threading.Barrier(n_threads)
    tickets = []
    lock = threading.Lock()

    def issue(idx: int):
        req = {
            "patientName": f"BN Song Song {idx} {unique_suffix()}",
            "phone": random_phone(),
            "roomName": "Phòng Khám Nội 101",
            "priority": "NORMAL",
        }
        barrier.wait()
        r = receptionist_client.post("/api/reception/checkin", json=req)
        assert r.status_code in (200, 201), f"Checkin failed: {r.status_code} {r.text}"
        num = ApiClient.unwrap(r)["ticketNumber"]
        with lock:
            tickets.append(num)

    with ThreadPoolExecutor(max_workers=n_threads) as pool:
        for i in range(n_threads):
            pool.submit(issue, i)

    assert len(tickets) == n_threads
    assert len(set(tickets)) == n_threads, f"Duplicate ticketNumbers detected: {tickets}"


@pytest.mark.p1
@pytest.mark.uc01
def test_tc_uc01_036_concurrent_register_same_phone(anon_client):
    """TC-UC01-036: 5 luồng đăng ký song song cùng 1 SĐT -> Chỉ đúng 1 tài khoản tạo thành công."""
    shared_phone = random_phone()
    n_threads = 5
    barrier = threading.Barrier(n_threads)
    statuses = []
    lock = threading.Lock()

    def register_one(idx: int):
        payload = build_register_payload(phone=shared_phone, cccd=random_cccd())
        barrier.wait()
        r = anon_client.post("/api/auth/register", json=payload)
        with lock:
            statuses.append(r.status_code)

    with ThreadPoolExecutor(max_workers=n_threads) as pool:
        for i in range(n_threads):
            pool.submit(register_one, i)

    assert statuses.count(201) == 1, f"Expected exactly 1 created (201), got {statuses}"
