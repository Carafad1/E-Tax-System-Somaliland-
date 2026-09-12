from functools import wraps

from flask import g, request

from extensions import db
from models import AdminUser, User
from responses.api_response import error
from security.jwt_utils import decode_token


def _extract_token():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    return auth_header.split(" ", 1)[1].strip()


def token_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = _extract_token()
        if not token:
            return error("Authentication required.", status_code=401)

        payload, err = decode_token(token)
        if err == "expired":
            return error("Your session has expired. Please log in again.", status_code=401)
        if err or not payload:
            return error("Invalid authentication token.", status_code=401)

        role = payload.get("role")
        if role == "admin":
            admin = db.session.get(AdminUser, int(payload["sub"]))
            if not admin or not admin.is_active:
                return error("Invalid authentication token.", status_code=401)
            g.current_admin = admin
            g.current_user = None
            g.current_role = "admin"
        else:
            user = db.session.get(User, int(payload["sub"]))
            if not user or user.status != "active":
                return error("Invalid authentication token.", status_code=401)
            g.current_user = user
            g.current_admin = None
            g.current_role = "citizen"

        return fn(*args, **kwargs)

    return wrapper


def admin_required(fn):
    @wraps(fn)
    @token_required
    def wrapper(*args, **kwargs):
        if g.get("current_role") != "admin":
            return error("Administrator access is required.", status_code=403)
        return fn(*args, **kwargs)

    return wrapper
