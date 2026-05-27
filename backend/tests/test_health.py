from fastapi.testclient import TestClient


def test_healthz():
    """Health endpoint returns ok without database connection."""
    from app.routes.health import router
    from fastapi import FastAPI

    test_app = FastAPI()
    test_app.include_router(router)
    client = TestClient(test_app)

    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
