import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


def _bool_env(name, default=False):
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in ("1", "true", "yes", "on")


class Config:
    FLASK_ENV = os.environ.get("FLASK_ENV", "development")
    DEBUG = FLASK_ENV == "development"

    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-me")
    JWT_EXPIRATION_HOURS = int(os.environ.get("JWT_EXPIRATION_HOURS", 8))

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///" + os.path.join(BASE_DIR, "etax_somaliland.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    if SQLALCHEMY_DATABASE_URI.startswith("mysql"):
        SQLALCHEMY_ENGINE_OPTIONS = {
            "pool_pre_ping": True,
            "pool_recycle": 280,
            "pool_size": 10,
            "max_overflow": 20,
        }
        # Some managed MySQL providers (e.g. Aiven) require TLS and reject
        # plain connections outright. Only applied when a CA cert path is
        # actually configured, so hosts that don't need it (a local MySQL,
        # or a provider with its own default trust) are unaffected.
        db_ssl_ca_path = os.environ.get("DB_SSL_CA_PATH")
        if db_ssl_ca_path:
            SQLALCHEMY_ENGINE_OPTIONS["connect_args"] = {"ssl": {"ca": db_ssl_ca_path}}
    else:
        SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "1234")

    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:8081")

    USD_TO_SLSH_RATE = float(os.environ.get("USD_TO_SLSH_RATE", 9000))
    YEARLY_TAX_MIN_SLSH = float(os.environ.get("YEARLY_TAX_MIN_SLSH", 100000))
    DAILY_TAX_MIN_SLSH = float(os.environ.get("DAILY_TAX_MIN_SLSH", 5000))

    RATELIMIT_STORAGE_URI = os.environ.get("RATELIMIT_STORAGE_URI", "memory://")

    JSON_SORT_KEYS = False

    # Idempotent: safe to run on every startup. Ensures a fresh deployment
    # (new database) always has the admin account, cities and tax types
    # without a separate manual seeding step.
    AUTO_SEED_ON_STARTUP = _bool_env("AUTO_SEED_ON_STARTUP", True)


def jwt_expiration_delta():
    return timedelta(hours=Config.JWT_EXPIRATION_HOURS)


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_ENGINE_OPTIONS = {}
    RATELIMIT_ENABLED = False
    SECRET_KEY = "test-secret-key"
    JWT_SECRET_KEY = "test-jwt-secret-key"
    AUTO_SEED_ON_STARTUP = False
