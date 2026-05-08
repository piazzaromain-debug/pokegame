import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.game import Difficulty, GameMode, GameStatus


class GameCreate(BaseModel):
    host_player_id: uuid.UUID
    mode: GameMode
    difficulty: Difficulty
    nb_questions: int = Field(..., ge=1, le=100)
    max_players: int = Field(..., ge=2, le=10)


class GameResponse(BaseModel):
    id: uuid.UUID
    host_player_id: uuid.UUID
    mode: GameMode
    difficulty: Difficulty
    nb_questions: int
    max_players: int
    status: GameStatus
    created_at: datetime
    started_at: datetime | None = None
    finished_at: datetime | None = None

    model_config = {"from_attributes": True}


class GameListItem(BaseModel):
    """Version allégée pour le listing lobby."""

    id: uuid.UUID
    host_pseudo: str
    host_avatar_pokemon_id: int
    mode: GameMode
    difficulty: Difficulty
    nb_questions: int
    max_players: int
    players_count: int
    status: GameStatus
