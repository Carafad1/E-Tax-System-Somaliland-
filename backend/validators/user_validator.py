from validators.rules import validate_email, validate_full_name, validate_password, validate_phone

TAXPAYER_TYPES = ["individual", "business"]
BUSINESS_TYPES = ["Retail", "Wholesale", "Service", "Manufacturing", "Other"]


def validate_registration(payload):
    errors = {}

    name_error = validate_full_name(payload.get("full_name", ""))
    if name_error:
        errors["full_name"] = name_error

    phone_error = validate_phone(payload.get("phone", ""))
    if phone_error:
        errors["phone"] = phone_error

    email_error = validate_email(payload.get("email"), required=False)
    if email_error:
        errors["email"] = email_error

    password = payload.get("password", "")
    confirm_password = payload.get("confirm_password", "")
    password_error = validate_password(password)
    if password_error:
        errors["password"] = password_error
    elif password != confirm_password:
        errors["confirm_password"] = "Passwords do not match."

    taxpayer_type = payload.get("taxpayer_type", "individual")
    if taxpayer_type not in TAXPAYER_TYPES:
        errors["taxpayer_type"] = "Please select a valid taxpayer type."

    if taxpayer_type == "business" and not (payload.get("business_name") or "").strip():
        errors["business_name"] = "Business name is required for business taxpayers."

    return errors


def validate_profile_update(payload):
    errors = {}
    if "full_name" in payload:
        name_error = validate_full_name(payload.get("full_name", ""))
        if name_error:
            errors["full_name"] = name_error
    if "email" in payload:
        email_error = validate_email(payload.get("email"), required=False)
        if email_error:
            errors["email"] = email_error
    if "phone" in payload:
        phone_error = validate_phone(payload.get("phone", ""))
        if phone_error:
            errors["phone"] = phone_error
    return errors
