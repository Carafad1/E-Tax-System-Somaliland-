from tests.conftest import admin_login, register_citizen


def citizen_session(client):
    resp = register_citizen(client)
    data = resp.get_json()["data"]
    headers = {"Authorization": f"Bearer {data['token']}"}
    return headers, data["user"]


def set_pin(client, headers, pin="1234"):
    return client.post(
        "/api/profile/payment-pin", json={"pin": pin, "confirm_pin": pin}, headers=headers
    )


def test_payment_requires_pin_setup(client):
    headers, _ = citizen_session(client)
    resp = client.post(
        "/api/payments",
        json={"tax_type_id": 1, "amount": 100000, "currency": "SLSH", "payment_method": "ZAAD", "pin": "1234"},
        headers=headers,
    )
    assert resp.status_code == 422
    assert "pin" in resp.get_json()["errors"]


def test_payment_rejects_amount_below_minimum(client):
    headers, _ = citizen_session(client)
    set_pin(client, headers)
    resp = client.post(
        "/api/payments",
        json={"tax_type_id": 1, "amount": 100, "currency": "SLSH", "payment_method": "ZAAD", "pin": "1234"},
        headers=headers,
    )
    assert resp.status_code == 422
    assert "amount" in resp.get_json()["errors"]


def test_payment_success_generates_receipt(client):
    headers, _ = citizen_session(client)
    set_pin(client, headers)
    resp = client.post(
        "/api/payments",
        json={"tax_type_id": 1, "amount": 100000, "currency": "SLSH", "payment_method": "ZAAD", "pin": "1234"},
        headers=headers,
    )
    assert resp.status_code == 201
    body = resp.get_json()["data"]
    assert body["payment"]["status"] == "completed"
    assert body["receipt"]["receipt_number"].startswith("RCPT-")
    assert "pin" not in body["payment"]
    assert "payment_pin_hash" not in body["payment"]


def test_payment_rejects_wrong_pin(client):
    headers, _ = citizen_session(client)
    set_pin(client, headers)
    resp = client.post(
        "/api/payments",
        json={"tax_type_id": 1, "amount": 100000, "currency": "SLSH", "payment_method": "ZAAD", "pin": "9999"},
        headers=headers,
    )
    assert resp.status_code == 422
    assert "pin" in resp.get_json()["errors"]


def test_duplicate_payment_is_rejected(client):
    headers, _ = citizen_session(client)
    set_pin(client, headers)
    payload = {"tax_type_id": 1, "amount": 100000, "currency": "SLSH", "payment_method": "ZAAD", "pin": "1234"}

    first = client.post("/api/payments", json=payload, headers=headers)
    assert first.status_code == 201

    second = client.post("/api/payments", json=payload, headers=headers)
    assert second.status_code == 409


def test_receipt_verification_is_public_and_safe(client):
    headers, _ = citizen_session(client)
    set_pin(client, headers)
    payment_resp = client.post(
        "/api/payments",
        json={"tax_type_id": 1, "amount": 100000, "currency": "SLSH", "payment_method": "ZAAD", "pin": "1234"},
        headers=headers,
    )
    reference_id = payment_resp.get_json()["data"]["payment"]["reference_id"]

    verify_resp = client.get(f"/api/receipts/{reference_id}/verify")
    assert verify_resp.status_code == 200
    body = verify_resp.get_json()["data"]
    assert body["verified"] is True
    assert "password" not in body
    assert "pin" not in body


def test_receipt_verification_unknown_reference(client):
    resp = client.get("/api/receipts/ETX-2026-999999/verify")
    assert resp.status_code == 404


def test_receipt_pdf_download(client):
    headers, _ = citizen_session(client)
    set_pin(client, headers)
    payment_resp = client.post(
        "/api/payments",
        json={"tax_type_id": 1, "amount": 100000, "currency": "SLSH", "payment_method": "ZAAD", "pin": "1234"},
        headers=headers,
    )
    reference_id = payment_resp.get_json()["data"]["payment"]["reference_id"]

    pdf_resp = client.get(f"/api/receipts/{reference_id}/pdf", headers=headers)
    assert pdf_resp.status_code == 200
    assert pdf_resp.mimetype == "application/pdf"
    assert pdf_resp.data[:4] == b"%PDF"


def test_other_citizen_cannot_view_receipt(client):
    headers_a, _ = citizen_session(client)
    set_pin(client, headers_a)
    payment_resp = client.post(
        "/api/payments",
        json={"tax_type_id": 1, "amount": 100000, "currency": "SLSH", "payment_method": "ZAAD", "pin": "1234"},
        headers=headers_a,
    )
    reference_id = payment_resp.get_json()["data"]["payment"]["reference_id"]

    other_resp = register_citizen(client, phone="+252634000088", email="other2@example.com")
    headers_b = {"Authorization": f"Bearer {other_resp.get_json()['data']['token']}"}

    resp = client.get(f"/api/receipts/{reference_id}", headers=headers_b)
    assert resp.status_code == 403


def test_admin_can_update_payment_status_and_logs_audit(client):
    headers_citizen, _ = citizen_session(client)
    set_pin(client, headers_citizen)
    payment_resp = client.post(
        "/api/payments",
        json={"tax_type_id": 1, "amount": 100000, "currency": "SLSH", "payment_method": "ZAAD", "pin": "1234"},
        headers=headers_citizen,
    )
    payment_id = payment_resp.get_json()["data"]["payment"]["id"]

    admin_headers = {"Authorization": f"Bearer {admin_login(client).get_json()['data']['token']}"}
    update_resp = client.put(
        f"/api/payments/{payment_id}", json={"status": "cancelled"}, headers=admin_headers
    )
    assert update_resp.status_code == 200
    assert update_resp.get_json()["data"]["payment"]["status"] == "cancelled"

    audit_resp = client.get("/api/audit-logs", headers=admin_headers)
    actions = [log["action"] for log in audit_resp.get_json()["data"]["items"]]
    assert "update" in actions


def test_admin_delete_payment(client):
    headers_citizen, _ = citizen_session(client)
    set_pin(client, headers_citizen)
    payment_resp = client.post(
        "/api/payments",
        json={"tax_type_id": 1, "amount": 100000, "currency": "SLSH", "payment_method": "ZAAD", "pin": "1234"},
        headers=headers_citizen,
    )
    payment_id = payment_resp.get_json()["data"]["payment"]["id"]

    admin_headers = {"Authorization": f"Bearer {admin_login(client).get_json()['data']['token']}"}
    delete_resp = client.delete(f"/api/payments/{payment_id}", headers=admin_headers)
    assert delete_resp.status_code == 200
