import secrets
import time

from flask import Blueprint, request

from extensions import limiter
from responses.api_response import error, success
from validators.rules import normalize_phone

otp_bp = Blueprint("otp", __name__, url_prefix="/api/otp")

# Development/mock OTP store. This is NOT connected to a real SMS provider.
# In production, integrate a licensed SMS gateway and store OTPs securely
# (e.g. Redis with TTL), never returning the code in the API response.
_OTP_STORE = {}
_OTP_TTL_SECONDS = 300


@otp_bp.post("/send")
@limiter.limit("5 per minute")
def send_otp():
    payload = request.get_json(silent=True) or {}
    phone = normalize_phone(payload.get("phone", ""))
    if not phone:
        return error("Phone number is required.", status_code=422)

    code = f"{secrets.randbelow(1000000):06d}"
    _OTP_STORE[phone] = {"code": code, "expires_at": time.time() + _OTP_TTL_SECONDS}

    return success(
        "Development mode: no real SMS provider is connected. Use the code below to continue.",
        data={"mock": True, "dev_otp": code, "expires_in_seconds": _OTP_TTL_SECONDS},
    )


@otp_bp.post("/verify")
@limiter.limit("10 per minute")
def verify_otp():
    payload = request.get_json(silent=True) or {}
    phone = normalize_phone(payload.get("phone", ""))
    code = (payload.get("otp") or "").strip()

    entry = _OTP_STORE.get(phone)
    if not entry or entry["expires_at"] < time.time():
        return error("The verification code has expired. Please request a new one.", status_code=400)

    if entry["code"] != code:
        return error("Invalid verification code.", status_code=400)

    del _OTP_STORE[phone]
    return success("Phone number verified successfully.", data={"verified": True})
