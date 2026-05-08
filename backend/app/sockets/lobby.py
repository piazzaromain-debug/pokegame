from loguru import logger

from app.sockets.server import sio


@sio.on("lobby:join")
async def on_lobby_join(sid: str, data: dict) -> None:
    """Handler pour lobby:join."""
    logger.debug(f"[lobby:join] sid={sid} data={data}")


@sio.on("lobby:leave")
async def on_lobby_leave(sid: str, data: dict) -> None:
    """Handler pour lobby:leave."""
    logger.debug(f"[lobby:leave] sid={sid} data={data}")
