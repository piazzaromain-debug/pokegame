#!/usr/bin/env python3
"""Seed des 151 Pokémon depuis PokeAPI."""
import asyncio
import os
import sys

import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

# Ajoute le répertoire parent (backend/) au path pour importer app.*
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.pokemon import Pokemon  # noqa: E402

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://pokegame:pokegame_dev@db:5432/pokegame",
)

TYPE_MAPPING: dict[str, str] = {
    "normal": "Normal",
    "fire": "Feu",
    "water": "Eau",
    "electric": "Électrique",
    "grass": "Plante",
    "ice": "Glace",
    "fighting": "Combat",
    "poison": "Poison",
    "ground": "Sol",
    "flying": "Vol",
    "psychic": "Psy",
    "bug": "Insecte",
    "rock": "Roche",
    "ghost": "Spectre",
    "dragon": "Dragon",
    "dark": "Ténèbres",
    "steel": "Acier",
    "fairy": "Fée",
}


async def fetch_with_retry(
    client: httpx.AsyncClient, url: str, max_retries: int = 3
) -> dict:
    """Fetch avec retry exponentiel (1 s, 2 s, 4 s)."""
    for attempt in range(max_retries):
        try:
            response = await client.get(url, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except (httpx.HTTPError, httpx.TimeoutException) as exc:
            if attempt == max_retries - 1:
                raise
            wait = 2**attempt  # 1, 2, 4 secondes
            await asyncio.sleep(wait)
    # Unreachable, mais satisfait les type checkers
    raise RuntimeError("fetch_with_retry: boucle épuisée sans résultat")


async def fetch_pokemon_data(
    client: httpx.AsyncClient, sem: asyncio.Semaphore, pokemon_id: int
) -> dict:
    """Fetch et transforme les données d'un Pokémon depuis PokeAPI."""
    async with sem:
        pokemon_data = await fetch_with_retry(
            client, f"https://pokeapi.co/api/v2/pokemon/{pokemon_id}/"
        )
        species_data = await fetch_with_retry(
            client, f"https://pokeapi.co/api/v2/pokemon-species/{pokemon_id}/"
        )

    # --- Nom FR ---
    name_fr: str = next(
        (n["name"] for n in species_data["names"] if n["language"]["name"] == "fr"),
        pokemon_data["name"].capitalize(),
    )

    # --- Sprites ---
    official_artwork = pokemon_data["sprites"].get("other", {}).get(
        "official-artwork", {}
    )
    sprite_url: str | None = official_artwork.get("front_default") or pokemon_data[
        "sprites"
    ].get("front_default")
    sprite_shiny_url: str | None = official_artwork.get(
        "front_shiny"
    ) or pokemon_data["sprites"].get("front_shiny")

    # --- Cri ---
    cry_url: str | None = pokemon_data.get("cries", {}).get("latest")

    # --- Types (EN → FR) ---
    types: list[str] = [
        TYPE_MAPPING.get(t["type"]["name"], t["type"]["name"].capitalize())
        for t in pokemon_data["types"]
    ]

    # --- Description FR (préférence red/blue/firered/leafgreen) ---
    flavor_texts = [
        e
        for e in species_data["flavor_text_entries"]
        if e["language"]["name"] == "fr"
    ]
    preferred = next(
        (
            e
            for e in flavor_texts
            if e["version"]["name"] in ("red", "blue", "firered", "leafgreen")
        ),
        flavor_texts[0] if flavor_texts else None,
    )
    description: str | None = None
    if preferred:
        description = (
            preferred["flavor_text"].replace("\n", " ").replace("\f", " ").strip()
        )

    return {
        "pokedex_number": pokemon_id,
        "name_fr": name_fr,
        "sprite_url": sprite_url,
        "sprite_shiny_url": sprite_shiny_url,
        "cry_url": cry_url,
        "types": types,
        "pokedex_description": description,
    }


async def seed_pokemon() -> None:
    engine = create_async_engine(DATABASE_URL, echo=False)
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

    # --- Vérification idempotence ---
    async with SessionLocal() as session:
        count_result = await session.execute(text("SELECT COUNT(*) FROM pokemon"))
        count: int = count_result.scalar() or 0
        if count >= 151:
            print("Already seeded (151 Pokémon), skip.")
            await engine.dispose()
            return

    print("Démarrage du seed des 151 Pokémon depuis PokeAPI...")
    sem = asyncio.Semaphore(10)

    results: list[dict] = []
    async with httpx.AsyncClient() as client:
        tasks = [fetch_pokemon_data(client, sem, i) for i in range(1, 152)]
        completed = 0
        for coro in asyncio.as_completed(tasks):
            completed += 1
            try:
                data = await coro
                results.append(data)
                print(f"[{completed}/151] {data['name_fr']} ok")
            except Exception as exc:  # noqa: BLE001
                print(f"[{completed}/151] ERREUR : {exc}")

    # Trier par numéro de Pokédex avant insertion
    results.sort(key=lambda x: x["pokedex_number"])

    async with SessionLocal() as session:
        for data in results:
            pokemon = Pokemon(**data)
            session.add(pokemon)
        await session.commit()

    print(f"{len(results)} Pokémon chargés en base !")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_pokemon())
