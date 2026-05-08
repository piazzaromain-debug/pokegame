import pytest
from httpx import AsyncClient, ASGITransport

# Import the bare FastAPI app (not the socketio wrapper) for HTTP-only tests.
# app.main.app is socketio.ASGIApp; fastapi_app is the underlying FastAPI instance.
from app.main import fastapi_app


@pytest.mark.asyncio
async def test_health_endpoint():
    """Le healthcheck retourne 200."""
    async with AsyncClient(
        transport=ASGITransport(app=fastapi_app), base_url="http://test"
    ) as client:
        response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_pokemon_list_empty():
    """GET /api/pokemon retourne une liste (même vide sans seed)."""
    async with AsyncClient(
        transport=ASGITransport(app=fastapi_app), base_url="http://test"
    ) as client:
        response = await client.get("/api/pokemon")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
