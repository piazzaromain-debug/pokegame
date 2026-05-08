from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.api.deps import get_session
from app.models.game import Difficulty, GameMode
from app.schemas.leaderboard import LeaderboardEntry

router = APIRouter(tags=["leaderboard"])


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def get_leaderboard(
    mode: GameMode = Query(...),
    difficulty: Difficulty = Query(...),
    period: str = Query("all", pattern="^(today|week|all)$"),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_session),
):
    """
    Leaderboard filtré par mode, difficulté et période.
    Utilise la materialized view 'leaderboard'.
    Essaie d'abord la materialized view, fallback sur la jointure directe si vide.
    """
    # Filtre de période
    period_filter = ""
    if period == "today":
        period_filter = "AND finished_at >= NOW() - INTERVAL '1 day'"
    elif period == "week":
        period_filter = "AND finished_at >= NOW() - INTERVAL '7 days'"

    try:
        # Essaie la materialized view
        result = await db.execute(text(f"""
            SELECT rank, player_id, pseudo, avatar_pokemon_id, final_score, finished_at
            FROM leaderboard
            WHERE mode = :mode AND difficulty = :difficulty
            {period_filter}
            ORDER BY final_score DESC
            LIMIT :limit
        """), {"mode": mode.value, "difficulty": difficulty.value, "limit": limit})
        rows = result.fetchall()
    except Exception:
        # Fallback sur jointure directe (view pas encore rafraîchie)
        result = await db.execute(text(f"""
            SELECT
                ROW_NUMBER() OVER (ORDER BY gp.final_score DESC) as rank,
                p.id as player_id,
                p.pseudo,
                p.avatar_pokemon_id,
                gp.final_score,
                g.finished_at
            FROM game_players gp
            JOIN games g ON g.id = gp.game_id
            JOIN players p ON p.id = gp.player_id
            WHERE g.status = 'finished'
              AND g.mode = :mode
              AND g.difficulty = :difficulty
              {period_filter}
            ORDER BY gp.final_score DESC
            LIMIT :limit
        """), {"mode": mode.value, "difficulty": difficulty.value, "limit": limit})
        rows = result.fetchall()

    return [
        LeaderboardEntry(
            rank=int(row.rank),
            player_id=row.player_id,
            pseudo=row.pseudo,
            avatar_pokemon_id=row.avatar_pokemon_id,
            final_score=row.final_score or 0,
            finished_at=row.finished_at,
        )
        for row in rows
    ]
