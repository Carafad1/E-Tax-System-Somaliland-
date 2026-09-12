from tests.conftest import admin_login, register_citizen


def test_citizen_dashboard_stats(client):
    resp = register_citizen(client)
    headers = {"Authorization": f"Bearer {resp.get_json()['data']['token']}"}

    stats_resp = client.get("/api/dashboard/stats", headers=headers)
    assert stats_resp.status_code == 200
    body = stats_resp.get_json()["data"]
    assert "taxpayer_id" in body
    assert body["total_tax_paid"] == 0


def test_admin_dashboard_stats(client):
    register_citizen(client)
    headers = {"Authorization": f"Bearer {admin_login(client).get_json()['data']['token']}"}

    stats_resp = client.get("/api/dashboard/stats", headers=headers)
    assert stats_resp.status_code == 200
    body = stats_resp.get_json()["data"]
    assert body["total_citizens"] == 1
    assert "total_revenue" in body


def test_admin_reports_handle_empty_data_gracefully(client):
    headers = {"Authorization": f"Bearer {admin_login(client).get_json()['data']['token']}"}

    for endpoint in ["/api/dashboard/revenue", "/api/dashboard/payments", "/api/dashboard/cities", "/api/dashboard/payment-methods"]:
        resp = client.get(endpoint, headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()["success"] is True
