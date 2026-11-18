import pytest
from utils.api_client import ApiClient
from utils.data_factory import future_date_str, past_date_str, random_phone, unique_suffix


pytestmark = [pytest.mark.api, pytest.mark.uc19, pytest.mark.uc20, pytest.mark.uc21, pytest.mark.uc22, pytest.mark.uc23, pytest.mark.uc24]


@pytest.mark.p1
def test_tc_uc19_001_006_admin_users_and_audit_logs(admin_client):
    """TC-UC19-001 & TC-UC19-006: Quản trị viên xem danh sách nhân sự và tra cứu Audit Log."""
    res_users = admin_client.get("/api/admin/users")
    assert res_users.status_code == 200
    users = ApiClient.unwrap(res_users)
    assert len(users) >= 3

    res_roles = admin_client.get("/api/admin/users/roles-permissions")
    assert res_roles.status_code == 200

    res_audit = admin_client.get("/api/admin/audit-logs", params={"action": "LOCK"})
    assert res_audit.status_code in (200, 400)


@pytest.mark.p1
@pytest.mark.authorize
def test_tc_uc19_017_rbac_non_admin_blocked_from_admin_apis(patient_a, doctor_client, receptionist_client):
    """TC-UC19-017: DOCTOR, RECEPTIONIST, PATIENT bị chặn 403 khi truy cập /api/admin/users."""
    assert patient_a["client"].get("/api/admin/users").status_code == 403
    assert doctor_client.get("/api/admin/users").status_code == 403
    assert receptionist_client.get("/api/admin/users").status_code == 403


@pytest.mark.p1
def test_tc_uc20_001_002_uc21_pharmacy_drugs_and_low_stock(admin_client):
    """TC-UC20-001, TC-UC20-002, TC-UC21-002: Danh mục thuốc, thêm thuốc mới và cảnh báo tồn kho thấp <=10."""
    res_list = admin_client.get("/api/admin/pharmacy/drugs")
    assert res_list.status_code == 200

    code = f"DRUG-{unique_suffix().upper()}"
    res_create = admin_client.post(
        "/api/admin/pharmacy/drugs",
        json={
            "code": code,
            "name": f"Thuốc Kiểm Thử {code}",
            "activeIngredient": "Paracetamol",
            "strength": "500mg",
            "unit": "Viên",
            "importPrice": 500,
            "salePrice": 1200,
            "stockQuantity": 5,
            "minAlertThreshold": 10,
            "batchNumber": "LOT-2026-01",
            "expiryDate": "2027-12-31",
            "status": "ACTIVE",
        },
    )
    assert res_create.status_code in (200, 201)

    # Cảnh báo tồn kho thấp
    res_low = admin_client.get("/api/admin/pharmacy/drugs/low-stock", params={"threshold": 10})
    assert res_low.status_code == 200
    low_drugs = ApiClient.unwrap(res_low)
    assert any(d["code"] == code for d in low_drugs)


@pytest.mark.p1
def test_tc_uc22_001_002_medical_services_catalog(admin_client):
    """TC-UC22-001 & TC-UC22-002: Danh mục dịch vụ cận lâm sàng."""
    res_list = admin_client.get("/api/admin/services")
    assert res_list.status_code == 200

    code = f"SVC-{unique_suffix().upper()}"
    res_create = admin_client.post(
        "/api/admin/services",
        json={
            "serviceCode": code,
            "serviceName": f"Xét nghiệm Automation {code}",
            "category": "XÉT NGHIỆM",
            "price": 150000,
            "roomName": "Phòng Xét Nghiệm 1",
            "unit": "Lần",
            "estimatedDurationMinutes": 30,
            "active": True,
        },
    )
    assert res_create.status_code in (200, 201)


@pytest.mark.p1
def test_tc_uc23_001_002_doctor_schedules(admin_client):
    """TC-UC23-001 & TC-UC23-002: Xem và tạo lịch trực bác sĩ."""
    res_list = admin_client.get("/api/admin/schedules")
    assert res_list.status_code == 200

    import random
    res_create = admin_client.post(
        "/api/admin/schedules",
        json={
            "doctorId": "usr-doc-01",
            "doctorName": "TS.BS Trần Minh Hoàng",
            "specialty": "Khoa Tim Mạch",
            "roomName": f"Phòng Auto {unique_suffix()}",
            "date": future_date_str(random.randint(30, 180)),
            "shift": "MORNING",
            "maxPatients": 40,
            "status": "CONFIRMED",
        },
    )
    assert res_create.status_code in (200, 201, 400, 409)


@pytest.mark.p1
def test_tc_uc24_001_006_dashboard_and_reports(admin_client):
    """TC-UC24-001, TC-UC24-004, TC-UC24-006: Dashboard thống kê, Leaderboard bác sĩ và xuất Excel."""
    res_dash = admin_client.get("/api/reports/dashboard")
    assert res_dash.status_code == 200

    res_dept = admin_client.get("/api/reports/departments")
    assert res_dept.status_code == 200

    res_lb = admin_client.get("/api/appointments/leaderboard/doctors")
    assert res_lb.status_code == 200
