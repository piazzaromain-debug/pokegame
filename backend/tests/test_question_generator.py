import pytest
import pytest_asyncio
from app.services.question_generator import (
    get_nb_options,
    get_time_limit_ms,
    generate_questions,
)
from app.models.game import Difficulty


class TestGetNbOptions:
    def test_easy_returns_4(self):
        assert get_nb_options(Difficulty.EASY) == 4

    def test_normal_returns_4(self):
        assert get_nb_options(Difficulty.NORMAL) == 4

    def test_hard_returns_6(self):
        assert get_nb_options(Difficulty.HARD) == 6


class TestGetTimeLimitMs:
    def test_easy_15_seconds(self):
        assert get_time_limit_ms(Difficulty.EASY) == 15000

    def test_normal_10_seconds(self):
        assert get_time_limit_ms(Difficulty.NORMAL) == 10000

    def test_hard_5_seconds(self):
        assert get_time_limit_ms(Difficulty.HARD) == 5000


@pytest.mark.asyncio
class TestGenerateQuestions:
    async def test_generates_correct_count(self, db_session):
        """Génère exactement nb_questions questions."""
        import uuid
        from app.models.pokemon import Pokemon

        # Insérer 151 Pokémon de test en DB
        for i in range(1, 152):
            p = Pokemon(
                pokedex_number=i,
                name_fr=f"Pokemon{i}",
                sprite_url=f"https://example.com/{i}.png",
                types=["Normal"],
            )
            db_session.add(p)
        await db_session.flush()

        game_id = uuid.uuid4()
        questions = await generate_questions(db_session, game_id, 10, Difficulty.NORMAL)
        assert len(questions) == 10

    async def test_no_duplicate_pokemon(self, db_session):
        """Chaque Pokémon correct n'apparaît qu'une fois."""
        import uuid
        from app.models.pokemon import Pokemon

        for i in range(1, 152):
            p = Pokemon(
                pokedex_number=i,
                name_fr=f"P{i}",
                sprite_url=f"https://x.com/{i}.png",
                types=["Normal"],
            )
            db_session.add(p)
        await db_session.flush()

        questions = await generate_questions(db_session, uuid.uuid4(), 20, Difficulty.NORMAL)
        correct_ids = [q.correct_pokemon_id for q in questions]
        assert len(correct_ids) == len(set(correct_ids))

    async def test_options_contain_correct_pokemon(self, db_session):
        """Chaque question contient le bon Pokémon dans ses options."""
        import uuid
        from app.models.pokemon import Pokemon

        for i in range(1, 152):
            p = Pokemon(
                pokedex_number=i,
                name_fr=f"P{i}",
                sprite_url=f"https://x.com/{i}.png",
                types=["Normal"],
            )
            db_session.add(p)
        await db_session.flush()

        questions = await generate_questions(db_session, uuid.uuid4(), 5, Difficulty.HARD)
        for q in questions:
            option_ids = [opt["id"] for opt in q.options]
            assert q.correct_pokemon_id in option_ids

    async def test_hard_mode_has_6_options(self, db_session):
        """Le mode difficile génère 6 options."""
        import uuid
        from app.models.pokemon import Pokemon

        for i in range(1, 152):
            p = Pokemon(
                pokedex_number=i,
                name_fr=f"P{i}",
                sprite_url=f"https://x.com/{i}.png",
                types=["Normal"],
            )
            db_session.add(p)
        await db_session.flush()

        questions = await generate_questions(db_session, uuid.uuid4(), 5, Difficulty.HARD)
        for q in questions:
            assert len(q.options) == 6
