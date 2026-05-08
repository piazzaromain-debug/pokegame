"""Agrège les stats joueur et Pokémon à la fin d'une partie."""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, update

from app.models.stats import PlayerStats
from app.models.game_question import GameQuestion, PlayerAnswer


async def aggregate_game_stats(
    db: AsyncSession,
    game_id: uuid.UUID,
    final_scoreboard: list[dict],
) -> None:
    """
    Met à jour player_stats et pokemon_stats après une partie.
    Appelé depuis game.py après game:finished.
    """
    # Récupérer toutes les questions de la partie
    questions_result = await db.execute(
        select(GameQuestion).where(GameQuestion.game_id == game_id)
    )
    questions = questions_result.scalars().all()
    question_ids = [q.id for q in questions]

    if not question_ids:
        return

    # Récupérer toutes les réponses de la partie
    answers_result = await db.execute(
        select(PlayerAnswer).where(PlayerAnswer.question_id.in_(question_ids))
    )
    answers = answers_result.scalars().all()

    # Grouper les réponses par joueur
    answers_by_player: dict[str, list] = {}
    for ans in answers:
        pid = str(ans.player_id)
        answers_by_player.setdefault(pid, []).append(ans)

    winner_id = final_scoreboard[0]["player_id"] if final_scoreboard else None

    # Mettre à jour player_stats pour chaque joueur
    for entry in final_scoreboard:
        player_id = uuid.UUID(entry["player_id"])
        player_answers = answers_by_player.get(entry["player_id"], [])

        correct_count = sum(1 for a in player_answers if a.is_correct)
        total_count = len(player_answers)
        is_winner = entry["player_id"] == winner_id and entry["rank"] == 1

        # Pokémon vus et réussis
        seen_ids = [str(a.selected_pokemon_id) for a in player_answers if a.selected_pokemon_id]
        correct_ids = [str(a.selected_pokemon_id) for a in player_answers if a.is_correct and a.selected_pokemon_id]

        # Erreurs par Pokémon (correct_pokemon_id des questions ratées)
        question_map = {str(q.id): q.correct_pokemon_id for q in questions}
        mistakes: dict[str, int] = {}
        for ans in player_answers:
            if not ans.is_correct:
                correct_pid = question_map.get(str(ans.question_id))
                if correct_pid:
                    key = str(correct_pid)
                    mistakes[key] = mistakes.get(key, 0) + 1

        # Upsert player_stats
        stats_result = await db.execute(
            select(PlayerStats).where(PlayerStats.player_id == player_id)
        )
        stats = stats_result.scalar_one_or_none()

        if stats:
            # Merge JSONB fields
            existing_seen = set(stats.pokemon_seen or [])
            existing_caught = set(stats.pokemon_caught or [])
            existing_mistakes = dict(stats.pokemon_mistakes or {})

            for k, v in mistakes.items():
                existing_mistakes[k] = existing_mistakes.get(k, 0) + v

            await db.execute(
                update(PlayerStats)
                .where(PlayerStats.player_id == player_id)
                .values(
                    games_played=(stats.games_played or 0) + 1,
                    games_won=(stats.games_won or 0) + (1 if is_winner else 0),
                    total_correct=(stats.total_correct or 0) + correct_count,
                    total_questions=(stats.total_questions or 0) + total_count,
                    total_score=(stats.total_score or 0) + entry["score"],
                    pokemon_seen=list(existing_seen | set(seen_ids)),
                    pokemon_caught=list(existing_caught | set(correct_ids)),
                    pokemon_mistakes=existing_mistakes,
                )
            )

    # Mettre à jour pokemon_stats
    for q in questions:
        q_answers = [a for a in answers if a.question_id == q.id]
        times_shown = len(q_answers)
        times_correct = sum(1 for a in q_answers if a.is_correct)
        times_incorrect = times_shown - times_correct

        if times_shown == 0:
            continue

        await db.execute(text("""
            INSERT INTO pokemon_stats (pokemon_id, times_shown, times_correct, times_incorrect)
            VALUES (:pid, :shown, :correct, :incorrect)
            ON CONFLICT (pokemon_id) DO UPDATE SET
                times_shown = pokemon_stats.times_shown + :shown,
                times_correct = pokemon_stats.times_correct + :correct,
                times_incorrect = pokemon_stats.times_incorrect + :incorrect,
                updated_at = NOW()
        """), {"pid": q.correct_pokemon_id, "shown": times_shown,
               "correct": times_correct, "incorrect": times_incorrect})

    # Refresh materialized view (best-effort, ne pas bloquer si échoue)
    try:
        await db.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard"))
    except Exception:
        pass  # La vue sera rafraîchie à la prochaine occasion

    await db.commit()
