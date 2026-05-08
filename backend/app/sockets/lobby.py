from loguru import logger

from app.sockets.manager import game_room_manager
from app.sockets.server import sio


@sio.event
async def connect(sid, environ):
    logger.debug(f"Client connected: {sid}")


@sio.event
async def disconnect(sid):
    logger.debug(f"Client disconnected: {sid}")


@sio.on("lobby:join")
async def on_lobby_join(sid, data=None):
    """Le client rejoint le lobby — il reçoit la liste des parties en attente."""
    await sio.enter_room(sid, "lobby")
    # Envoyer la liste des parties en attente (depuis le manager en mémoire)
    summary = await game_room_manager.get_waiting_games_summary()
    await sio.emit("lobby:games_updated", summary, to=sid)
    logger.info(f"Player {sid} joined lobby")


@sio.on("lobby:leave")
async def on_lobby_leave(sid, data=None):
    await sio.leave_room(sid, "lobby")
    logger.debug(f"Player {sid} left lobby")
