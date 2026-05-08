#!/usr/bin/env python3
"""
Script de seed des 151 Pokémon depuis PokeAPI.
Implémentation complète en Phase 2.
"""
import asyncio
import logging

logger = logging.getLogger(__name__)


async def seed_pokemon() -> None:
    """Charge les 151 Pokémon depuis PokeAPI en base."""
    # TODO Phase 2 : implémentation complète
    logger.info("Seed script — à implémenter en Phase 2")


if __name__ == "__main__":
    asyncio.run(seed_pokemon())
