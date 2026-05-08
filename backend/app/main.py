import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.logging_config import setup_logging
from app.sockets.server import sio

setup_logging()

# IMPORTANT : python-socketio monte sur l'app ASGI FastAPI
# On utilise socketio.ASGIApp qui wrape notre FastAPI app
# Voir : https://python-socketio.readthedocs.io/en/latest/server.html#aiohttp

fastapi_app = FastAPI(title="PokéGame API", version="0.1.0")

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@fastapi_app.get("/api/health")
async def health() -> dict:
    return {"status": "ok", "service": "pokegame-backend"}


# Inclure les routers (squelettes pour l'instant)
from app.api.routes import achievements, games, leaderboard, players, pokemon, stats  # noqa: E402

fastapi_app.include_router(pokemon.router, prefix="/api")
fastapi_app.include_router(players.router, prefix="/api")
fastapi_app.include_router(games.router, prefix="/api")
fastapi_app.include_router(leaderboard.router, prefix="/api")
fastapi_app.include_router(stats.router, prefix="/api")
fastapi_app.include_router(achievements.router, prefix="/api")

# Importer les handlers socket pour les enregistrer sur sio
import app.sockets.game  # noqa: F401, E402
import app.sockets.lobby  # noqa: F401, E402

# Mount socketio sur la même app ASGI
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
