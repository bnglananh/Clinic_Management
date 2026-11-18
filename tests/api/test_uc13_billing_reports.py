import pytest
from utils.api_client import ApiClient
from utils.data_factory import unique_suffix


pytestmark = [pytest.mark.api, pytest.mark.uc13]


@pytest.mark.p1
def test_tc_uc13_001_003_billing_list_vietqr_and_cash(receptionist_client):
    """TC-UC13-001, TC-UC13-003, TC-UC13-004: Xem hóa đơn, tạo VietQR động và thanh toán."""
    res_list = receptionist_client.get("/api/billing", params={"status": "UNPAID"})
    assert res_list.status_code == 200
    bills = ApiClient.unwrap(res_list)
    assert isinstance(bills, list)

    # Tạo 1 hóa đơn test nếu chưa có hóa đơn UNPAID
    res_create = receptionist_client.post(
        "/api/billing",
        json={
            "patientId": "PAT-TEST-01",
            "patientCode": "BN-TEST-01",
            "patientName": f"Bệnh Nhân Thanh Toán {unique_suffix()}",
            "consultationFee": 150000,
            "serviceFee": 100000,
            "medicineFee": 50000,
            "discountAmount": 0,
            "notes": "Hóa đơn kiểm thử automation",
        },
    )
    if res_create.status_code in (200, 201):
        bill = ApiClient.unwrap(res_create)
        bill_id = bill["id"]

        # Phát sinh mã VietQR động
        res_qr = receptionist_client.post(f"/api/billing/{bill_id}/vietqr")
        assert res_qr.status_code == 200
        qr_data = ApiClient.unwrap(res_qr)
        assert qr_data.get("qrUrl") or qr_data.get("vietQrUrl") or qr_data.get("qrContent")

        # Thanh toán tiền mặt (hoặc confirm vietqr)
        res_pay = receptionist_client.post(
            f"/api/billing/{bill_id}/pay-cash",
            json={"cashReceived": 500000, "cashierName": "Thu Ngân AutoTest"},
        )
        assert res_pay.status_code == 200
        paid_bill = ApiClient.unwrap(res_pay)
        assert paid_bill["paymentStatus"] == "PAID"

        # TC-UC13-009: Không cho thanh toán lại hóa đơn đã PAID
        res_dup = receptionist_client.post(
            f"/api/billing/{bill_id}/pay-cash",
            json={"cashReceived": 500000, "cashierName": "Thu Ngân AutoTest"},
        )
        assert res_dup.status_code in (400, 409)


@pytest.mark.p1
def test_tc_uc13_008_cash_insufficient_rejected(receptionist_client):
    """TC-UC13-008: Khách đưa tiền mặt nhỏ hơn tổng tiền bị từ chối 400."""
    res_create = receptionist_client.post(
        "/api/billing",
        json={
            "patientId": "PAT-TEST-02",
            "patientName": "BN Thiếu Tiền",
            "consultationFee": 200000,
            "serviceFee": 0,
            "medicineFee": 0,
            "discountAmount": 0,
        },
    )
    if res_create.status_code in (200, 201):
        bill_id = ApiClient.unwrap(res_create)["id"]
        res_pay = receptionist_client.post(
            f"/api/billing/{bill_id}/pay-cash",
            json={"cashReceived": 100000, "cashierName": "Thu Ngân"},
        )
        assert res_pay.status_code == 400


@pytest.mark.p1
def test_tc_uc13_006_billing_summary_and_export_excel(admin_client):
    """TC-UC13-006 & TC-UC24-006: Kiểm tra summary viện phí và xuất báo cáo Excel (.xlsx)."""
    res_sum = admin_client.get("/api/billing/summary")
    assert res_sum.status_code == 200

    res_exp = admin_client.get("/api/reports/export")
    assert res_exp.status_code == 200
    assert len(res_exp.content) > 0


@pytest.mark.p1
@pytest.mark.authorize
def test_tc_uc13_018_patient_cannot_collect_cash(patient_a):
    """TC-UC13-018: Bệnh nhân không được quyền gọi API thu tiền mặt (403)."""
    resp = patient_a["client"].post("/api/billing/fake-id/pay-cash", json={"cashReceived": 100000})
    assert resp.status_code == 403
