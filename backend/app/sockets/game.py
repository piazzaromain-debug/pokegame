from loguru import logger

from app.sockets.manager import game_room_manager
from app.sockets.server import sio


@sio.on("game:join")
async def on_game_join(sid: str, data: dict) -> None:
    """
    data: {game_id, player_id, pseudo, avatar_pokemon_id}
    """
    game_id = data.get("game_id")
    player_id = data.get("player_id")
    pseudo = data.get("pseudo")
    avatar_pokemon_id = data.get("avatar_pokemon_id")

    if not all([game_id, player_id, pseudo]):
        await sio.emit("error", {"message": "Données manquantes"}, to=sid)
        return

    room_name = f"game:{game_id}"
    await sio.enter_room(sid, room_name)

    success = await game_room_manager.add_player(
        game_id, player_id, pseudo, avatar_pokemon_id, sid
    )

    if not success:
        # Crée la room si elle n'existe pas encore (cas où l'hôte rejoint en premier)
        await game_room_manager.create_room(game_id, player_id)
        await game_room_manager.add_player(game_id, player_id, pseudo, avatar_pokemon_id, sid)

    # Broadcast à toute la room
    await sio.emit(
        "game:player_joined",
        {"player_id": player_id, "pseudo": pseudo, "avatar_pokemon_id": avatar_pokemon_id},
        room=room_name,
    )

    # Envoyer à ce joueur la liste des joueurs déjà présents
    room = await game_room_manager.get_room(game_id)
    if room:
        await sio.emit("game:room_state", {"players": list(room.players.values())}, to=sid)

    logger.info(f"Player {player_id} ({pseudo}) joined game {game_id}")


@sio.on("game:leave")
async def on_game_leave(sid: str, data: dict) -> None:
    game_id = data.get("game_id")
    player_id = data.get("player_id")

    if game_id and player_id:
        room_name = f"game:{game_id}"
        await sio.leave_room(sid, room_name)
        await game_room_manager.remove_player(game_id, player_id)
        await sio.emit("game:player_left", {"player_id": player_id}, room=room_name)
        logger.info(f"Player {player_id} left game {game_id}")


@sio.on("game:start")
async def on_game_start(sid: str, data: dict) -> None:
    """Handler pour game:start (Phase 5)."""
    logger.debug(f"[game:start] sid={sid} data={data}")


@sio.on("game:answer")
async def on_game_answer(sid: str, data: dict) -> None:
    """Handler pour game:answer (Phase 5)."""
    logger.debug(f"[game:answer] sid={sid} data={data}")


@sio.on("game:react")
async def on_game_react(sid: str, data: dict) -> None:
    """Handler pour game:react (Phase 5)."""
    logger.debug(f"[game:react] sid={sid} data={data}")
