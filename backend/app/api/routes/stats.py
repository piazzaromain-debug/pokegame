from fastapi import APIRouter

router = APIRouter(tags=["stats"])


@router.get("/stats/global")
async def get_global_stats() -> dict:
    """Retourne les statistiques globales (non implémenté)."""
    return {"status": "not implemented yet"}
