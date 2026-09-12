from tests.conftest import admin_login


def admin_headers(client):
    token = admin_login(client).get_json()["data"]["token"]
    return {"Authorization": f"Bearer {token}"}


def create_citizen(client, headers, **overrides):
    payload = {
        "full_name": "Mohamed Ahmed Ibrahim",
        "phone": "+252634111222",
        "email": "mohamed.crud@example.com",
        "taxpayer_type": "individual",
    }
    payload.update(overrides)
    return client.post("/api/users", json=payload, headers=headers)


def test_admin_create_citizen(client):
    headers = admin_headers(client)
    resp = create_citizen(client, headers)
    assert resp.status_code == 201
    assert resp.get_json()["data"]["user"]["tin"].startswith("TIN-")


def test_admin_read_citizens_list(client):
    headers = admin_headers(client)
    create_citizen(client, headers)
    resp = client.get("/api/users", headers=headers)
    assert resp.status_code == 200
    body = resp.get_json()["data"]
    assert body["total"] == 1
    assert "page" in body and "pages" in body


def test_admin_update_citizen(client):
    headers = admin_headers(client)
    created = create_citizen(client, headers).get_json()["data"]["user"]

    resp = client.put(
        f"/api/users/{created['id']}", json={"full_name": "Updated Name"}, headers=headers
    )
    assert resp.status_code == 200
    assert resp.get_json()["data"]["user"]["full_name"] == "Updated Name"


def test_admin_delete_citizen(client):
    headers = admin_headers(client)
    created = create_citizen(client, headers).get_json()["data"]["user"]

    resp = client.delete(f"/api/users/{created['id']}", headers=headers)
    assert resp.status_code == 200

    follow_up = client.get(f"/api/users/{created['id']}", headers=headers)
    assert follow_up.status_code == 404


def test_admin_bulk_delete_citizens(client):
    headers = admin_headers(client)
    first = create_citizen(client, headers, phone="+252634111001").get_json()["data"]["user"]
    second = create_citizen(client, headers, phone="+252634111002", email="second@example.com").get_json()["data"]["user"]

    resp = client.post(
        "/api/users/bulk-delete", json={"ids": [first["id"], second["id"]]}, headers=headers
    )
    assert resp.status_code == 200
    assert resp.get_json()["data"]["deleted"] == 2


def test_admin_search_citizens(client):
    headers = admin_headers(client)
    create_citizen(client, headers)
    resp = client.get("/api/users?search=Mohamed", headers=headers)
    assert resp.status_code == 200
    assert resp.get_json()["data"]["total"] == 1

    resp_empty = client.get("/api/users?search=NoSuchPerson", headers=headers)
    assert resp_empty.get_json()["data"]["total"] == 0
