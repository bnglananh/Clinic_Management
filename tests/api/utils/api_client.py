import os
import requests
from typing import Any, Dict, Optional


class ApiClient:
    """HTTP Client wrapper cho hệ thống Smart Clinic EMR Backend (Spring Boot 3)."""

    def __init__(self, base_url: Optional[str] = None, token: Optional[str] = None):
        self.base_url = (base_url or os.getenv("CLINIC_API_URL", "http://localhost:8080")).rstrip("/")
        self.token = token
        self.session = requests.Session()

    def with_token(self, token: str) -> "ApiClient":
        return ApiClient(base_url=self.base_url, token=token)

    def _headers(self, extra: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        if extra:
            headers.update(extra)
        return headers

    def get(self, path: str, params: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = None) -> requests.Response:
        return self.session.get(f"{self.base_url}{path}", params=params, headers=self._headers(headers), timeout=15)

    def post(self, path: str, json: Any = None, params: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = None) -> requests.Response:
        return self.session.post(f"{self.base_url}{path}", json=json, params=params, headers=self._headers(headers), timeout=15)

    def put(self, path: str, json: Any = None, params: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = None) -> requests.Response:
        return self.session.put(f"{self.base_url}{path}", json=json, params=params, headers=self._headers(headers), timeout=15)

    def patch(self, path: str, json: Any = None, params: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = None) -> requests.Response:
        return self.session.patch(f"{self.base_url}{path}", json=json, params=params, headers=self._headers(headers), timeout=15)

    def delete(self, path: str, params: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = None) -> requests.Response:
        return self.session.delete(f"{self.base_url}{path}", params=params, headers=self._headers(headers), timeout=15)

    @staticmethod
    def unwrap(resp: requests.Response) -> Any:
        """Trích xuất trường `data` từ chuẩn ApiResponse<T> của Backend."""
        body = resp.json()
        return body.get("data") if isinstance(body, dict) and "data" in body else body
