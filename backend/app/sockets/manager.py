import asyncio
from dataclasses import dataclass, field


@dataclass
class GameRoom:
    game_id: str
    host_player_id: str
    players: dict[str, dict]  # player_id -> {pseudo, avatar_pokemon_id, score, sid}
    status: str = "waiting"
    current_question_index: int = -1
    questions: list[dict] = field(default_factory=list)


class GameRoomManager:
    """Gestionnaire centralisé des salles de jeu en mémoire."""

    def __init__(self) -> None:
        self._rooms: dict[str, GameRoom] = {}
        self._lock = asyncio.Lock()

    async def create_room(self, game_id: str, host_player_id: str) -> GameRoom:
        async with self._lock:
            room = GameRoom(game_id=game_id, host_player_id=host_player_id, players={})
            self._rooms[game_id] = room
            return room

    async def get_room(self, game_id: str) -> GameRoom | None:
        return self._rooms.get(game_id)

    async def add_player(
        self,
        game_id: str,
        player_id: str,
        pseudo: str,
        avatar_pokemon_id: int,
        sid: str,
    ) -> bool:
        async with self._lock:
            room = self._rooms.get(game_id)
            if not room:
                return False
            room.players[player_id] = {
                "pseudo": pseudo,
                "avatar_pokemon_id": avatar_pokemon_id,
                "sid": sid,
                "score": 0,
            }
            return True

    async def remove_player(self, game_id: str, player_id: str) -> None:
        async with self._lock:
            room = self._rooms.get(game_id)
            if room:
                room.players.pop(player_id, None)

    async def get_waiting_games_summary(self) -> list[dict]:
        """Résumé des parties en attente (pour lobby:games_updated)."""
        return [
            {
                "game_id": r.game_id,
                "players_count": len(r.players),
                "status": r.status,
            }
            for r in self._rooms.values()
            if r.status == "waiting"
        ]


game_room_manager = GameRoomManager()
