from fastapi import APIRouter

router = APIRouter(tags=["leaderboard"])


@router.get("/leaderboard")
async def get_leaderboard() -> dict:
    """Retourne le classement global (non implémenté)."""
    return {"status": "not implemented yet"}
