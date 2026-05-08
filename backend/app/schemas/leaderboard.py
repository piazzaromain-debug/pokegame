from datetime import datetime
import uuid

from pydantic import BaseModel

from app.models.game import Difficulty, GameMode


class LeaderboardEntry(BaseModel):
    rank: int
    player_id: uuid.UUID
    pseudo: str
    avatar_pokemon_id: int
    final_score: int
    finished_at: datetime | None = None


class PlayerStatsResponse(BaseModel):
    player_id: uuid.UUID
    games_played: int
    games_won: int
    total_correct: int
    total_questions: int
    best_streak: int
    total_score: int
    accuracy: float  # total_correct / total_questions * 100
    pokemon_mistakes: dict  # {str(pokemon_id): count}
    pokemon_seen: list[int]
    pokemon_caught: list[int]

    model_config = {"from_attributes": True}


class GlobalStatsResponse(BaseModel):
    hardest_pokemon: list[dict]  # [{id, name_fr, sprite_url, error_rate}]
    total_games_played: int
    total_players: int
