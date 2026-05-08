from fastapi import APIRouter

router = APIRouter(tags=["players"])


@router.post("/players")
async def create_player() -> dict:
    """Crée un nouveau joueur (non implémenté)."""
    return {"status": "not implemented yet"}


@router.get("/players/{player_id}")
async def get_player(player_id: str) -> dict:
    """Retourne un joueur par son ID (non implémenté)."""
    return {"status": "not implemented yet"}
