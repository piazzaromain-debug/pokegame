import asyncio
import uuid
from datetime import UTC, datetime

from loguru import logger
from sqlalchemy import select, update

from app.database import AsyncSessionLocal
from app.models.game import Difficulty, Game, GameStatus
from app.models.game_player import GamePlayer
from app.models.game_question import GameQuestion, PlayerAnswer
from app.models.pokemon import Pokemon
from app.services.question_generator import generate_questions, get_time_limit_ms
from app.services.scoring import calculate_points
from app.services.stats_aggregator import aggregate_game_stats
from app.sockets.manager import game_room_manager
from app.sockets.server import sio


# ── handlers Phase 4 ──────────────────────────────────────────────────────────

@sio.on("game:join")
async def on_game_join(sid: str, data: dict) -> None:
    """
    data: {game_id, player_id, pseudo, avatar_pokemon_id}
    """
    game_id = data.get("game_id")
    player_id = data.get("player_id")
    pseudo = data.get("pseudo")
    avatar_pokemon_id = data.get("avatar_pokemon_id")

    if not all([game_id, player_id, pseudo]):
        await sio.emit("error", {"message": "Données manquantes"}, to=sid)
        return

    room_name = f"game:{game_id}"
    await sio.enter_room(sid, room_name)

    success = await game_room_manager.add_player(
        game_id, player_id, pseudo, avatar_pokemon_id, sid
    )

    if not success:
        # Crée la room si elle n'existe pas encore (cas où l'hôte rejoint en premier)
        await game_room_manager.create_room(game_id, player_id)
        await game_room_manager.add_player(game_id, player_id, pseudo, avatar_pokemon_id, sid)

    # Broadcast à toute la room
    await sio.emit(
        "game:player_joined",
        {"player_id": player_id, "pseudo": pseudo, "avatar_pokemon_id": avatar_pokemon_id},
        room=room_name,
    )

    # Envoyer à ce joueur la liste des joueurs déjà présents
    room = await game_room_manager.get_room(game_id)
    if room:
        await sio.emit("game:room_state", {"players": list(room.players.values())}, to=sid)

    logger.info(f"Player {player_id} ({pseudo}) joined game {game_id}")


@sio.on("game:leave")
async def on_game_leave(sid: str, data: dict) -> None:
    game_id = data.get("game_id")
    player_id = data.get("player_id")

    if game_id and player_id:
        room_name = f"game:{game_id}"
        await sio.leave_room(sid, room_name)
        await game_room_manager.remove_player(game_id, player_id)
        await sio.emit("game:player_left", {"player_id": player_id}, room=room_name)
        logger.info(f"Player {player_id} left game {game_id}")


# ── Phase 5 : boucle de jeu ────────────────────────────────────────────────────

