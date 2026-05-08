from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.api.deps import get_session
from app.schemas.leaderboard import GlobalStatsResponse

router = APIRouter(tags=["stats"])


@router.get("/stats/global", response_model=GlobalStatsResponse)
async def get_global_stats(db: AsyncSession = Depends(get_session)):
    """Stats globales : Pokémon les plus difficiles, total parties/joueurs."""
    # Pokémon les plus ratés
    result = await db.execute(text("""
        SELECT
            po.id, po.name_fr, po.sprite_url,
            ps.times_shown,
            ps.times_incorrect,
            CASE WHEN ps.times_shown > 0
                 THEN ROUND(ps.times_incorrect::numeric / ps.times_shown * 100, 1)
                 ELSE 0 END as error_rate
        FROM pokemon_stats ps
        JOIN pokemon po ON po.id = ps.pokemon_id
        WHERE ps.times_shown > 0
        ORDER BY error_rate DESC
        LIMIT 10
    """))
    hardest = [
        {
            "id": row.id,
            "name_fr": row.name_fr,
            "sprite_url": row.sprite_url,
            "error_rate": float(row.error_rate),
            "times_shown": row.times_shown,
        }
        for row in result.fetchall()
    ]

    # Totaux
    total_games = await db.execute(text("SELECT COUNT(*) FROM games WHERE status = 'finished'"))
    total_players = await db.execute(text("SELECT COUNT(*) FROM players"))

    return GlobalStatsResponse(
        hardest_pokemon=hardest,
        total_games_played=total_games.scalar() or 0,
        total_players=total_players.scalar() or 0,
    )
