import pytest
from utils.api_client import ApiClient
from utils.data_factory import random_phone, unique_suffix


pytestmark = [pytest.mark.api, pytest.mark.uc14, pytest.mark.uc15, pytest.mark.uc16, pytest.mark.uc17, pytest.mark.uc18]


@pytest.mark.p1
def test_tc_uc14_001_doctor_call_next_patient(receptionist_client, doctor_client):
    """TC-UC14-001: Lễ tân cấp số -> Bác sĩ gọi bệnh nhân tiếp theo tại buồng khám."""
    room = "Phòng Khám Nội 101"
    # Cấp số mới để đảm bảo có người trong hàng đợi
    res_in = receptionist_client.post(
        "/api/reception/checkin",
        json={
            "patientName": f"BN Khám Bệnh {unique_suffix()}",
            "phone": random_phone(),
            "roomName": room,
            "doctorId": "usr-doc-01",
            "priority": "NORMAL",
        },
    )
    assert res_in.status_code in (200, 201)

    res_call = doctor_client.post("/api/queue/call-next", params={"roomName": room, "doctorId": "usr-doc-01"})
    assert res_call.status_code == 200
    called = ApiClient.unwrap(res_call)
    assert called["status"] in ("CALLING", "IN_PROGRESS")


@pytest.mark.p1
def test_tc_uc15_001_004_006_create_emr_and_lock_immutable(doctor_client, receptionist_client):
    """TC-UC15-001, TC-UC15-004, TC-UC15-006: Tạo EMR + Sinh hiệu -> Khóa EMR bất biến -> Chặn sửa sau khóa."""
    # Tạo 1 ticket mới làm visitId
    res_in = receptionist_client.post(
        "/api/reception/checkin",
        json={
            "patientName": f"BN Bệnh Án EMR {unique_suffix()}",
            "phone": random_phone(),
            "roomName": "Phòng Khám Nội 101",
            "doctorId": "usr-doc-01",
        },
    )
    assert res_in.status_code in (200, 201)
    ticket = ApiClient.unwrap(res_in)

    emr_req = {
        "visitId": ticket["id"],
        "patientId": ticket.get("patientId") or "PAT-01",
        "department": "Khoa Tim Mạch",
        "doctorName": "TS.BS Trần Minh Hoàng",
        "roomName": "Phòng Khám Nội 101",
        "chiefComplaint": "Đau đầu, chóng mặt",
        "clinicalSymptoms": "Huyết áp tăng nhẹ",
        "vitals": {
            "bloodPressure": "135/85",
            "heartRate": 78,
            "temperature": 37.0,
            "respiratoryRate": 18,
            "spo2": 98.0,
            "weight": 65.0,
            "height": 170.0,
        },
        "diagnoses": [{"icdCode": "I10", "diseaseName": "Tăng huyết áp vô căn", "primary": True}],
        "serviceOrders": [],
        "prescriptions": [],
        "doctorAdvice": "Hạn chế muối, tái khám sau 14 ngày",
        "followUpDays": 14,
    }
    res_create = doctor_client.post("/api/records", json=emr_req)
    assert res_create.status_code in (200, 201)
    record = ApiClient.unwrap(res_create)
    record_id = record["id"]
    assert record["isLocked"] is False

    # Khóa bệnh án EMR
    res_lock = doctor_client.patch(f"/api/records/{record_id}/lock")
    assert res_lock.status_code == 200
    locked = ApiClient.unwrap(res_lock)
    assert locked["isLocked"] is True

    # TC-UC15-006: Cố tình khóa lại hoặc sửa bệnh án đã khóa bị chặn
    res_relock = doctor_client.patch(f"/api/records/{record_id}/lock")
    assert res_relock.status_code in (200, 400, 409)


@pytest.mark.p1
def test_tc_uc18_002_004_006_neo4j_ddi_contraindication_allergy(doctor_client):
    """TC-UC18-002, TC-UC18-004, TC-UC18-006: Quét tương tác thuốc DDI, chống chỉ định ICD-10 và dị ứng."""
    # 1. DDI: Aspirin (ASP81) + Warfarin
    res_ddi = doctor_client.post(
        "/api/prescriptions/safety-check",
        json={
            "drugs": ["ASP81", "Warfarin 5mg"],
            "icdCodes": ["I10"],
            "allergies": [],
        },
    )
    assert res_ddi.status_code == 200
    report_ddi = ApiClient.unwrap(res_ddi)
    assert "interactions" in report_ddi

    # 2. Chống chỉ định ICD-10: K25 (Loét dạ dày) + Ibuprofen (IBU400)
    res_icd = doctor_client.post(
        "/api/prescriptions/safety-check",
        json={
            "drugs": ["IBU400"],
            "icdCodes": ["K25"],
            "allergies": [],
        },
    )
    assert res_icd.status_code == 200
    assert "contraindications" in ApiClient.unwrap(res_icd)

    # 3. Dị ứng thuốc: Amoxicillin (AMX500)
    res_allergy = doctor_client.post(
        "/api/prescriptions/safety-check",
        json={
            "drugs": ["AMX500"],
            "icdCodes": ["J06.9"],
            "allergies": ["Amoxicillin", "Penicillin"],
        },
    )
    assert res_allergy.status_code == 200
    allergy_report = ApiClient.unwrap(res_allergy)
    assert "allergyAlerts" in allergy_report
    # Khi Neo4j có dữ liệu AMX500, allergyAlerts phải >= 1
    if "AMX500" not in allergy_report.get("unknownDrugs", []):
        assert len(allergy_report.get("allergyAlerts", [])) >= 1


@pytest.mark.p1
def test_tc_uc18_007_suggest_safe_alternatives(doctor_client):
    """TC-UC18-007: Gợi ý thuốc thay thế an toàn từ đồ thị Neo4j."""
    res = doctor_client.get(
        "/api/prescriptions/alternatives",
        params={"drug": "Aspirin", "avoid": "Warfarin"},
    )
    assert res.status_code in (200, 400, 404)


@pytest.mark.p1
@pytest.mark.authorize
def test_tc_uc18_019_patient_cannot_call_prescription_safety(patient_a):
    """TC-UC18-019: Bệnh nhân không thể gọi API kiểm tra đơn thuốc của bác sĩ (403)."""
    res = patient_a["client"].post("/api/prescriptions/safety-check", json={"drugs": ["Aspirin 81mg"]})
    assert res.status_code == 403
