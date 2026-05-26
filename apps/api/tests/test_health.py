from fastapi.testclient import TestClient

from main import app


def test_health_ok():
    with TestClient(app) as c:
        r = c.get("/health")
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert "version" in data
        assert "supabase" in data
