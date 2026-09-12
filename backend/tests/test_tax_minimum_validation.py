from tests.conftest import admin_login
from tests.test_payments_and_receipts import citizen_session, set_pin


def create_tax_type(client, min_amount_slsh, min_amount_usd, name="Maalinle Test"):
    token = admin_login(client).get_json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.post(
        "/api/tax-types",
        json={
            "name": name,
            "frequency": "daily",
            "min_amount_slsh": min_amount_slsh,
            "min_amount_usd": min_amount_usd,
        },
        headers=headers,
    )
    return resp.get_json()["data"]["tax_type"]["id"]


def pay(client, headers, tax_type_id, amount, currency):
    return client.post(
        "/api/payments",
        json={
            "tax_type_id": tax_type_id,
            "amount": amount,
            "currency": currency,
            "payment_method": "ZAAD",
            "pin": "1234",
        },
        headers=headers,
    )


def test_slsh_minimum_boundary(client):
    tax_type_id = create_tax_type(client, min_amount_slsh=3000, min_amount_usd=0.30)
    headers, _ = citizen_session(client)
    set_pin(client, headers)

    below = pay(client, headers, tax_type_id, 2999, "SLSH")
    assert below.status_code == 422
    assert "amount" in below.get_json()["errors"]

    at_minimum = pay(client, headers, tax_type_id, 3000, "SLSH")
    assert at_minimum.status_code == 201

    above = pay(client, headers, tax_type_id, 5000, "SLSH")
    assert above.status_code == 201


def test_usd_minimum_boundary(client):
    tax_type_id = create_tax_type(client, min_amount_slsh=3000, min_amount_usd=0.30, name="Maalinle Test USD")
    headers, _ = citizen_session(client)
    set_pin(client, headers)

    below = pay(client, headers, tax_type_id, 0.29, "USD")
    assert below.status_code == 422
    assert "amount" in below.get_json()["errors"]

    at_minimum = pay(client, headers, tax_type_id, 0.30, "USD")
    assert at_minimum.status_code == 201

    above = pay(client, headers, tax_type_id, 10, "USD")
    assert above.status_code == 201
