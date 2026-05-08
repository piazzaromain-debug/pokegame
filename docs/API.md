# API — PokéGame

> Documentation des routes REST et des events Socket.IO.  
> Mis à jour au fur et à mesure du développement.

## Routes REST (`/api/*`)

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/health` | Healthcheck |
| `GET` | `/api/pokemon` | Liste les 151 Pokémon |
| `GET` | `/api/pokemon/:id` | Détail d'un Pokémon |
| `POST` | `/api/players` | Créer un profil joueur |
| `GET` | `/api/players/:id` | Profil + stats + achievements |
| `GET` | `/api/players/:id/pokedex` | Pokédex personnel |
| `GET` | `/api/games` | Parties en attente |
| `POST` | `/api/games` | Créer une partie |
| `GET` | `/api/games/:id` | Détail d'une partie |
| `GET` | `/api/leaderboard` | Top 100 (`?mode=&difficulty=&period=`) |
| `GET` | `/api/stats/global` | Stats globales |
| `GET` | `/api/achievements` | Catalogue achievements |

## Events Socket.IO

### Client → Serveur

| Event | Payload | Description |
|---|---|---|
| `lobby:join` | — | Rejoindre le lobby |
| `lobby:leave` | — | Quitter le lobby |
| `game:join` | `{game_id, player_id}` | Rejoindre une partie |
| `game:leave` | `{game_id, player_id}` | Quitter une partie |
| `game:start` | `{game_id}` | Lancer la partie (hôte seulement) |
| `game:answer` | `{game_id, question_id, selected_pokemon_id, response_time_ms}` | Envoyer une réponse |
| `game:react` | `{game_id, emoji}` | Envoyer une réaction emoji |

### Serveur → Client

| Event | Payload | Description |
|---|---|---|
| `lobby:games_updated` | `[{game_id, host_pseudo, mode, difficulty, players_count, max_players}]` | Liste des parties mise à jour |
| `game:player_joined` | `{player_id, pseudo, avatar_pokemon_id}` | Nouveau joueur |
| `game:player_left` | `{player_id}` | Joueur parti |
| `game:starting` | `{countdown: 3}` | Compte à rebours pré-partie |
| `game:new_question` | `{question_id, question_index, total, options, image_url, time_limit_ms}` | Nouvelle question |
| `game:question_revealed` | `{correct_pokemon_id, sound_url}` | Révélation réponse (après timeout) |
| `game:player_answered` | `{player_id, points_earned, total_score}` | Broadcast réponse joueur |
| `game:scoreboard_update` | `[{player_id, score, rank, last_correct}]` | Mise à jour scoreboard live |
| `game:reaction` | `{player_id, emoji}` | Broadcast réaction emoji |
| `game:finished` | `{final_scoreboard, achievements_unlocked}` | Fin de partie |
