import asyncio


class GameRoomManager:
    """Gestionnaire centralisé des salles de jeu en mémoire."""

    def __init__(self) -> None:
        self._lock: asyncio.Lock = asyncio.Lock()
        self.rooms: dict[str, dict] = {}

    async def create_room(self, room_id: str, data: dict) -> None:
        async with self._lock:
            self.rooms[room_id] = data

    async def get_room(self, room_id: str) -> dict | None:
        async with self._lock:
            return self.rooms.get(room_id)

    async def update_room(self, room_id: str, data: dict) -> None:
        async with self._lock:
            if room_id in self.rooms:
                self.rooms[room_id].update(data)

    async def delete_room(self, room_id: str) -> None:
        async with self._lock:
            self.rooms.pop(room_id, None)

    async def list_rooms(self) -> list[str]:
        async with self._lock:
            return list(self.rooms.keys())


game_room_manager = GameRoomManager()
