import random
import time
import uuid
from datetime import date, timedelta


def unique_suffix() -> str:
    return uuid.uuid4().hex[:6]


def random_phone() -> str:
    """Sinh SĐT 10 chữ số bắt đầu bằng 09 hợp lệ regex ^0\\d{9}$."""
    tail = f"{int(time.time() * 1000) % 100000:05d}{random.randint(100, 999)}"
    return f"09{tail}"


def random_cccd() -> str:
    """Sinh CCCD 12 chữ số ngẫu nhiên."""
    return f"079{random.randint(100000000, 999999999)}"


def random_email(prefix: str = "patient") -> str:
    return f"{prefix}.{unique_suffix()}@smartclinic.test"


def future_date_str(days_ahead: int = 3) -> str:
    return (date.today() + timedelta(days=days_ahead)).isoformat()


def past_date_str(days_ago: int = 2) -> str:
    return (date.today() - timedelta(days=days_ago)).isoformat()


def build_register_payload(
    phone: str = None,
    cccd: str = None,
    email: str = None,
    password: str = "Abc@1234",
    full_name: str = None,
) -> dict:
    return {
        "fullName": full_name or f"Nguyễn Văn Test {unique_suffix()}",
        "phone": phone or random_phone(),
        "email": email or random_email(),
        "dateOfBirth": "1995-06-15",
        "gender": "Nam",
        "identityCardNumber": cccd or random_cccd(),
        "password": password,
    }
