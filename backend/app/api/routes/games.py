from fastapi import APIRouter

router = APIRouter(tags=["games"])


@router.post("/games")
async def create_game() -> dict:
    """Crée une nouvelle partie (non implémenté)."""
    return {"status": "not implemented yet"}


@router.get("/games")
async def list_games() -> dict:
    """Liste les parties en cours (non implémenté)."""
    return {"status": "not implemented yet"}


@router.get("/games/{game_id}")
async def get_game(game_id: str) -> dict:
    """Retourne une partie par son ID (non implémenté)."""
    return {"status": "not implemented yet"}