@sio.on("game:start")
async def on_game_start(sid: str, data: dict) -> None:
    """
    Seul l'hôte peut démarrer. Vérifie via game_room_manager.
    data: {game_id, player_id}
    """
    game_id = data.get("game_id")
    player_id = data.get("player_id")
    room_name = f"game:{game_id}"

    room = await game_room_manager.get_room(game_id)
    if not room:
        await sio.emit("error", {"message": "Partie non trouvée"}, to=sid)
        return

    if room.host_player_id != player_id:
        await sio.emit("error", {"message": "Seul l'hôte peut démarrer"}, to=sid)
        return

    if room.status != "waiting":
        await sio.emit("error", {"message": "La partie est déjà démarrée"}, to=sid)
        return

    # Récupérer les infos de la partie depuis la DB
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Game).where(Game.id == uuid.UUID(game_id)))
        game = result.scalar_one_or_none()
        if not game:
            await sio.emit("error", {"message": "Partie non trouvée en DB"}, to=sid)
            return

        # Générer les questions
        questions = await generate_questions(db, game.id, game.nb_questions, game.difficulty)
        await db.execute(
            update(Game).where(Game.id == game.id).values(
                status=GameStatus.IN_PROGRESS, started_at=datetime.now(UTC)
            )
        )
        await db.commit()

        # Charger les Pokémon corrects pour chaque question
        correct_pokemon_ids = [q.correct_pokemon_id for q in questions]
        poke_result = await db.execute(
            select(Pokemon).where(Pokemon.id.in_(correct_pokemon_ids))
        )
        pokemon_map = {p.id: p for p in poke_result.scalars().all()}

    # Stocker le difficulty et time_limit dans la room
    time_limit_ms = get_time_limit_ms(game.difficulty)
    room.time_limit_ms = time_limit_ms
    room.status = "in_progress"
    room.questions = [
        {
            "id": str(q.id),
            "question_index": q.question_index,
            "correct_pokemon_id": q.correct_pokemon_id,
            "options": q.options,
        }
        for q in questions
    ]
    room.pokemon_map = {
        str(pid): {
            "id": pid,
            "name_fr": p.name_fr,
            "sprite_url": p.sprite_url,
            "cry_url": p.cry_url,
        }
        for pid, p in pokemon_map.items()
    }

    # Countdown 3s
    await sio.emit("game:starting", {"countdown": 3}, room=room_name)
    await asyncio.sleep(3)

    # Lancer la boucle de jeu
    asyncio.create_task(
        _run_question_loop(game_id, game.difficulty.value, room_name)
    )


async def _run_question_loop(game_id: str, difficulty_str: str, room_name: str) -> None:
    """Boucle principale : envoie les questions, attend les réponses, révèle."""
    difficulty = Difficulty(difficulty_str)
    time_limit_ms = get_time_limit_ms(difficulty)

    room = await game_room_manager.get_room(game_id)
    if not room:
        return

    total = len(room.questions)

    for q_data in room.questions:
        # Reset les réponses de cette question
        room.current_question_answers = {}
        room.current_question_index = q_data["question_index"]

        correct_pokemon = room.pokemon_map.get(str(q_data["correct_pokemon_id"]))

        event_payload = {
            "question_id": q_data["id"],
            "question_index": q_data["question_index"],
            "total": total,
            "options": q_data["options"],
            "image_url": correct_pokemon["sprite_url"] if correct_pokemon else None,
            "time_limit_ms": time_limit_ms,
            "difficulty": difficulty_str,
        }

        await sio.emit("game:new_question", event_payload, room=room_name)

        # Attendre time_limit_ms OU que tous les joueurs aient répondu
        deadline = asyncio.get_event_loop().time() + (time_limit_ms / 1000)
        while asyncio.get_event_loop().time() < deadline:
            answers_count = len(room.current_question_answers)
            if answers_count >= len(room.players):
                break
            await asyncio.sleep(0.1)

        # Révéler la bonne réponse
        await sio.emit(
            "game:question_revealed",
            {
                "correct_pokemon_id": q_data["correct_pokemon_id"],
                "name_fr": correct_pokemon["name_fr"] if correct_pokemon else "",
                "cry_url": correct_pokemon["cry_url"] if correct_pokemon else None,
            },
            room=room_name,
        )

        # Scoreboard update
        scoreboard = sorted(
            [
                {
                    "player_id": pid,
                    "pseudo": pdata["pseudo"],
                    "avatar_pokemon_id": pdata["avatar_pokemon_id"],
                    "score": pdata["score"],
                }
                for pid, pdata in room.players.items()
            ],
            key=lambda x: x["score"],
            reverse=True,
        )
        for i, entry in enumerate(scoreboard):
            entry["rank"] = i + 1

        await sio.emit("game:scoreboard_update", scoreboard, room=room_name)
        await asyncio.sleep(3)  # temps de voir les résultats

    # Fin de partie
    final_scoreboard = sorted(
        [
            {
                "player_id": pid,
                "pseudo": pdata["pseudo"],
                "avatar_pokemon_id": pdata["avatar_pokemon_id"],
                "score": pdata["score"],
            }
            for pid, pdata in room.players.items()
        ],
        key=lambda x: x["score"],
        reverse=True,
    )
    for i, entry in enumerate(final_scoreboard):
        entry["rank"] = i + 1

    await sio.emit("game:finished", {"final_scoreboard": final_scoreboard}, room=room_name)

    # Persister en DB
    async with AsyncSessionLocal() as db:
        await db.execute(
            update(Game)
            .where(Game.id == uuid.UUID(game_id))
            .values(status=GameStatus.FINISHED, finished_at=datetime.now(UTC))
        )
        for rank_i, entry in enumerate(final_scoreboard):
            await db.execute(
                update(GamePlayer)
                .where(GamePlayer.game_id == uuid.UUID(game_id))
                .where(GamePlayer.player_id == uuid.UUID(entry["player_id"]))
                .values(final_score=entry["score"], final_rank=rank_i + 1)
            )
        await db.commit()
        await aggregate_game_stats(db, uuid.UUID(game_id), final_scoreboard)

    room.status = "finished"
    logger.info(
        f"Game {game_id} finished. Winner: "
        f"{final_scoreboard[0]['pseudo'] if final_scoreboard else 'nobody'}"
    )


