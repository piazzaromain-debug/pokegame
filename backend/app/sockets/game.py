from loguru import logger

from app.sockets.server import sio


@sio.on("game:join")
async def on_game_join(sid: str, data: dict) -> None:
    """Handler pour game:join."""
    logger.debug(f"[game:join] sid={sid} data={data}")


@sio.on("game:leave")
async def on_game_leave(sid: str, data: dict) -> None:
    """Handler pour game:leave."""
    logger.debug(f"[game:leave] sid={sid} data={data}")


@sio.on("game:start")
async def on_game_start(sid: str, data: dict) -> None:
    """Handler pour game:start."""
    logger.debug(f"[game:start] sid={sid} data={data}")


@sio.on("game:answer")
async def on_game_answer(sid: str, data: dict) -> None:
    """Handler pour game:answer."""
    logger.debug(f"[game:answer] sid={sid} data={data}")


@sio.on("game:react")
async def on_game_react(sid: str, data: dict) -> None:
    """Handler pour game:react."""
    logger.debug(f"[game:react] sid={sid} data={data}")
