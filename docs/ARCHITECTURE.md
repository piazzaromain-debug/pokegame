# Architecture — PokéGame

> Document vivant, mis à jour au fur et à mesure du développement.

---

## Services Docker

| Service | Image / Build | Port interne | Rôle |
|---|---|---|---|
| `nginx` | `./nginx` | 80 → hôte 8080 | Reverse proxy : route `/` → frontend, `/api/*` → backend, `/socket.io/*` → backend |
| `frontend` | `./frontend` (target: dev) | 5173 | App React + Vite dev server |
| `backend` | `./backend` | 8000 | FastAPI + python-socketio |
| `db` | `postgres:16-alpine` | 5432 (interne uniquement) | PostgreSQL — jamais exposé au réseau hôte |

---

## Flux de communication

```
Client (browser)
    │
    ├─ HTTP GET /           → nginx → frontend:5173 (Vite + React)
    ├─ HTTP /api/*          → nginx → backend:8000  (FastAPI REST)
    └─ WebSocket /socket.io → nginx → backend:8000  (Socket.IO)

backend:8000
    └─ asyncpg → db:5432 (PostgreSQL)
```

---

## Flux complet d'une partie (join → start → questions → finish)

```
Joueur A (hôte)                  Joueur B                     Serveur
     │                               │                             │
     ├─ POST /api/games ────────────────────────────────────────► │
     │                               │                ◄─ 201 game ─┤
     │                               │                             │
     ├─ emit game:join ──────────────────────────────────────────► │
     │                               │     ◄─ game:room_state ─────┤
     │                               │                             │
     │                ├─ emit game:join ──────────────────────────► │
     │                               │     ◄─ game:room_state ─────┤
     │  ◄─ game:player_joined ────────────────────────────────────┤
     │                               │                             │
     ├─ emit game:start ─────────────────────────────────────────► │
     │                               │   [vérifie que sid = hôte]  │
     │                               │   [génère questions en DB]  │
     │  ◄─ game:starting {countdown:3} ───────────────────────────┤
     │                ◄─ game:starting {countdown:3} ─────────────┤
     │                               │   [asyncio.sleep(3)]        │
     │                               │   [asyncio.create_task(     │
     │                               │     _run_question_loop)]    │
     │                               │                             │
     │  ◄─ game:new_question ─────────────────────────────────────┤  ─┐
     │                ◄─ game:new_question ───────────────────────┤   │
     │                               │                             │   │ boucle
     ├─ emit game:answer ────────────────────────────────────────► │   │ par
     │                ├─ emit game:answer ────────────────────────► │   │ question
     │  ◄─ game:player_answered ──────────────────────────────────┤   │
     │                ◄─ game:player_answered ───────────────────┤   │
     │                               │   [timeout ou tous répondu] │   │
     │  ◄─ game:question_revealed ────────────────────────────────┤   │
     │                ◄─ game:question_revealed ──────────────────┤   │
     │  ◄─ game:scoreboard_update ────────────────────────────────┤   │
     │                ◄─ game:scoreboard_update ──────────────────┤   │
     │                               │   [asyncio.sleep(3)]        │  ─┘
     │                               │                             │
     │                               │   [persist BDD, achievements│
     │                               │    aggregate stats]         │
     │  ◄─ game:finished (perso) ─────────────────────────────────┤
     │                ◄─ game:finished (perso) ───────────────────┤
```

Points clés :
- Les questions sont envoyées **simultanément** à tous les joueurs de la room
- Le serveur attend `time_limit_ms` **ou** que tous les joueurs aient répondu, selon ce qui arrive en premier
- `correct_pokemon_id` n'est jamais révélé avant la fin du timer
- `game:finished` est émis **individuellement** (via `to=player_sid`) pour inclure les achievements propres à chaque joueur

---

## State management temps réel

