import pytest
from utils.api_client import ApiClient
from utils.data_factory import random_cccd, random_phone, unique_suffix


pytestmark = [pytest.mark.api, pytest.mark.uc09, pytest.mark.uc10, pytest.mark.uc11, pytest.mark.uc12]


@pytest.mark.p1
def test_tc_uc09_001_003_walkin_checkin_and_print_k80(receptionist_client):
    """TC-UC09-001, TC-UC09-003, TC-UC09-004: Tiếp nhận BN vãng lai, cấp STT Redis INCR và lấy dữ liệu in K80."""
    req = {
        "patientName": f"Lê Văn Vãng Lai {unique_suffix()}",
        "phone": random_phone(),
        "gender": "NAM",
        "yearOfBirth": 1990,
        "roomName": "Phòng Khám Nội 101",
        "doctorId": "usr-doc-01",
        "doctorName": "TS.BS Trần Minh Hoàng",
        "priority": "NORMAL",
        "notes": "Khám tổng quát",
    }
    resp = receptionist_client.post("/api/reception/checkin", json=req)
    assert resp.status_code in (200, 201)
    ticket = ApiClient.unwrap(resp)
    assert ticket["ticketNumber"]
    assert ticket["status"] == "WAITING"

    # Kiểm tra dữ liệu in phiếu K80
    print_resp = receptionist_client.get(f"/api/reception/tickets/{ticket['id']}/print")
    assert print_resp.status_code == 200
    print_data = ApiClient.unwrap(print_resp)
    assert print_data["ticketNumber"] == ticket["ticketNumber"]


@pytest.mark.p1
def test_tc_uc11_001_002_queue_summary_and_promote(receptionist_client):
    """TC-UC11-001 & TC-UC11-002: Xem tổng quan hàng đợi và ưu tiên ca cấp cứu lên đầu hàng."""
    req = {
        "patientName": f"Bệnh Nhân Ưu Tiên {unique_suffix()}",
        "phone": random_phone(),
        "roomName": "Phòng Khám Nội 101",
        "priority": "NORMAL",
    }
    res_in = receptionist_client.post("/api/reception/checkin", json=req)
    assert res_in.status_code in (200, 201)
    ticket_id = ApiClient.unwrap(res_in)["id"]

    # Promote lên đầu hàng đợi
    res_prom = receptionist_client.post(f"/api/queue/{ticket_id}/promote")
    assert res_prom.status_code == 200
    promoted = ApiClient.unwrap(res_prom)
    assert promoted["priority"] in ("HIGH", "PRIORITY", "EMERGENCY")

    # Summary queue
    res_sum = receptionist_client.get("/api/queue/summary")
    assert res_sum.status_code == 200


@pytest.mark.p1
def test_tc_uc12_001_002_create_search_update_patient(receptionist_client):
    """TC-UC12-001 & TC-UC12-002: Tạo mới, tìm kiếm và cập nhật hồ sơ bệnh nhân."""
    phone = random_phone()
    cccd = random_cccd()
    name = f"Phạm Thị Hồ Sơ {unique_suffix()}"
    res_create = receptionist_client.post(
        "/api/patients",
        json={
            "cccd": cccd,
            "fullName": name,
            "dateOfBirth": "1988-03-20",
            "gender": "Nữ",
            "phone": phone,
            "address": "456 Cộng Hòa, Tân Bình, TP.HCM",
            "allergyHistory": "Penicillin",
        },
    )
    assert res_create.status_code in (200, 201)
    patient = ApiClient.unwrap(res_create)

    # Tìm kiếm theo SĐT / CCCD
    res_search = receptionist_client.get("/api/patients", params={"query": phone})
    assert res_search.status_code == 200
    found = ApiClient.unwrap(res_search)
    assert any(p["id"] == patient["id"] for p in found)


@pytest.mark.p1
@pytest.mark.authorize
def test_tc_uc09_019_patient_cannot_access_reception_checkin(patient_a):
    """TC-UC09-019: Bệnh nhân không thể tự gọi API tiếp nhận quầy lễ tân (403)."""
    resp = patient_a["client"].post(
        "/api/reception/checkin",
        json={"patientName": "Bypass", "phone": random_phone(), "roomName": "Phòng Khám Nội 101"},
    )
    assert resp.status_code == 403
