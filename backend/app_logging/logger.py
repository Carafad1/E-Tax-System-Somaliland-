import logging
import os
import sys

LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

_FORMATTER = logging.Formatter("%(asctime)s | %(levelname)s | %(name)s | %(message)s")
_shared_handlers = None


def _handlers():
    """One stdout handler + one file handler, created once and reused by
    every logger, so the log file is never opened more than once."""
    global _shared_handlers
    if _shared_handlers is None:
        stream_handler = logging.StreamHandler(sys.stdout)
        stream_handler.setFormatter(_FORMATTER)

        file_handler = logging.FileHandler(os.path.join(LOG_DIR, "etax.log"), encoding="utf-8")
        file_handler.setFormatter(_FORMATTER)

        _shared_handlers = (stream_handler, file_handler)
    return _shared_handlers


def get_logger(name="etax"):
    """Return a logger that writes to stdout and to logs/etax.log.

    Handlers are attached per logger (all sharing the same handler pair).
    A single "already configured" flag would only ever configure the FIRST
    logger created - every later one ("app", "auth", ...) would end up with
    no handlers and propagate to an unconfigured root, silently dropping
    everything below WARNING.
    """
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        for handler in _handlers():
            logger.addHandler(handler)
        logger.propagate = False
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
