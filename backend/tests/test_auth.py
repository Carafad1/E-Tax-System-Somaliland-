from tests.conftest import admin_login, register_citizen


def test_health_check(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.get_json()["success"] is True


def test_register_success(client):
    resp = register_citizen(client)
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["success"] is True
    assert body["data"]["token"]
    assert body["data"]["user"]["tin"].startswith("TIN-")
    assert "password" not in body["data"]["user"]
    assert "password_hash" not in body["data"]["user"]


def test_register_rejects_short_name(client):
    resp = register_citizen(client, full_name="Ab")
    assert resp.status_code == 422
    assert "full_name" in resp.get_json()["errors"]


def test_register_rejects_mismatched_passwords(client):
    resp = register_citizen(client, confirm_password="different")
    assert resp.status_code == 422
    assert "confirm_password" in resp.get_json()["errors"]


def test_register_rejects_duplicate_phone(client):
    register_citizen(client)
    resp = register_citizen(client, email="other@example.com")
    assert resp.status_code == 422
    assert "phone" in resp.get_json()["errors"]


def test_login_success(client):
    register_citizen(client)
    resp = client.post(
        "/api/login", json={"identifier": "+252634000099", "password": "4821"}
    )
    assert resp.status_code == 200
    assert resp.get_json()["data"]["token"]


def test_login_wrong_password(client):
    register_citizen(client)
    resp = client.post(
        "/api/login", json={"identifier": "+252634000099", "password": "WrongPass1"}
    )
    assert resp.status_code == 401
    assert "stack" not in resp.get_json()


def test_admin_login_success(client):
    resp = admin_login(client)
    assert resp.status_code == 200
    assert resp.get_json()["data"]["token"]
    assert resp.get_json()["data"]["admin"]["role"] == "admin"


def test_admin_login_wrong_credentials(client):
    resp = client.post("/api/admin/login", json={"username": "admin", "password": "wrong"})
    assert resp.status_code == 401


def test_me_endpoint_requires_token(client):
    resp = client.get("/api/me")
    assert resp.status_code == 401


def test_me_endpoint_with_valid_token(client):
    register_resp = register_citizen(client)
    token = register_resp.get_json()["data"]["token"]
    resp = client.get("/api/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.get_json()["data"]["role"] == "citizen"


def test_me_endpoint_with_invalid_token(client):
    resp = client.get("/api/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert resp.status_code == 401
