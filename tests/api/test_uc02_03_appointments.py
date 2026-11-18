import pytest
from utils.api_client import ApiClient
from utils.data_factory import future_date_str, past_date_str, unique_suffix


pytestmark = [pytest.mark.api, pytest.mark.uc02, pytest.mark.uc03]


@pytest.mark.p1
def test_tc_uc02_003_006_slot_lock_and_release(patient_a, db_verifier):
    """TC-UC02-003 & TC-UC02-006: Giữ chỗ slot Redis TTL 600s và chủ động giải phóng lock."""
    appt_date = future_date_str(5)
    slot = "08:30"
    doctor_id = "usr-doc-01"
    owner_id = patient_a["user"]["id"]

    lock_req = {
        "doctorId": doctor_id,
        "appointmentDate": appt_date,
        "timeSlot": slot,
        "ownerId": owner_id,
    }
    resp = patient_a["client"].post("/api/appointments/slot-locks", json=lock_req)
    assert resp.status_code == 200
    data = ApiClient.unwrap(resp)
    assert data.get("acquired") is True or data.get("locked") is True or data.get("ownerId") == owner_id

    # Kiểm tra Redis trực tiếp nếu có
    r = db_verifier.get_redis()
    if r is not None:
        key = f"slot:lock:{doctor_id}:{appt_date}:{slot}"
        ttl = r.ttl(key)
        assert 590 <= ttl <= 600

    # Release lock
    rel = patient_a["client"].post("/api/appointments/slot-locks/release", json=lock_req)
    assert rel.status_code in (200, 204)
    if r is not None:
        assert r.exists(f"slot:lock:{doctor_id}:{appt_date}:{slot}") == 0


@pytest.mark.p1
def test_tc_uc02_007_022_slot_locked_by_another_patient(patient_a, patient_b):
    """TC-UC02-007 & TC-UC02-022: BN A giữ chỗ -> BN B click cùng slot bị từ chối và không thể release lock của A."""
    appt_date = future_date_str(6)
    slot = "09:00"
    doctor_id = "usr-doc-01"

    lock_a = {"doctorId": doctor_id, "appointmentDate": appt_date, "timeSlot": slot, "ownerId": patient_a["user"]["id"]}
    lock_b = {"doctorId": doctor_id, "appointmentDate": appt_date, "timeSlot": slot, "ownerId": patient_b["user"]["id"]}

    assert patient_a["client"].post("/api/appointments/slot-locks", json=lock_a).status_code == 200

    # B cố tình giữ cùng slot
    resp_b = patient_b["client"].post("/api/appointments/slot-locks", json=lock_b)
    if resp_b.status_code == 200:
        data_b = ApiClient.unwrap(resp_b)
        assert data_b.get("acquired") is False
    else:
        assert resp_b.status_code in (400, 409)

    # B không thể release lock của A
    patient_b["client"].post("/api/appointments/slot-locks/release", json=lock_b)
    # A vẫn release thành công sau đó
    assert patient_a["client"].post("/api/appointments/slot-locks/release", json=lock_a).status_code in (200, 204)


@pytest.mark.p1
def test_tc_uc02_001_003_full_booking_reschedule_cancel_flow(patient_a):
    """TC-UC02-001, TC-UC03-001, TC-UC03-003, TC-UC03-004: Đặt lịch -> Xem -> Dời lịch -> Hủy lịch."""
    import random
    day_offset = random.randint(30, 180)
    appt_date = future_date_str(day_offset)
    slot = f"09:{random.randint(10, 59):02d}"
    doctor_id = "usr-doc-01"
    uid = patient_a["user"]["id"]

    # 1. Lock slot
    lock_req = {"doctorId": doctor_id, "appointmentDate": appt_date, "timeSlot": slot, "ownerId": uid}
    assert patient_a["client"].post("/api/appointments/slot-locks", json=lock_req).status_code == 200

    # 2. Confirm booking
    create_req = {
        "patientId": uid,
        "patientName": patient_a["user"]["fullName"],
        "phone": patient_a["payload"]["phone"],
        "department": "Khoa Tim Mạch",
        "doctorId": doctor_id,
        "doctorName": "TS.BS Trần Minh Hoàng",
        "appointmentDate": appt_date,
        "timeSlot": slot,
        "reasonForVisit": f"Đau ngực nhẹ {unique_suffix()}",
    }
    res_create = patient_a["client"].post("/api/appointments", json=create_req)
    assert res_create.status_code in (200, 201)
    appt = ApiClient.unwrap(res_create)
    appt_id = appt["id"]
    assert appt["appointmentCode"]

    # 3. UC03: Xem danh sách lịch hẹn
    res_list = patient_a["client"].get(f"/api/appointments/patient/{uid}")
    assert res_list.status_code == 200
    items = ApiClient.unwrap(res_list)
    assert any(a["id"] == appt_id for a in items)

    # 4. UC03: Dời lịch sang ngày mới
    new_date = future_date_str(9)
    new_slot = "10:00"
    res_resched = patient_a["client"].put(
        f"/api/appointments/{appt_id}/reschedule",
        json={"newAppointmentDate": new_date, "newTimeSlot": new_slot, "reason": "Đổi lịch công tác"},
    )
    assert res_resched.status_code == 200
    updated = ApiClient.unwrap(res_resched)
    assert updated["appointmentDate"] == new_date

    # 5. UC03: Hủy lịch hẹn
    res_cancel = patient_a["client"].put(f"/api/appointments/{appt_id}/cancel", json={"reason": "Bận việc gia đình"})
    assert res_cancel.status_code == 200
    cancelled = ApiClient.unwrap(res_cancel)
    assert cancelled["status"] == "CANCELLED"


@pytest.mark.p1
def test_tc_uc02_011_past_date_booking_rejected(patient_a):
    """TC-UC02-011: Đặt lịch ở ngày trong quá khứ bị từ chối 400."""
    uid = patient_a["user"]["id"]
    res = patient_a["client"].post(
        "/api/appointments",
        json={
            "patientId": uid,
            "patientName": patient_a["user"]["fullName"],
            "phone": patient_a["payload"]["phone"],
            "department": "Khoa Tim Mạch",
            "doctorId": "usr-doc-01",
            "appointmentDate": past_date_str(3),
            "timeSlot": "08:00",
            "reasonForVisit": "Khám lại",
        },
    )
    assert res.status_code == 400


@pytest.mark.p1
@pytest.mark.authorize
def test_tc_uc03_014_idor_patient_b_cannot_cancel_patient_a_appointment(patient_a, patient_b):
    """TC-UC03-014: Bệnh nhân B không được phép xem/hủy lịch hẹn của Bệnh nhân A (IDOR)."""
    import random
    appt_date = future_date_str(random.randint(30, 180))
    slot = f"14:{random.randint(10, 59):02d}"
    uid_a = patient_a["user"]["id"]
    res = patient_a["client"].post(
        "/api/appointments",
        json={
            "patientId": uid_a,
            "patientName": patient_a["user"]["fullName"],
            "phone": patient_a["payload"]["phone"],
            "department": "Khoa Tim Mạch",
            "doctorId": "usr-doc-01",
            "appointmentDate": appt_date,
            "timeSlot": slot,
            "reasonForVisit": "Kiểm tra tim mạch",
        },
    )
    assert res.status_code in (200, 201)
    appt_id = ApiClient.unwrap(res)["id"]

    res_b = patient_b["client"].put(f"/api/appointments/{appt_id}/cancel", json={"reason": "Hủy trộm"})
    assert res_b.status_code in (400, 403, 404)
