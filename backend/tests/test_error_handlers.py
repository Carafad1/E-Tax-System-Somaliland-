import sqlalchemy.orm
from sqlalchemy.exc import OperationalError

from tests.conftest import admin_login


def test_database_error_returns_clean_503_and_rolls_back(client, monkeypatch):
    """A dropped DB connection must surface as a clear, retryable 503 - not a
    raw 500 - and must not leave a broken session for the next request."""
    headers = {"Authorization": f"Bearer {admin_login(client).get_json()['data']['token']}"}

    def _boom(*args, **kwargs):
        raise OperationalError("SELECT 1", {}, Exception("server has gone away"))

    monkeypatch.setattr(sqlalchemy.orm.Query, "all", _boom)

    resp = client.get("/api/cities", headers=headers)

    assert resp.status_code == 503
    body = resp.get_json()
    assert body["success"] is False
    assert "temporarily unavailable" in body["message"].lower()

    # The session must be usable again on the very next request (proves the
    # error handler's db.session.rollback() actually cleared the failure).
    monkeypatch.undo()
    recovery_resp = client.get("/api/cities", headers=headers)
    assert recovery_resp.status_code == 200
