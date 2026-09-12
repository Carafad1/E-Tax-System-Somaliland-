from tests.conftest import admin_login


def admin_headers(client):
    token = admin_login(client).get_json()["data"]["token"]
    return {"Authorization": f"Bearer {token}"}


def test_list_tax_types_is_public(client):
    resp = client.get("/api/tax-types")
    assert resp.status_code == 200
    assert len(resp.get_json()["data"]["items"]) == 1


def test_admin_create_tax_type(client):
    headers = admin_headers(client)
    resp = client.post(
        "/api/tax-types",
        json={"name": "Daily Tax", "frequency": "daily", "min_amount_slsh": 5000, "min_amount_usd": 0.5},
        headers=headers,
    )
    assert resp.status_code == 201


def test_admin_create_tax_type_rejects_invalid_frequency(client):
    headers = admin_headers(client)
    resp = client.post(
        "/api/tax-types",
        json={"name": "Monthly Tax", "frequency": "monthly", "min_amount_slsh": 5000, "min_amount_usd": 0.5},
        headers=headers,
    )
    assert resp.status_code == 422
    assert "frequency" in resp.get_json()["errors"]


def test_admin_update_tax_type_rejects_invalid_frequency(client):
    headers = admin_headers(client)
    resp = client.put(
        "/api/tax-types/1", json={"frequency": "business"}, headers=headers
    )
    assert resp.status_code == 422
    assert "frequency" in resp.get_json()["errors"]


def test_admin_update_tax_type(client):
    headers = admin_headers(client)
    resp = client.put(
        "/api/tax-types/1", json={"min_amount_slsh": 120000}, headers=headers
    )
    assert resp.status_code == 200
    assert resp.get_json()["data"]["tax_type"]["min_amount_slsh"] == 120000


def test_admin_deactivate_tax_type(client):
    headers = admin_headers(client)
    resp = client.delete("/api/tax-types/1", headers=headers)
    assert resp.status_code == 200

    listed = client.get("/api/tax-types").get_json()["data"]["items"]
    assert len(listed) == 0

    listed_all = client.get("/api/tax-types?active=false").get_json()["data"]["items"]
    assert len(listed_all) == 1
    assert listed_all[0]["is_active"] is False


def test_list_cities_is_public(client):
    resp = client.get("/api/cities")
    assert resp.status_code == 200
    assert len(resp.get_json()["data"]["items"]) == 1


def test_admin_create_city(client):
    headers = admin_headers(client)
    resp = client.post("/api/cities", json={"name": "Berbera", "region": "Sahil"}, headers=headers)
    assert resp.status_code == 201


def test_admin_cannot_create_duplicate_city(client):
    headers = admin_headers(client)
    resp = client.post("/api/cities", json={"name": "Hargeisa"}, headers=headers)
    assert resp.status_code == 409


def test_admin_deactivate_city(client):
    headers = admin_headers(client)
    resp = client.delete("/api/cities/1", headers=headers)
    assert resp.status_code == 200
    listed = client.get("/api/cities").get_json()["data"]["items"]
    assert len(listed) == 0
