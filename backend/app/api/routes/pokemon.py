from fastapi import APIRouter

router = APIRouter(tags=["pokemon"])


@router.get("/pokemon")
async def list_pokemon() -> list:
    """Retourne la liste des Pokémon (non implémenté)."""
    return []
