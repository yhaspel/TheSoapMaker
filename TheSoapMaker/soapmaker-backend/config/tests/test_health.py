import pytest


@pytest.mark.django_db
def test_health_endpoint(client):
    response = client.get("/api/v1/health/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.django_db
def test_swagger_ui_loads(client):
    response = client.get("/api/schema/swagger-ui/")
    assert response.status_code == 200
    assert b"swagger" in response.content.lower()


@pytest.mark.django_db
def test_schema_endpoint(client):
    response = client.get("/api/schema/")
    assert response.status_code == 200
