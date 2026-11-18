import base64
import json
import pytest
from utils.api_client import ApiClient
from utils.data_factory import build_register_payload, random_phone, random_cccd


pytestmark = [pytest.mark.api, pytest.mark.uc01]


@pytest.mark.p1
def test_tc_uc01_001_register_patient_success(anon_client):
    """TC-UC01-001: Đăng ký bệnh nhân mới thành công, trả về 201 và JWT."""
    payload = build_register_payload()
    resp = anon_client.post("/api/auth/register", json=payload)
    assert resp.status_code == 201
    data = ApiClient.unwrap(resp)
    assert data.get("accessToken")
    assert data["user"]["role"] == "PATIENT"
    assert "password" not in json.dumps(data).lower()


@pytest.mark.p1
def test_tc_uc01_002_login_by_phone(anon_client, patient_a):
    """TC-UC01-002: Đăng nhập bằng số điện thoại trả về JWT hợp lệ."""
    resp = anon_client.post(
        "/api/auth/login",
        json={"username": patient_a["payload"]["phone"], "password": patient_a["payload"]["password"]},
    )
    assert resp.status_code == 200
    data = ApiClient.unwrap(resp)
    assert data.get("accessToken")
    assert data.get("expiresInSeconds") == 28800 or data.get("expiresInSeconds") > 0


@pytest.mark.p1
def test_tc_uc01_005_logout_revokes_token(anon_client):
    """TC-UC01-005 & TC-UC01-025: Đăng xuất đưa token vào Redis blacklist, token cũ bị trả 401."""
    payload = build_register_payload()
    reg = anon_client.post("/api/auth/register", json=payload)
    assert reg.status_code == 201
    token = ApiClient.unwrap(reg)["accessToken"]
    client = anon_client.with_token(token)

    assert client.get("/api/auth/me").status_code == 200
    assert client.post("/api/auth/logout").status_code == 200
    # Token cũ không còn sử dụng được
    assert client.get("/api/auth/me").status_code == 401


@pytest.mark.p1
def test_tc_uc01_006_update_profile_and_allergies(patient_a):
    """TC-UC01-006: Cập nhật hồ sơ cá nhân và tiền sử dị ứng thuốc qua /api/profile."""
    uid = patient_a["user"]["id"]
    resp = patient_a["client"].put(
        "/api/profile",
        params={"userId": uid},
        json={
            "fullName": patient_a["user"]["fullName"],
            "phone": patient_a["payload"]["phone"],
            "email": patient_a["payload"]["email"],
            "address": "123 Lê Trọng Tấn, Tân Phú, TP.HCM",
            "allergies": "Penicillin, Aspirin",
        },
    )
    assert resp.status_code in (200, 204)
    if resp.status_code == 200:
        data = ApiClient.unwrap(resp)
        assert "Penicillin" in (data.get("allergies") or "")


@pytest.mark.p1
def test_tc_uc01_007_008_login_invalid_credentials(anon_client, patient_a):
    """TC-UC01-007 & TC-UC01-008: Sai mật khẩu hoặc tài khoản không tồn tại trả cùng mã lỗi."""
    r1 = anon_client.post("/api/auth/login", json={"username": patient_a["payload"]["phone"], "password": "WrongPassword999"})
    r2 = anon_client.post("/api/auth/login", json={"username": "0999999999", "password": "WrongPassword999"})
    assert r1.status_code in (400, 401)
    assert r2.status_code in (400, 401)


@pytest.mark.p1
def test_tc_uc01_010_register_duplicate_phone(anon_client, patient_a):
    """TC-UC01-010: Đăng ký trùng SĐT bị từ chối (409/400)."""
    dup = build_register_payload(phone=patient_a["payload"]["phone"], cccd=random_cccd())
    resp = anon_client.post("/api/auth/register", json=dup)
    assert resp.status_code in (400, 409)


@pytest.mark.p1
def test_tc_uc01_016_phone_validation(anon_client):
    """TC-UC01-016: SĐT sai định dạng (9 số, 11 số, chứa chữ, không bắt đầu bằng 0)."""
    for bad_phone in ["091234567", "09123456789", "09123abc78", "1912345678"]:
        payload = build_register_payload(phone=bad_phone)
        resp = anon_client.post("/api/auth/register", json=payload)
        assert resp.status_code == 400, f"Expected 400 for bad phone {bad_phone}, got {resp.status_code}"


@pytest.mark.p1
def test_tc_uc01_018_required_fields_validation(anon_client):
    """TC-UC01-018: Bỏ trống trường bắt buộc bị từ chối 400."""
    resp = anon_client.post("/api/auth/register", json={"fullName": "", "phone": "", "password": ""})
    assert resp.status_code == 400


@pytest.mark.p1
@pytest.mark.security
def test_tc_uc01_026_tampered_jwt_claims_rejected(anon_client, patient_a):
    """TC-UC01-026: Sửa payload JWT nâng quyền lên ADMIN giữ chữ ký cũ bị từ chối 401."""
    parts = patient_a["token"].split(".")
    payload_json = json.loads(base64.urlsafe_b64decode(parts[1] + "==").decode("utf-8"))
    payload_json["role"] = "ADMIN"
    tampered_payload = base64.urlsafe_b64encode(json.dumps(payload_json).encode("utf-8")).decode("utf-8").rstrip("=")
    tampered_token = f"{parts[0]}.{tampered_payload}.{parts[2]}"

    resp = anon_client.with_token(tampered_token).get("/api/admin/users")
    assert resp.status_code == 401


@pytest.mark.p1
@pytest.mark.security
def test_tc_uc01_027_jwt_alg_none_rejected(anon_client):
    """TC-UC01-027: Token giả mạo alg=none bị từ chối 401."""
    header = base64.urlsafe_b64encode(b'{"alg":"none","typ":"JWT"}').decode().rstrip("=")
    body = base64.urlsafe_b64encode(b'{"sub":"admin","role":"ADMIN"}').decode().rstrip("=")
    fake_token = f"{header}.{body}."
    resp = anon_client.with_token(fake_token).get("/api/admin/users")
    assert resp.status_code == 401


@pytest.mark.p1
@pytest.mark.security
def test_tc_uc01_028_nosql_injection_in_login(anon_client):
    """TC-UC01-028: NoSQL/SQL injection ở login không đăng nhập được và không gây lỗi 500."""
    for bad_user in ['{"$ne": null}', "' OR 1=1 --", "admin' --"]:
        resp = anon_client.post("/api/auth/login", json={"username": bad_user, "password": "any"})
        assert resp.status_code in (400, 401)


@pytest.mark.p1
@pytest.mark.authorize
def test_tc_uc01_033_idor_patient_a_cannot_modify_patient_b(patient_a, patient_b):
    """TC-UC01-033: Bệnh nhân A không thể sửa hồ sơ của Bệnh nhân B (IDOR)."""
    b_id = patient_b["user"]["id"]
    resp = patient_a["client"].put(
        f"/api/patients/{b_id}",
        json={"fullName": "Hacked Name", "phone": patient_b["payload"]["phone"]},
    )
    assert resp.status_code in (403, 404)


@pytest.mark.p1
@pytest.mark.authorize
def test_tc_uc01_034_unauthenticated_access_blocked(anon_client):
    """TC-UC01-034: Truy cập API bảo vệ khi chưa đăng nhập trả 401."""
    assert anon_client.get("/api/auth/me").status_code == 401
    assert anon_client.get("/api/admin/users").status_code == 401
