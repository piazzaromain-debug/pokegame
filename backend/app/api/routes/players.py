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


@router.get("/players/search", response_model=PlayerResponse | None)
async def search_player_by_pseudo(
    pseudo: str,
    session: AsyncSession = Depends(get_session),
) -> PlayerResponse | None:
    """Recherche un joueur par son pseudo exact (pour la reconnexion après déconnexion)."""
    result = await session.execute(
        select(Player).where(Player.pseudo == pseudo)
    )
    player = result.scalars().first()
    if player is None:
        return None
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


@router.get("/players/{player_id}/pokedex")
async def get_player_pokedex(
    player_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
):
    """Pokédex personnel : pokemon_seen et pokemon_caught du joueur."""
    result = await db.execute(
        select(PlayerStats).where(PlayerStats.player_id == player_id)
    )
    stats = result.scalar_one_or_none()
    if not stats:
        return {"pokemon_seen": [], "pokemon_caught": []}
    return {
        "pokemon_seen": stats.pokemon_seen or [],
        "pokemon_caught": stats.pokemon_caught or [],
    }


@router.get("/players/{player_id}/stats")
async def get_player_stats(
    player_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
):
    """Stats détaillées d'un joueur."""
    result = await db.execute(
        select(PlayerStats).where(PlayerStats.player_id == player_id)
    )
    stats = result.scalar_one_or_none()
    if not stats:
        raise HTTPException(status_code=404, detail="Stats non trouvées")

    accuracy = 0.0
    if stats.total_questions and stats.total_questions > 0:
        accuracy = round(stats.total_correct / stats.total_questions * 100, 1)

    return {
        "player_id": str(player_id),
        "games_played": stats.games_played or 0,
        "games_won": stats.games_won or 0,
        "total_correct": stats.total_correct or 0,
        "total_questions": stats.total_questions or 0,
        "best_streak": stats.best_streak or 0,
        "total_score": stats.total_score or 0,
        "accuracy": accuracy,
        "pokemon_mistakes": stats.pokemon_mistakes or {},
        "pokemon_seen": stats.pokemon_seen or [],
        "pokemon_caught": stats.pokemon_caught or [],
    }
