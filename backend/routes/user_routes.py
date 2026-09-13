import secrets
import string

from flask import Blueprint, g, request

from extensions import db
from middleware.auth_middleware import admin_required
from models import City, Payment, User
from responses.api_response import error, success
from security.passwords import hash_password
from services.audit_service import log_action
from utils.unique_ids import unique_tin
from utils.pagination import apply_sort, paginated_response
from validators.rules import normalize_phone
from validators.user_validator import validate_registration, validate_profile_update


def _random_4_digit_password():
    return "".join(secrets.choice(string.digits) for _ in range(4))

user_bp = Blueprint("users", __name__, url_prefix="/api/users")

SORT_FIELDS = {"full_name", "created_at", "status", "taxpayer_type"}

# The only account states the app knows how to render and authenticate
# against (see middleware/auth_middleware.py, which only admits "active").
USER_STATUSES = ["active", "inactive", "suspended"]


@user_bp.get("")
@admin_required
def list_users():
    query = User.query.filter_by(role="citizen")

    search = request.args.get("search", "").strip()
    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(
                User.full_name.ilike(like),
                User.phone.ilike(like),
                User.email.ilike(like),
                User.id_number.ilike(like),
                User.tin.ilike(like),
            )
        )

    city_id = request.args.get("city_id")
    if city_id:
        query = query.filter(User.city_id == city_id)

    taxpayer_type = request.args.get("taxpayer_type")
    if taxpayer_type:
        query = query.filter(User.taxpayer_type == taxpayer_type)

    status = request.args.get("status")
    if status:
        query = query.filter(User.status == status)

    query = apply_sort(query, User, request.args.get("sort"), SORT_FIELDS)

    result = paginated_response(query, lambda u: u.to_dict())
    return success("Citizens loaded.", data=result)


@user_bp.post("")
@admin_required
def create_user():
    payload = request.get_json(silent=True) or {}
    generated_password = "password" not in payload or not payload.get("password")
    payload.setdefault("password", _random_4_digit_password())
    payload.setdefault("confirm_password", payload["password"])

    errors = validate_registration(payload)
    phone = normalize_phone(payload.get("phone", ""))
    email = (payload.get("email") or "").strip().lower() or None
    id_number = (payload.get("id_number") or "").strip() or None

    if not errors.get("phone") and User.query.filter_by(phone=phone).first():
        errors["phone"] = "This phone number is already registered."
    if email and User.query.filter_by(email=email).first():
        errors["email"] = "This email is already registered."
    if id_number and User.query.filter_by(id_number=id_number).first():
        errors["id_number"] = "This ID number is already registered."

    if errors:
        return error("Please correct the highlighted fields.", errors=errors, status_code=422)

    city = db.session.get(City, payload.get("city_id")) if payload.get("city_id") else None

    user = User(
        full_name=payload["full_name"].strip(),
        email=email,
        phone=phone,
        id_number=id_number,
        tin=unique_tin(),
        city_id=city.id if city else None,
        address=(payload.get("address") or "").strip() or None,
        occupation=(payload.get("occupation") or "").strip() or None,
        taxpayer_type=payload.get("taxpayer_type", "individual"),
        business_name=(payload.get("business_name") or "").strip() or None,
        password_hash=hash_password(payload["password"]),
        status="active",
        role="citizen",
    )
    db.session.add(user)
    db.session.commit()

    log_action(g.current_admin.id, "create", "citizen", user.id, f"Created citizen {user.full_name}")
    data = {"user": user.to_dict()}
    if generated_password:
        data["generated_password"] = payload["password"]
    return success("Citizen created successfully.", data=data, status_code=201)


@user_bp.get("/<int:user_id>")
@admin_required
def get_user(user_id):
    user = User.query.filter_by(id=user_id, role="citizen").first()
    if not user:
        return error("Citizen not found.", status_code=404)
    return success("Citizen loaded.", data={"user": user.to_dict()})


@user_bp.put("/<int:user_id>")
@admin_required
def update_user(user_id):
    user = User.query.filter_by(id=user_id, role="citizen").first()
    if not user:
        return error("Citizen not found.", status_code=404)

    payload = request.get_json(silent=True) or {}
    errors = validate_profile_update(payload)
    if errors:
        return error("Please correct the highlighted fields.", errors=errors, status_code=422)

    if "status" in payload and payload["status"] is not None:
        if payload["status"] not in USER_STATUSES:
            return error(
                "Invalid account status.",
                errors={"status": f"Must be one of: {', '.join(USER_STATUSES)}."},
                status_code=422,
            )
        user.status = payload["status"]

    for field in ["full_name", "address", "occupation", "business_name"]:
        if field in payload and payload[field] is not None:
            setattr(user, field, str(payload[field]).strip())

    if payload.get("email"):
        email = payload["email"].strip().lower()
        existing = User.query.filter(User.email == email, User.id != user.id).first()
        if existing:
            return error("This email is already registered.", errors={"email": "Already in use."}, status_code=409)
        user.email = email

    if payload.get("phone"):
        phone = normalize_phone(payload["phone"])
        existing = User.query.filter(User.phone == phone, User.id != user.id).first()
        if existing:
            return error("This phone number is already registered.", errors={"phone": "Already in use."}, status_code=409)
        user.phone = phone

    if payload.get("city_id"):
        city = db.session.get(City, payload["city_id"])
        if city:
            user.city_id = city.id

    db.session.commit()
    log_action(g.current_admin.id, "update", "citizen", user.id, f"Updated citizen {user.full_name}")
    return success("Citizen updated successfully.", data={"user": user.to_dict()})


@user_bp.delete("/<int:user_id>")
@admin_required
def delete_user(user_id):
    user = User.query.filter_by(id=user_id, role="citizen").first()
    if not user:
        return error("Citizen not found.", status_code=404)

    name = user.full_name
    db.session.delete(user)
    db.session.commit()
    log_action(g.current_admin.id, "delete", "citizen", user_id, f"Deleted citizen {name}")
    return success("Citizen deleted successfully.")


@user_bp.post("/bulk-delete")
@admin_required
def bulk_delete_users():
    payload = request.get_json(silent=True) or {}
    ids = payload.get("ids", [])
    if not isinstance(ids, list) or not ids:
        return error("Please select at least one citizen to delete.", status_code=422)

    users = User.query.filter(User.id.in_(ids), User.role == "citizen").all()
    deleted_count = len(users)
    for user in users:
        db.session.delete(user)
    db.session.commit()

    log_action(g.current_admin.id, "bulk_delete", "citizen", None, f"Deleted {deleted_count} citizens")
    return success(f"{deleted_count} citizen(s) deleted successfully.", data={"deleted": deleted_count})
