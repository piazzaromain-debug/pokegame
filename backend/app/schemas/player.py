import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class PlayerCreate(BaseModel):
    pseudo: str = Field(..., min_length=2, max_length=30, strip_whitespace=True)
    avatar_pokemon_id: int = Field(..., ge=1)


class PlayerUpdate(BaseModel):
    pseudo: str | None = Field(default=None, min_length=2, max_length=30, strip_whitespace=True)
    avatar_pokemon_id: int | None = Field(default=None, ge=1)


class PlayerResponse(BaseModel):
    id: uuid.UUID
    pseudo: str
    avatar_pokemon_id: int | None
    created_at: datetime
    last_seen_at: datetime | None

    model_config = {"from_attributes": True}
