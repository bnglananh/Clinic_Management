import pytest
from utils.api_client import ApiClient


pytestmark = [pytest.mark.api, pytest.mark.uc04, pytest.mark.uc05, pytest.mark.uc06, pytest.mark.uc07, pytest.mark.uc08]


@pytest.mark.p1
def test_tc_uc04_001_track_active_queue(patient_a):
    """TC-UC04-001: Theo dõi lượt khám của bệnh nhân qua API."""
    uid = patient_a["user"]["id"]
    resp = patient_a["client"].get(f"/api/queue/patient/{uid}/active")
    assert resp.status_code in (200, 404)

    # Kiểm tra public queue board
    board = patient_a["client"].get("/api/queue/summary")
    assert board.status_code == 200


@pytest.mark.p1
def test_tc_uc05_001_patient_lookup_own_records(patient_a):
    """TC-UC05-001: Bệnh nhân tra cứu danh sách hồ sơ khám của chính mình."""
    uid = patient_a["user"]["id"]
    resp = patient_a["client"].get(f"/api/records/patient/{uid}")
    assert resp.status_code == 200
    assert isinstance(ApiClient.unwrap(resp), list)


@pytest.mark.p1
@pytest.mark.authorize
def test_tc_uc05_011_idor_patient_cannot_view_other_records(patient_a, patient_b):
    """TC-UC05-011: Bệnh nhân A không được xem danh sách bệnh án của Bệnh nhân B."""
    b_id = patient_b["user"]["id"]
    resp = patient_a["client"].get(f"/api/records/patient/{b_id}")
    assert resp.status_code in (403, 404)


@pytest.mark.p1
def test_tc_uc06_001_002_patient_history_and_vitals(patient_a):
    """TC-UC06-001 & TC-UC06-002: Xem lịch sử khám và chuỗi thời gian sinh hiệu Cassandra."""
    uid = patient_a["user"]["id"]
    h_resp = patient_a["client"].get(f"/api/patients/{uid}/history")
    assert h_resp.status_code in (200, 404)

    v_resp = patient_a["client"].get(f"/api/records/patient/{uid}/vitals-history", params={"limit": 10})
    assert v_resp.status_code in (200, 404)


@pytest.mark.p1
def test_tc_uc07_001_patient_view_own_bills(patient_a):
    """TC-UC07-001: Bệnh nhân tra cứu hóa đơn của mình."""
    uid = patient_a["user"]["id"]
    resp = patient_a["client"].get(f"/api/billing/patient/{uid}")
    assert resp.status_code == 200
    assert isinstance(ApiClient.unwrap(resp), list)


@pytest.mark.p1
@pytest.mark.authorize
def test_tc_uc07_011_idor_patient_cannot_view_other_bills(patient_a, patient_b):
    """TC-UC07-011: Bệnh nhân A không xem được hóa đơn của Bệnh nhân B."""
    b_id = patient_b["user"]["id"]
    resp = patient_a["client"].get(f"/api/billing/patient/{b_id}")
    assert resp.status_code in (403, 404)


@pytest.mark.p1
def test_tc_uc08_001_002_notifications_summary_and_mark_read(patient_a):
    """TC-UC08-001 & TC-UC08-002: Xem tóm tắt thông báo, unread-count và đánh dấu tất cả đã đọc."""
    uid = patient_a["user"]["id"]
    r_count = patient_a["client"].get("/api/notifications/unread-count", params={"userId": uid})
    assert r_count.status_code == 200

    r_sum = patient_a["client"].get("/api/notifications/summary", params={"userId": uid})
    assert r_sum.status_code == 200

    r_read_all = patient_a["client"].patch("/api/notifications/mark-all-read", params={"userId": uid})
    assert r_read_all.status_code in (200, 204)
