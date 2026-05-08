import random
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.game import Difficulty
from app.models.game_question import GameQuestion
from app.models.pokemon import Pokemon


def get_nb_options(difficulty: Difficulty) -> int:
    return 6 if difficulty == Difficulty.HARD else 4


def get_time_limit_ms(difficulty: Difficulty) -> int:
    return {
        Difficulty.EASY: 15000,
        Difficulty.NORMAL: 10000,
        Difficulty.HARD: 5000,
    }[difficulty]


async def generate_questions(
    db: AsyncSession,
    game_id: uuid.UUID,
    nb_questions: int,
    difficulty: Difficulty,
) -> list[GameQuestion]:
    """
    Génère nb_questions questions pour la partie game_id.
    - Sélectionne nb_questions Pokémon aléatoires parmi les 151 (sans doublon)
    - Pour chaque question, génère les leurres (autres Pokémon aléatoires)
    - Sauvegarde en DB et retourne la liste
    """
    result = await db.execute(select(Pokemon).order_by(Pokemon.pokedex_number))
    all_pokemon = result.scalars().all()

    if len(all_pokemon) < nb_questions:
        raise ValueError(
            f"Pas assez de Pokémon en base ({len(all_pokemon)}) pour {nb_questions} questions"
        )

    # Sélection aléatoire sans doublon
    selected = random.sample(all_pokemon, nb_questions)
    nb_options = get_nb_options(difficulty)

    questions = []
    for index, correct_pokemon in enumerate(selected):
        # Leurres : autres Pokémon que le correct
        decoys = random.sample(
            [p for p in all_pokemon if p.id != correct_pokemon.id],
            nb_options - 1,
        )
        options = decoys + [correct_pokemon]
        random.shuffle(options)

        question = GameQuestion(
            game_id=game_id,
            question_index=index,
            correct_pokemon_id=correct_pokemon.id,
            options=[
                {"id": p.id, "name_fr": p.name_fr, "sprite_url": p.sprite_url}
                for p in options
            ],
        )
        db.add(question)
        questions.append(question)

    await db.flush()  # pour obtenir les IDs
    return questions


def question_to_event(
    question: GameQuestion,
    correct_pokemon: Pokemon,
    difficulty: Difficulty,
    question_index: int,
    total: int,
) -> dict:
    """Prépare le payload de l'event game:new_question (sans révéler la bonne réponse)."""
    return {
        "question_id": str(question.id),
        "question_index": question_index,
        "total": total,
        "options": question.options,  # liste de {id, name_fr, sprite_url}
        "image_url": correct_pokemon.sprite_url,
        "sprite_url": correct_pokemon.sprite_url,
        "sprite_shiny_url": correct_pokemon.sprite_shiny_url,
        "time_limit_ms": get_time_limit_ms(difficulty),
        "difficulty": difficulty.value,
    }
