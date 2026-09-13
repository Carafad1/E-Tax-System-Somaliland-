"""Regression tests for bugs that had reached the running system.

Each test here pins behaviour that was previously wrong, so the same defect
cannot come back unnoticed.
"""
from tests.conftest import admin_login, register_citizen


def _admin_headers(client):
    return {"Authorization": f"Bearer {admin_login(client).get_json()['data']['token']}"}


def _citizen_headers(client, **overrides):
    resp = register_citizen(client, **overrides)
    return {"Authorization": f"Bearer {resp.get_json()['data']['token']}"}


# --- Authorization ------------------------------------------------------
# These four endpoints expose revenue analytics and taxpayer PII (name,
# phone, TIN, city) and were previously reachable with no token at all.

DASHBOARD_ADMIN_ONLY = [
    "/api/dashboard/overview",
    "/api/dashboard/currency",
    "/api/dashboard/tax-types",
    "/api/dashboard/recent-taxpayers",
]


def test_dashboard_endpoints_reject_anonymous_callers(client):
    for endpoint in DASHBOARD_ADMIN_ONLY:
        assert client.get(endpoint).status_code == 401, endpoint


def test_dashboard_endpoints_reject_citizen_callers(client):
    headers = _citizen_headers(client)
    for endpoint in DASHBOARD_ADMIN_ONLY:
        assert client.get(endpoint, headers=headers).status_code == 403, endpoint


def test_dashboard_endpoints_allow_admin(client):
    headers = _admin_headers(client)
    for endpoint in DASHBOARD_ADMIN_ONLY:
        resp = client.get(endpoint, headers=headers)
        assert resp.status_code == 200, endpoint
        assert resp.get_json()["success"] is True


# --- Input handling that used to raise a 500 ----------------------------


def test_register_with_null_phone_returns_validation_error(client):
    # normalize_phone() ran before the validation errors were returned, so a
    # JSON null here raised AttributeError inside the request.
    resp = client.post(
        "/api/register",
        json={
            "full_name": "Ayaan Ali",
            "phone": None,
            "password": "1234",
            "confirm_password": "1234",
        },
    )
    assert resp.status_code == 422
    assert "phone" in resp.get_json()["errors"]


def test_payment_without_currency_defaults_to_slsh(client):
    # The payload validator accepts a missing "currency" (defaulting to
    # SLSH), but the route then indexed payload["currency"] directly.
    headers = _citizen_headers(client)
    client.post("/api/profile/payment-pin", json={"pin": "1234", "confirm_pin": "1234"}, headers=headers)

    tax_type_id = client.get("/api/tax-types").get_json()["data"]["items"][0]["id"]
    resp = client.post(
        "/api/payments",
        json={
            "tax_type_id": tax_type_id,
            "amount": 150000,
            "payment_method": "ZAAD",
            "pin": "1234",
        },
        headers=headers,
    )
    assert resp.status_code == 201, resp.get_json()
    assert resp.get_json()["data"]["payment"]["currency"] == "SLSH"


def test_admin_cannot_record_payment_with_unknown_method(client):
    headers = _admin_headers(client)
    citizen_id = register_citizen(client).get_json()["data"]["user"]["id"]
    tax_type_id = client.get("/api/tax-types").get_json()["data"]["items"][0]["id"]

    resp = client.post(
        "/api/payments",
        json={
            "user_id": citizen_id,
            "tax_type_id": tax_type_id,
            "amount": 150000,
            "payment_method": "NOT_A_METHOD",
        },
        headers=headers,
    )
    assert resp.status_code == 422
    assert "payment_method" in resp.get_json()["errors"]


def test_creating_citizen_with_duplicate_id_number_is_rejected(client):
    # users.id_number is UNIQUE; the admin create path never checked it, so a
    # repeat value hit the constraint and surfaced as a 500.
    headers = _admin_headers(client)
    payload = {
        "full_name": "Hodan Jama",
        "phone": "+252634000111",
        "id_number": "SL-000111",
        "password": "1234",
        "confirm_password": "1234",
    }
    assert client.post("/api/users", json=payload, headers=headers).status_code == 201

    payload["phone"] = "+252634000222"
    resp = client.post("/api/users", json=payload, headers=headers)
    assert resp.status_code == 422
    assert "id_number" in resp.get_json()["errors"]


def test_renaming_a_city_onto_an_existing_name_is_rejected(client):
    headers = _admin_headers(client)
    created = client.post("/api/cities", json={"name": "Berbera"}, headers=headers)
    city_id = created.get_json()["data"]["city"]["id"]

    resp = client.put(f"/api/cities/{city_id}", json={"name": "Hargeisa"}, headers=headers)
    assert resp.status_code == 409


def test_renaming_a_tax_type_onto_an_existing_name_is_rejected(client):
    headers = _admin_headers(client)
    created = client.post("/api/tax-types", json={"name": "Daily Tax", "frequency": "daily"}, headers=headers)
    tax_type_id = created.get_json()["data"]["tax_type"]["id"]

    resp = client.put(f"/api/tax-types/{tax_type_id}", json={"name": "Yearly Tax"}, headers=headers)
    assert resp.status_code == 409


def test_update_citizen_rejects_unknown_status(client):
    headers = _admin_headers(client)
    citizen_id = register_citizen(client).get_json()["data"]["user"]["id"]

    resp = client.put(f"/api/users/{citizen_id}", json={"status": "banished"}, headers=headers)
    assert resp.status_code == 422
    assert "status" in resp.get_json()["errors"]


# --- Reporting ----------------------------------------------------------


def test_csv_export_neutralizes_formula_cells(client):
    # A cell starting with "=" is evaluated as a formula when the exported
    # report is opened in a spreadsheet. City names accept free text, so one
    # reaches the citizens export unfiltered.
    headers = _admin_headers(client)
    city = client.post("/api/cities", json={"name": "=cmd|calc"}, headers=headers)
    city_id = city.get_json()["data"]["city"]["id"]

    citizen_id = register_citizen(client).get_json()["data"]["user"]["id"]
    client.put(f"/api/users/{citizen_id}", json={"city_id": city_id}, headers=headers)

    resp = client.get("/api/reports/export?type=citizens", headers=headers)
    assert resp.status_code == 200
    body = resp.get_data(as_text=True)
    assert "'=cmd|calc" in body
    assert ",=cmd|calc" not in body
