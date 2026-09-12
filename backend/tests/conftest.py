import pytest

from app import create_app
from config import TestConfig
from extensions import db as _db
from models import AdminUser, City, TaxType
from security.passwords import hash_password


@pytest.fixture()
def app(tmp_path):
    class _IsolatedTestConfig(TestConfig):
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{tmp_path}/test.db"

    application = create_app(_IsolatedTestConfig)

    with application.app_context():
        admin = AdminUser(
            username=application.config["ADMIN_USERNAME"],
            password_hash=hash_password(application.config["ADMIN_PASSWORD"]),
            full_name="Test Admin",
            role="admin",
        )
        city = City(name="Hargeisa", region="Woqooyi Galbeed")
        tax_type = TaxType(
            name="Yearly Tax", frequency="yearly", min_amount_slsh=100000, min_amount_usd=100
        )
        _db.session.add_all([admin, city, tax_type])
        _db.session.commit()

    yield application

    with application.app_context():
        _db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


def register_citizen(client, **overrides):
    payload = {
        "full_name": "Ahmed Mohamed",
        "phone": "+252634000099",
        "email": "ahmed.test@example.com",
        "password": "4821",
        "confirm_password": "4821",
        "taxpayer_type": "individual",
    }
    payload.update(overrides)
    return client.post("/api/register", json=payload)


def admin_login(client):
    return client.post("/api/admin/login", json={"username": "admin", "password": "1234"})
