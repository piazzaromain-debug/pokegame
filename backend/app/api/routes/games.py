import uuid

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.models.game import Game, GameStatus
from app.models.game_player import GamePlayer
from app.models.player import Player
from app.schemas.game import GameCreate, GameListItem, GameResponse
from app.sockets.server import sio

router = APIRouter(tags=["games"])


@router.get("/games", response_model=list[GameListItem])
async def list_games(session: AsyncSession = Depends(get_session)) -> list[GameListItem]:
    """Liste les parties avec status='waiting', avec infos hôte et nombre de joueurs."""
    stmt = (
        sa.select(
            Game.id,
            Player.pseudo.label("host_pseudo"),
            Player.avatar_pokemon_id.label("host_avatar_pokemon_id"),
            Game.mode,
            Game.difficulty,
            Game.nb_questions,
            Game.max_players,
            Game.status,
            sa.func.count(GamePlayer.player_id).label("players_count"),
        )
        .join(Player, Player.id == Game.host_player_id)
        .outerjoin(GamePlayer, GamePlayer.game_id == Game.id)
        .where(Game.status == GameStatus.WAITING)
        .group_by(
            Game.id,
            Player.pseudo,
            Player.avatar_pokemon_id,
            Game.mode,
            Game.difficulty,
            Game.nb_questions,
            Game.max_players,
            Game.status,
        )
    )
    result = await session.execute(stmt)
    rows = result.mappings().all()
    return [GameListItem(**dict(row)) for row in rows]


@router.post("/games", response_model=GameResponse, status_code=status.HTTP_201_CREATED)
async def create_game(
    payload: GameCreate,
    session: AsyncSession = Depends(get_session),
) -> GameResponse:
    """Crée une nouvelle partie et ajoute l'hôte dans game_players."""
    # Vérifier que le joueur hôte existe
    player = await session.get(Player, payload.host_player_id)
    if player is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Player {payload.host_player_id} not found",
        )

    # Créer la partie
    game = Game(
        host_player_id=payload.host_player_id,
        mode=payload.mode,
        difficulty=payload.difficulty,
        nb_questions=payload.nb_questions,
        max_players=payload.max_players,
        status=GameStatus.WAITING,
    )
    session.add(game)
    await session.flush()  # obtenir l'id avant le commit

    # Ajouter l'hôte dans game_players
    game_player = GamePlayer(
        game_id=game.id,
        player_id=payload.host_player_id,
    )
    session.add(game_player)
    await session.commit()
    await session.refresh(game)

    # Notifier les clients du lobby via Socket.IO
    games_updated_stmt = (
        sa.select(
            Game.id,
            Player.pseudo.label("host_pseudo"),
            Player.avatar_pokemon_id.label("host_avatar_pokemon_id"),
            Game.mode,
            Game.difficulty,
            Game.nb_questions,
            Game.max_players,
            Game.status,
            sa.func.count(GamePlayer.player_id).label("players_count"),
        )
        .join(Player, Player.id == Game.host_player_id)
        .outerjoin(GamePlayer, GamePlayer.game_id == Game.id)
        .where(Game.status == GameStatus.WAITING)
        .group_by(
            Game.id,
            Player.pseudo,
            Player.avatar_pokemon_id,
            Game.mode,
            Game.difficulty,
            Game.nb_questions,
            Game.max_players,
            Game.status,
        )
    )
    updated_result = await session.execute(games_updated_stmt)
    updated_rows = updated_result.mappings().all()
    games_data = [
        {
            "id": str(row["id"]),
            "host_pseudo": row["host_pseudo"],
            "host_avatar_pokemon_id": row["host_avatar_pokemon_id"],
            "mode": row["mode"],
            "difficulty": row["difficulty"],
            "nb_questions": row["nb_questions"],
            "max_players": row["max_players"],
            "players_count": row["players_count"],
            "status": row["status"],
        }
        for row in updated_rows
    ]
    await sio.emit("lobby:games_updated", games_data, room="lobby")

    return GameResponse.model_validate(game)


@router.get("/games/{game_id}")
async def get_game(
    game_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Retourne une partie par son ID avec la liste des joueurs."""
    game = await session.get(Game, game_id)
    if game is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Game {game_id} not found",
        )

    # Récupérer les joueurs de la partie
    stmt = (
        sa.select(
            Player.id,
            Player.pseudo,
            Player.avatar_pokemon_id,
        )
        .join(GamePlayer, GamePlayer.player_id == Player.id)
        .where(GamePlayer.game_id == game_id)
    )
    result = await session.execute(stmt)
    players = [
        {
            "id": str(row.id),
            "pseudo": row.pseudo,
            "avatar_pokemon_id": row.avatar_pokemon_id,
        }
        for row in result
    ]

    game_response = GameResponse.model_validate(game)
    return {
        **game_response.model_dump(),
        "players": players,
    }
