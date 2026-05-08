import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.models.player import Player
from app.models.pokemon import Pokemon
from app.models.stats import PlayerStats
from app.schemas.player import PlayerCreate, PlayerResponse, PlayerUpdate

router = APIRouter(tags=["players"])


@router.post("/players", response_model=PlayerResponse, status_code=status.HTTP_201_CREATED)
async def create_player(
    payload: PlayerCreate,
    session: AsyncSession = Depends(get_session),
) -> PlayerResponse:
    """Crée un nouveau joueur avec un pseudo et un avatar Pokémon."""
    # Vérifier que le pokemon existe
    result = await session.execute(
        select(Pokemon).where(Pokemon.id == payload.avatar_pokemon_id)
    )
    pokemon = result.scalar_one_or_none()
    if pokemon is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pokemon with id {payload.avatar_pokemon_id} not found.",
        )

    # Créer le joueur
    now = datetime.now(tz=timezone.utc)
    player = Player(
        id=uuid.uuid4(),
        pseudo=payload.pseudo,
        avatar_pokemon_id=payload.avatar_pokemon_id,
        last_seen_at=now,
    )
    session.add(player)
    await session.flush()  # obtenir player.id avant de créer player_stats

    # Créer l'entrée vide dans player_stats
    player_stats = PlayerStats(player_id=player.id)
    session.add(player_stats)

    await session.commit()
    await session.refresh(player)
    return PlayerResponse.model_validate(player)


@router.get("/players/{player_id}", response_model=PlayerResponse)
async def get_player(
    player_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> PlayerResponse:
    """Retourne un joueur par son UUID et met à jour last_seen_at."""
    result = await session.execute(
        select(Player).where(Player.id == player_id)
    )
    player = result.scalar_one_or_none()
    if player is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Player {player_id} not found.",
        )

    # Mettre à jour last_seen_at
    player.last_seen_at = datetime.now(tz=timezone.utc)
    await session.commit()
    await session.refresh(player)
    return PlayerResponse.model_validate(player)


@router.put("/players/{player_id}", response_model=PlayerResponse)
async def update_player(
    player_id: uuid.UUID,
    payload: PlayerUpdate,
    session: AsyncSession = Depends(get_session),
) -> PlayerResponse:
    """Modifie le pseudo et/ou l'avatar Pokémon d'un joueur."""
    result = await session.execute(
        select(Player).where(Player.id == player_id)
    )
    player = result.scalar_one_or_none()
    if player is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Player {player_id} not found.",
        )

    # Valider et appliquer avatar_pokemon_id si fourni
    if payload.avatar_pokemon_id is not None:
        poke_result = await session.execute(
            select(Pokemon).where(Pokemon.id == payload.avatar_pokemon_id)
        )
        if poke_result.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pokemon with id {payload.avatar_pokemon_id} not found.",
            )
        player.avatar_pokemon_id = payload.avatar_pokemon_id

    if payload.pseudo is not None:
        player.pseudo = payload.pseudo

    player.last_seen_at = datetime.now(tz=timezone.utc)
    await session.commit()
    await session.refresh(player)
    return PlayerResponse.model_validate(player)
