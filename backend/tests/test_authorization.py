from tests.conftest import admin_login, register_citizen


def citizen_token(client):
    resp = register_citizen(client)
    return resp.get_json()["data"]["token"]


def test_citizen_cannot_access_admin_users_list(client):
    token = citizen_token(client)
    resp = client.get("/api/users", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


def test_citizen_cannot_access_admin_dashboard_revenue(client):
    token = citizen_token(client)
    resp = client.get("/api/dashboard/revenue", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


def test_citizen_cannot_delete_tax_types(client):
    token = citizen_token(client)
    resp = client.delete("/api/tax-types/1", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


def test_citizen_cannot_view_audit_logs(client):
    token = citizen_token(client)
    resp = client.get("/api/audit-logs", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


def test_admin_can_access_admin_users_list(client):
    token = admin_login(client).get_json()["data"]["token"]
    resp = client.get("/api/users", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200


def test_unauthenticated_request_is_rejected(client):
    resp = client.get("/api/users")
    assert resp.status_code == 401


def test_no_stack_trace_leaked_on_error(client):
    resp = client.get("/api/users/999999")
    # unauthenticated -> 401, never a raw traceback
    body = resp.get_json()
    assert "Traceback" not in str(body)
    assert "traceback" not in str(body).lower()
