from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_session
from app.models.achievement import Achievement

router = APIRouter(tags=["achievements"])


@router.get("/achievements")
async def list_achievements(db: AsyncSession = Depends(get_session)) -> list[dict]:
    """Retourne le catalogue complet des achievements."""
    result = await db.execute(select(Achievement).order_by(Achievement.rarity, Achievement.code))
    return [
        {
            "code": a.code,
            "name_fr": a.name_fr,
            "description_fr": a.description_fr,
            "icon_emoji": a.icon_emoji,
            "rarity": a.rarity,
        }
        for a in result.scalars().all()
    ]
