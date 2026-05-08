"""Détection et attribution des achievements à la fin d'une partie."""
import uuid
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.achievement import Achievement, PlayerAchievement
from app.models.game_question import GameQuestion, PlayerAnswer
from app.models.stats import PlayerStats


async def check_and_award_achievements(
    db: AsyncSession,
    player_id: uuid.UUID,
    game_id: uuid.UUID,
    final_rank: int,
    total_players: int,
) -> list[str]:
    """
    Vérifie les conditions d'unlock et attribue les achievements.
    Retourne la liste des codes nouvellement débloqués.
    """
    # Récupérer les réponses du joueur dans cette partie
    questions_result = await db.execute(
        select(GameQuestion).where(GameQuestion.game_id == game_id)
    )
    questions = questions_result.scalars().all()
    question_ids = [q.id for q in questions]

    if not question_ids:
        return []

    answers_result = await db.execute(
        select(PlayerAnswer).where(
            PlayerAnswer.question_id.in_(question_ids),
            PlayerAnswer.player_id == player_id,
        )
    )
    answers = answers_result.scalars().all()

    total_questions = len(answers)
    correct_answers = [a for a in answers if a.is_correct]
    total_correct = len(correct_answers)
    fast_answers = sum(1 for a in correct_answers if a.response_time_ms and a.response_time_ms < 1000)

    # Calculer la meilleure série dans cette partie
    max_streak = 0
    current_streak = 0
    for ans in sorted(answers, key=lambda x: x.answered_at or x.id):
        if ans.is_correct:
            current_streak += 1
            max_streak = max(max_streak, current_streak)
        else:
            current_streak = 0

    # Stats globales du joueur
    stats_result = await db.execute(
        select(PlayerStats).where(PlayerStats.player_id == player_id)
    )
    stats = stats_result.scalar_one_or_none()
    games_played = (stats.games_played or 0) + 1  # inclut la partie en cours
    seen_count = len(stats.pokemon_seen or []) if stats else 0

    # Achievements déjà obtenus
    existing_result = await db.execute(
        select(PlayerAchievement.achievement_code).where(
            PlayerAchievement.player_id == player_id
        )
    )
    already_unlocked = {row[0] for row in existing_result.fetchall()}

    # Conditions d'unlock
    to_unlock = []

    if "first_game" not in already_unlocked:
        to_unlock.append("first_game")

    if "first_victory" not in already_unlocked and final_rank == 1 and total_players > 1:
        to_unlock.append("first_victory")

    if "kanto_master" not in already_unlocked and total_questions >= 20 and total_correct == total_questions:
        to_unlock.append("kanto_master")

    if "combo_master" not in already_unlocked and max_streak >= 10:
        to_unlock.append("combo_master")

    if "lightning_fast" not in already_unlocked and fast_answers >= 5:
        to_unlock.append("lightning_fast")

    if "collector" not in already_unlocked and seen_count >= 151:
        to_unlock.append("collector")

    if "perfectionist" not in already_unlocked and total_questions >= 10 and total_correct == total_questions:
        to_unlock.append("perfectionist")

    if "veteran" not in already_unlocked and games_played >= 50:
        to_unlock.append("veteran")

    # Insérer les nouveaux achievements
    newly_unlocked = []
    for code in to_unlock:
        try:
            db.add(PlayerAchievement(player_id=player_id, achievement_code=code))
            newly_unlocked.append(code)
        except Exception as e:
            logger.warning(f"Failed to award achievement {code} to {player_id}: {e}")

    if newly_unlocked:
        await db.flush()
        logger.info(f"Player {player_id} unlocked: {newly_unlocked}")

    return newly_unlocked


async def get_achievements_details(db: AsyncSession, codes: list[str]) -> list[dict]:
    """Retourne les détails des achievements par leurs codes."""
    if not codes:
        return []
    result = await db.execute(
        select(Achievement).where(Achievement.code.in_(codes))
    )
    return [
        {
            "code": a.code,
            "name_fr": a.name_fr,
            "description_fr": a.description_fr,
            "icon_emoji": a.icon_emoji,
            "rarity": a.rarity,
        }
        for a in result.scalars().all()
    ]
