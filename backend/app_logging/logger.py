import logging
import os
import sys

LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

_configured = False


def get_logger(name="etax"):
    global _configured
    logger = logging.getLogger(name)
    if not _configured:
        logger.setLevel(logging.INFO)
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
        )

        stream_handler = logging.StreamHandler(sys.stdout)
        stream_handler.setFormatter(formatter)
        logger.addHandler(stream_handler)

        file_handler = logging.FileHandler(
            os.path.join(LOG_DIR, "etax.log"), encoding="utf-8"
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

        logger.propagate = False
        _configured = True
    return logger


SENSITIVE_KEYS = {
    "password",
    "confirm_password",
    "pin",
    "payment_pin",
    "confirm_pin",
    "jwt_secret",
    "secret_key",
    "token",
}


def safe_log_data(data: dict):
    """Return a copy of a dict with sensitive fields redacted, for safe logging."""
    if not isinstance(data, dict):
        return data
    redacted = {}
    for key, value in data.items():
        if key.lower() in SENSITIVE_KEYS:
            redacted[key] = "***REDACTED***"
        else:
            redacted[key] = value
    return redacted
