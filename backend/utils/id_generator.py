import secrets
import string
from datetime import datetime, timezone


def _random_digits(length):
    return "".join(secrets.choice(string.digits) for _ in range(length))


def generate_tin():
    year = datetime.now(timezone.utc).year
    return f"TIN-{year}-{_random_digits(6)}"


def generate_reference_id():
    year = datetime.now(timezone.utc).year
    return f"ETX-{year}-{_random_digits(6)}"


def generate_transaction_id():
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    suffix = _random_digits(6)
    return f"TXN-{stamp}{suffix}"


def generate_receipt_number():
    year = datetime.now(timezone.utc).year
    return f"RCPT-{year}-{_random_digits(6)}"


def generate_verification_token():
    return secrets.token_hex(16)
