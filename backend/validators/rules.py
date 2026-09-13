import re

FULL_NAME_PATTERN = re.compile(r"^[A-Za-z؀-ۿ][A-Za-z؀-ۿ' .-]{1,}$")
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_PATTERN = re.compile(r"^\+?\d[\d\s-]{6,18}\d$")
PIN_PATTERN = re.compile(r"^\d{4,6}$")


def validate_full_name(value):
    if not value or not isinstance(value, str):
        return "Full name is required."
    value = value.strip()
    if len(value) < 3:
        return "Full name must be at least 3 characters."
    if not FULL_NAME_PATTERN.match(value):
        return "Please enter a valid full name."
    return None


def validate_email(value, required=False):
    if not value:
        if required:
            return "Email is required."
        return None
    if not isinstance(value, str) or not EMAIL_PATTERN.match(value.strip()):
        return "Please enter a valid email address."
    return None


def validate_phone(value):
    if not value or not isinstance(value, str):
        return "Phone number is required."
    cleaned = value.strip()
    digits_only = re.sub(r"[\s-]", "", cleaned)
    if not PHONE_PATTERN.match(cleaned) or len(re.sub(r"\D", "", digits_only)) < 7:
        return "Please enter a valid phone number."
    return None


def validate_password(value):
    if not value or not isinstance(value, str):
        return "Password is required."
    if not re.match(r"^\d{4}$", value):
        return "Password must be exactly 4 digits."
    return None


def validate_pin(value):
    if not value or not isinstance(value, str):
        return "PIN is required."
    if not PIN_PATTERN.match(value):
        return "PIN must be 4 to 6 digits."
    return None


def normalize_phone(value):
    """Strip spaces and dashes from a phone number.

    Tolerates anything a JSON body can carry (None, a number, ...): callers
    normalize the phone *before* returning their validation errors, so a
    non-string value must not turn a 422 into a 500.
    """
    if not isinstance(value, str):
        return "" if value is None else str(value).strip()
    return re.sub(r"[\s-]", "", value.strip())