- **1 room `lobby`** : tous les joueurs en attente voient la liste des parties en live
- **1 room `game:{id}` par partie** : broadcast des questions, scores, réactions en simultané
- **Serveur = source de vérité** pour le timer et le scoring (le client n'envoie que `selected_pokemon_id` + `response_time_ms`)
- **`GameRoomManager`** : singleton Python gérant l'état en mémoire de toutes les parties en cours (joueurs, scores, questions)

---

## Décisions techniques notables

### Materialized view pour le leaderboard

```sql
CREATE MATERIALIZED VIEW leaderboard AS
SELECT g.mode, g.difficulty, p.id AS player_id, p.pseudo, p.avatar_pokemon_id,
       gp.final_score, g.finished_at,
       ROW_NUMBER() OVER (PARTITION BY g.mode, g.difficulty ORDER BY gp.final_score DESC) AS rank
FROM game_players gp
JOIN games g ON g.id = gp.game_id
JOIN players p ON p.id = gp.player_id
WHERE g.status = 'finished';
```

Le leaderboard est une requête potentiellement coûteuse (jointure sur 3 tables, calcul de rang). En utilisant une **materialized view**, le résultat est pré-calculé et stocké — un `GET /api/leaderboard` ne fait qu'un `SELECT` simple. La view est rafraîchie à chaque fin de partie (`REFRESH MATERIALIZED VIEW`). Coût : légère latence d'affichage (quelques secondes), acceptable pour ce cas d'usage. Un index composite `(mode, difficulty, final_score DESC)` garantit des lectures rapides même avec beaucoup d'entrées.

L'endpoint intègre un fallback automatique sur une jointure directe si la view est vide (ex: après un reset de BDD avant le premier refresh).

### asyncio.Lock dans GameRoomManager

```python
class GameRoomManager:
    def __init__(self):
        self._rooms: dict[str, GameRoom] = {}
        self._lock = asyncio.Lock()
```

Toutes les opérations de mutation (`add_player`, `remove_player`, `create_room`) sont protégées par un `asyncio.Lock()`. Sans ce verrou, deux joueurs répondant au même instant pourraient corrompre les compteurs de score (race condition). Python asyncio est monothreadé mais les coroutines peuvent s'entrelacer aux points `await` — le Lock garantit l'atomicité des sections critiques.

### Singleton Socket.IO et asyncio.create_task pour la boucle de jeu

```python
# sockets/server.py — instancié une seule fois
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
```

L'instance `sio` est un **singleton** importé dans tous les handlers. Cela permet à n'importe quel module (routes REST incluses) d'émettre des events Socket.IO sans injection de dépendance complexe — par exemple, `POST /api/games` émet directement `lobby:games_updated` depuis le router FastAPI.

La **boucle de jeu** (`_run_question_loop`) est lancée via `asyncio.create_task()` plutôt qu'`await`. Cela permet au handler `game:start` de rendre la main immédiatement (pour répondre au client) pendant que la boucle tourne en parallèle dans l'event loop asyncio.

### CORS et Nginx

Avec Nginx comme reverse proxy, tous les appels (REST + WebSocket) passent par `http://[ip]:8080` — même origine pour le frontend et le backend. Il n'y a donc **pas de CORS cross-origin** : FastAPI est configuré pour accepter uniquement `http://localhost:8080`.

### JSONB pour les stats agrégées

Les colonnes `pokemon_mistakes`, `pokemon_seen`, `pokemon_caught` sont en **JSONB** plutôt que des tables relationnelles. Avantage : pas de jointures pour lire le profil d'un joueur, mise à jour atomique via `jsonb_set`. Un index GIN sur `pokemon.types` permet des recherches par type efficaces.

---

## Sécurité

- Port 5432 (Postgres) non publié — accessible uniquement depuis le réseau Docker interne (`pokegame_net`)
- Scoring calculé **côté serveur uniquement** — le client ne peut pas envoyer des points, uniquement `selected_pokemon_id` + `response_time_ms`
- `correct_pokemon_id` broadcasté **uniquement** après expiration du timer (event `game:question_revealed`) — jamais dans `game:new_question`
- Seul l'hôte (vérifié via `room.host_player_id`) peut émettre `game:start`
- Sections critiques du `GameRoomManager` protégées par `asyncio.Lock()` contre les race conditions
- Pas de secrets hardcodés — tout via `.env` (versionné : `.env.example` uniquement, `.env` dans `.gitignore`)
- CORS restreint à `http://localhost:8080` (Nginx = même origine)
- Nginx = seul point d'entrée public (port 8080) — frontend et backend non exposés directement
