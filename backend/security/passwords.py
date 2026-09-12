import bcrypt


def hash_password(plain_text):
    return bcrypt.hashpw(plain_text.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_text, password_hash):
    if not plain_text or not password_hash:
        return False
    try:
        return bcrypt.checkpw(plain_text.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False