@sio.on("game:answer")
async def on_game_answer(sid: str, data: dict) -> None:
    """
    data: {game_id, question_id, selected_pokemon_id, response_time_ms, player_id}
    Vérification côté serveur : compare selected_pokemon_id avec le correct.
    Calcule les points via scoring.py.
    """
    game_id = data.get("game_id")
    player_id = data.get("player_id")
    question_id = data.get("question_id")
    selected_pokemon_id = data.get("selected_pokemon_id")
    response_time_ms = data.get("response_time_ms")

    room = await game_room_manager.get_room(game_id)
    if not room or room.status != "in_progress":
        return

    # Trouver la question courante
    current_q = next(
        (q for q in room.questions if q["question_index"] == room.current_question_index),
        None,
    )
    if not current_q:
        return

    # Éviter les doublons de réponse
    if player_id in room.current_question_answers:
        return

    # Vérification côté serveur (JAMAIS côté client)
    is_correct = str(selected_pokemon_id) == str(current_q["correct_pokemon_id"])

    time_limit_ms = room.time_limit_ms
    points = calculate_points(is_correct, response_time_ms, time_limit_ms)

    # Mettre à jour le score en mémoire
    if player_id in room.players:
        room.players[player_id]["score"] = room.players[player_id].get("score", 0) + points

    room.current_question_answers[player_id] = {
        "is_correct": is_correct,
        "points": points,
    }

    # Broadcast à toute la room (sans révéler la bonne réponse)
    await sio.emit(
        "game:player_answered",
        {
            "player_id": player_id,
            "points_earned": points,
            "total_score": room.players.get(player_id, {}).get("score", 0),
            "is_correct": is_correct,
        },
        room=f"game:{game_id}",
    )

    # Persister en DB
    async with AsyncSessionLocal() as db:
        answer = PlayerAnswer(
            question_id=uuid.UUID(question_id),
            player_id=uuid.UUID(player_id),
            selected_pokemon_id=int(selected_pokemon_id) if selected_pokemon_id is not None else None,
            is_correct=is_correct,
            response_time_ms=response_time_ms,
            points_earned=points,
        )
        db.add(answer)
        await db.commit()


@sio.on("game:react")
async def on_game_react(sid: str, data: dict) -> None:
    """Broadcast une réaction emoji à toute la room."""
    game_id = data.get("game_id")
    emoji = data.get("emoji")
    player_id = data.get("player_id")
    if game_id and emoji:
        await sio.emit(
            "game:reaction",
            {"player_id": player_id, "emoji": emoji},
            room=f"game:{game_id}",
        )
