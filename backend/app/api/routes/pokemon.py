from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.models.pokemon import Pokemon
from app.schemas.pokemon import PokemonResponse

router = APIRouter(tags=["pokemon"])


@router.get("/pokemon", response_model=list[PokemonResponse])
async def list_pokemon(db: AsyncSession = Depends(get_session)):
    """Retourne la liste des 151 Pokémon triés par numéro de Pokédex."""
    result = await db.execute(select(Pokemon).order_by(Pokemon.pokedex_number))
    return result.scalars().all()


@router.get("/pokemon/{pokemon_id}", response_model=PokemonResponse)
async def get_pokemon(pokemon_id: int, db: AsyncSession = Depends(get_session)):
    """Retourne un Pokémon par son id interne (PK)."""
    result = await db.execute(select(Pokemon).where(Pokemon.id == pokemon_id))
    pokemon = result.scalar_one_or_none()
    if not pokemon:
        raise HTTPException(status_code=404, detail="Pokémon non trouvé")
    return pokemon
