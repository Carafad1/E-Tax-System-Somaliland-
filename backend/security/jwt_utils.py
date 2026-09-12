from datetime import datetime, timedelta, timezone

import jwt
from flask import current_app


def generate_token(subject_id, role, extra_claims=None):
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(subject_id),
        "role": role,
        "iat": now,
        "exp": now + timedelta(hours=current_app.config["JWT_EXPIRATION_HOURS"]),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")


def decode_token(token):
    try:
        payload = jwt.decode(
            token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"]
        )
        return payload, None
    except jwt.ExpiredSignatureError:
        return None, "expired"
    except jwt.InvalidTokenError:
        return None, "invalid"
