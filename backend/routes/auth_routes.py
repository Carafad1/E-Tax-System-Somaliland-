from flask import Blueprint, g, request

from extensions import db, limiter
from models import AdminUser, City, User
from responses.api_response import error, success
from security.jwt_utils import generate_token
from security.passwords import hash_password, verify_password
from validators.rules import normalize_phone
from validators.user_validator import validate_registration
from middleware.auth_middleware import token_required
from utils.unique_ids import unique_tin
from app_logging.logger import get_logger, safe_log_data

auth_bp = Blueprint("auth", __name__, url_prefix="/api")
logger = get_logger("auth")


@auth_bp.get("/health")
def health():
    return success("E-Tax System Somaliland API is running.", data={"status": "healthy"})


@auth_bp.post("/register")
@limiter.limit("10 per minute")
def register():
    payload = request.get_json(silent=True) or {}
    logger.info("Registration attempt: %s", safe_log_data(payload))

    errors = validate_registration(payload)

    phone = normalize_phone(payload.get("phone", ""))
    email = (payload.get("email") or "").strip().lower() or None

    if not errors.get("phone") and User.query.filter_by(phone=phone).first():
        errors["phone"] = "This phone number is already registered."
    if email and User.query.filter_by(email=email).first():
        errors["email"] = "This email is already registered."

    id_number = (payload.get("id_number") or "").strip() or None
    if id_number and User.query.filter_by(id_number=id_number).first():
        errors["id_number"] = "This ID number is already registered."

    if errors:
        return error("Please correct the highlighted fields.", errors=errors, status_code=422)

    city_id = payload.get("city_id")
    city = db.session.get(City, city_id) if city_id else None

    user = User(
        full_name=payload.get("full_name", "").strip(),
        email=email,
        phone=phone,
        id_number=id_number,
        tin=unique_tin(),
        city_id=city.id if city else None,
        address=(payload.get("address") or "").strip() or None,
        occupation=(payload.get("occupation") or "").strip() or None,
        taxpayer_type=payload.get("taxpayer_type", "individual"),
        business_name=(payload.get("business_name") or "").strip() or None,
        business_type=(payload.get("business_type") or "").strip() or None,
        password_hash=hash_password(payload.get("password")),
        status="active",
        role="citizen",
    )
    db.session.add(user)
    db.session.commit()

    token = generate_token(user.id, "citizen")
    logger.info("Registration successful for user_id=%s", user.id)

    return success(
        "Registration successful. Your taxpayer profile has been created.",
        data={"token": token, "user": user.to_dict()},
        status_code=201,
    )


@auth_bp.post("/login")
@limiter.limit("15 per minute")
def login():
    payload = request.get_json(silent=True) or {}
    identifier = (payload.get("identifier") or payload.get("phone") or payload.get("email") or "").strip()
    password = payload.get("password", "")

    if not identifier or not password:
        return error(
            "Invalid phone/email or password.",
            errors={"identifier": "Phone/email and password are required."},
            status_code=422,
        )

    normalized = normalize_phone(identifier)
    user = User.query.filter(
        (User.phone == normalized) | (User.email == identifier.lower())
    ).first()

    if not user or not verify_password(password, user.password_hash):
        logger.info("Failed login attempt for identifier=%s", identifier)
        return error("Invalid phone/email or password.", status_code=401)

    if user.status != "active":
        return error("Your account is not active. Please contact support.", status_code=403)

    token = generate_token(user.id, "citizen")
    logger.info("Login successful for user_id=%s", user.id)
    return success("Login successful.", data={"token": token, "user": user.to_dict()})


@auth_bp.post("/admin/login")
@limiter.limit("10 per minute")
def admin_login():
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password", "")

    admin = AdminUser.query.filter_by(username=username).first()
    if not admin or not admin.is_active or not verify_password(password, admin.password_hash):
        logger.info("Failed admin login attempt for username=%s", username)
        return error("Invalid username or password.", status_code=401)

    token = generate_token(admin.id, "admin")
    logger.info("Admin login successful for admin_id=%s", admin.id)
    return success("Login successful.", data={"token": token, "admin": admin.to_dict()})


@auth_bp.post("/logout")
@token_required
def logout():
    return success("Logged out successfully.")


@auth_bp.get("/me")
@token_required
def me():
    if g.current_role == "admin":
        return success("Current admin.", data={"role": "admin", "admin": g.current_admin.to_dict()})
    return success("Current user.", data={"role": "citizen", "user": g.current_user.to_dict()})
