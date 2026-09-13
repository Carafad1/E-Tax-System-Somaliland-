import os
import uuid

from flask import Blueprint, current_app, g, request
from PIL import Image, UnidentifiedImageError
from werkzeug.utils import secure_filename

from extensions import db
from middleware.auth_middleware import token_required
from models import City
from responses.api_response import error, success
from security.passwords import hash_password
from validators.rules import validate_pin
from validators.user_validator import validate_profile_update

profile_bp = Blueprint("profile", __name__, url_prefix="/api/profile")

ALLOWED_AVATAR_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_AVATAR_BYTES = 5 * 1024 * 1024


@profile_bp.get("")
@token_required
def get_profile():
    if g.current_role != "citizen":
        return error("This endpoint is only available to citizen accounts.", status_code=403)
    return success("Profile loaded.", data={"user": g.current_user.to_dict()})


@profile_bp.put("")
@token_required
def update_profile():
    if g.current_role != "citizen":
        return error("This endpoint is only available to citizen accounts.", status_code=403)

    payload = request.get_json(silent=True) or {}
    errors = validate_profile_update(payload)
    if errors:
        return error("Please correct the highlighted fields.", errors=errors, status_code=422)

    user = g.current_user
    # str() before strip(): a JSON body can legitimately carry a number or a
    # boolean here, and an AttributeError on .strip() would turn a bad field
    # into a 500 instead of a saved (or rejected) profile.
    for field in ["full_name", "address", "occupation", "business_name", "business_type"]:
        if field in payload and payload[field] is not None:
            setattr(user, field, str(payload[field]).strip())

    if payload.get("city_id"):
        city = db.session.get(City, payload["city_id"])
        if not city:
            return error("Please select a valid city.", errors={"city_id": "Invalid city."}, status_code=422)
        user.city_id = city.id

    db.session.commit()
    return success("Profile updated successfully.", data={"user": user.to_dict()})


@profile_bp.post("/avatar")
@token_required
def upload_avatar():
    if g.current_role != "citizen":
        return error("This endpoint is only available to citizen accounts.", status_code=403)

    file = request.files.get("avatar")
    if not file or not file.filename:
        return error("Please choose a photo to upload.", errors={"avatar": "No file provided."}, status_code=422)

    extension = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if extension not in ALLOWED_AVATAR_EXTENSIONS:
        return error(
            "Please upload a JPG, PNG, or WEBP image.",
            errors={"avatar": "Unsupported file type."},
            status_code=422,
        )

    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > MAX_AVATAR_BYTES:
        return error(
            "Photo is too large. Please choose an image under 5MB.",
            errors={"avatar": "File too large."},
            status_code=422,
        )

    try:
        image = Image.open(file.stream)
        image.verify()
    except (UnidentifiedImageError, OSError):
        return error(
            "Please upload a valid image file.",
            errors={"avatar": "Invalid image file."},
            status_code=422,
        )
    finally:
        file.seek(0)

    user = g.current_user
    avatars_dir = os.path.join(current_app.static_folder, "avatars")
    os.makedirs(avatars_dir, exist_ok=True)

    filename = secure_filename(f"user{user.id}_{uuid.uuid4().hex[:10]}.{extension}")
    new_path = os.path.join(avatars_dir, filename)
    old_path = os.path.join(current_app.root_path, user.avatar_url.lstrip("/")) if user.avatar_url else None

    try:
        file.save(new_path)
        user.avatar_url = f"/static/avatars/{filename}"
        db.session.commit()
    except OSError:
        db.session.rollback()
        if os.path.isfile(new_path):
            os.remove(new_path)
        return error("Unable to save your profile photo.", status_code=500)

    if old_path and old_path != new_path and os.path.isfile(old_path):
        os.remove(old_path)

    return success("Profile photo updated successfully.", data={"user": user.to_dict()})


@profile_bp.delete("/avatar")
@token_required
def delete_avatar():
    if g.current_role != "citizen":
        return error("This endpoint is only available to citizen accounts.", status_code=403)

    user = g.current_user
    if user.avatar_url:
        old_path = os.path.join(current_app.root_path, user.avatar_url.lstrip("/"))
        if os.path.isfile(old_path):
            os.remove(old_path)
        user.avatar_url = None
        db.session.commit()

    return success("Profile photo removed.", data={"user": user.to_dict()})


@profile_bp.post("/payment-pin")
@token_required
def set_payment_pin():
    if g.current_role != "citizen":
        return error("This endpoint is only available to citizen accounts.", status_code=403)

    payload = request.get_json(silent=True) or {}
    pin = payload.get("pin", "")
    confirm_pin = payload.get("confirm_pin", "")

    pin_error = validate_pin(pin)
    if pin_error:
        return error(pin_error, errors={"pin": pin_error}, status_code=422)
    if pin != confirm_pin:
        return error(
            "PIN confirmation does not match.",
            errors={"confirm_pin": "PIN confirmation does not match."},
            status_code=422,
        )

    user = g.current_user
    user.payment_pin_hash = hash_password(pin)
    db.session.commit()
    return success("Payment PIN set successfully.", data={"has_payment_pin": True})
