#!/usr/bin/env python3
"""Seed du catalogue des achievements."""
import asyncio, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.models.achievement import Achievement

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql+asyncpg://pokegame:pokegame_dev@db:5432/pokegame")

ACHIEVEMENTS = [
    {
        "code": "first_game",
        "name_fr": "Apprenti dresseur",
        "description_fr": "Terminer ta première partie",
        "icon_emoji": "🎓",
        "rarity": "common",
    },
    {
        "code": "first_victory",
        "name_fr": "Premier sang",
        "description_fr": "Remporter ta première victoire en multi",
        "icon_emoji": "👑",
        "rarity": "common",
    },
    {
        "code": "kanto_master",
        "name_fr": "Maître de Kanto",
        "description_fr": "100% de bonnes réponses sur une partie de 20+ questions",
        "icon_emoji": "🏆",
        "rarity": "legendary",
    },
    {
        "code": "combo_master",
        "name_fr": "Combo Master",
        "description_fr": "10 bonnes réponses d'affilée dans une même partie",
        "icon_emoji": "🔥",
        "rarity": "rare",
    },
    {
        "code": "lightning_fast",
        "name_fr": "Rapidité éclair",
        "description_fr": "Répondre en moins d'1 seconde 5 fois dans une partie",
        "icon_emoji": "⚡",
        "rarity": "epic",
    },
    {
        "code": "collector",
        "name_fr": "Collectionneur",
        "description_fr": "Voir les 151 Pokémon dans des parties",
        "icon_emoji": "💎",
        "rarity": "legendary",
    },
    {
        "code": "perfectionist",
        "name_fr": "Perfectionniste",
        "description_fr": "Finir une partie sans aucune erreur (min. 10 questions)",
        "icon_emoji": "✨",
        "rarity": "epic",
    },
    {
        "code": "veteran",
        "name_fr": "Vétéran",
        "description_fr": "Jouer 50 parties au total",
        "icon_emoji": "🎖️",
        "rarity": "rare",
    },
]

async def seed_achievements():
    engine = create_async_engine(DATABASE_URL)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as db:
        result = await db.execute(select(Achievement))
        existing = {a.code for a in result.scalars().all()}

        new_count = 0
        for data in ACHIEVEMENTS:
            if data["code"] not in existing:
                db.add(Achievement(**data))
                new_count += 1

        await db.commit()
        print(f"✅ {new_count} nouveaux achievements ajoutés ({len(existing)} existants)")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_achievements())
