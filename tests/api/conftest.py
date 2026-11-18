import pytest
import requests
from utils.api_client import ApiClient
from utils.data_factory import build_register_payload
from utils.db_verifier import DbVerifier


def _login_user(client: ApiClient, username: str, password: str) -> dict:
    resp = client.post("/api/auth/login", json={"username": username, "password": password})
    assert resp.status_code == 200, f"Login failed for {username}: {resp.status_code} {resp.text}"
    data = ApiClient.unwrap(resp)
    return {
        "token": data["accessToken"],
        "user": data["user"],
        "client": client.with_token(data["accessToken"]),
    }


@pytest.fixture(scope="session", autouse=True)
def check_backend_alive():
    """Đảm bảo Backend Spring Boot đang chạy tại localhost:8080 trước khi chạy API suite."""
    base = ApiClient().base_url
    try:
        r = requests.get(f"{base}/api/admin/services", timeout=3)
        if r.status_code >= 500:
            pytest.exit(f"Backend returned {r.status_code} at {base}. Check server logs.")
    except requests.exceptions.RequestException as exc:
        pytest.exit(f"Backend is NOT reachable at {base}. Start backend first! Error: {exc}")


@pytest.fixture(scope="session")
def anon_client() -> ApiClient:
    return ApiClient()


@pytest.fixture(scope="session")
def admin_session(anon_client) -> dict:
    return _login_user(anon_client, "admin", "123456")


@pytest.fixture(scope="session")
def doctor_session(anon_client) -> dict:
    return _login_user(anon_client, "bacsi", "123456")


@pytest.fixture(scope="session")
def receptionist_session(anon_client) -> dict:
    return _login_user(anon_client, "letan", "123456")


@pytest.fixture(scope="session")
def admin_client(admin_session) -> ApiClient:
    return admin_session["client"]


@pytest.fixture(scope="session")
def doctor_client(doctor_session) -> ApiClient:
    return doctor_session["client"]


@pytest.fixture(scope="session")
def receptionist_client(receptionist_session) -> ApiClient:
    return receptionist_session["client"]


@pytest.fixture(scope="session")
def patient_a(anon_client) -> dict:
    """Bệnh nhân A dùng chung cho các test chức năng và IDOR."""
    payload = build_register_payload(full_name="Nguyễn Văn Bệnh Nhân A")
    resp = anon_client.post("/api/auth/register", json=payload)
    assert resp.status_code == 201, f"Register Patient A failed: {resp.status_code} {resp.text}"
    data = ApiClient.unwrap(resp)
    return {
        "payload": payload,
        "token": data["accessToken"],
        "user": data["user"],
        "client": anon_client.with_token(data["accessToken"]),
    }


@pytest.fixture(scope="session")
def patient_b(anon_client) -> dict:
    """Bệnh nhân B dùng cho các bài test IDOR (A thao tác lên dữ liệu B)."""
    payload = build_register_payload(full_name="Trần Thị Bệnh Nhân B")
    resp = anon_client.post("/api/auth/register", json=payload)
    assert resp.status_code == 201, f"Register Patient B failed: {resp.status_code} {resp.text}"
    data = ApiClient.unwrap(resp)
    return {
        "payload": payload,
        "token": data["accessToken"],
        "user": data["user"],
        "client": anon_client.with_token(data["accessToken"]),
    }


@pytest.fixture(scope="session")
def db_verifier() -> DbVerifier:
    return DbVerifier()
