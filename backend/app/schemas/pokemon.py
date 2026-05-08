from datetime import datetime

from pydantic import BaseModel


class PokemonBase(BaseModel):
    pokedex_number: int
    name_fr: str
    sprite_url: str | None = None
    sprite_shiny_url: str | None = None
    cry_url: str | None = None
    types: list[str]
    pokedex_description: str | None = None


class PokemonResponse(PokemonBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
