# API — PokéGame

> Documentation des routes REST et des events Socket.IO.
> Mis à jour au fur et à mesure du développement.

---

## Routes REST (`/api/*`)

### Vue d'ensemble

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/health` | Healthcheck |
| `GET` | `/api/pokemon` | Liste les 151 Pokémon |
| `GET` | `/api/pokemon/{id}` | Détail d'un Pokémon |
| `POST` | `/api/players` | Créer un profil joueur |
| `GET` | `/api/players/{id}` | Profil joueur + mise à jour `last_seen_at` |
| `PUT` | `/api/players/{id}` | Modifier pseudo et/ou avatar |
| `GET` | `/api/players/{id}/pokedex` | Pokédex personnel (seen + caught) |
| `GET` | `/api/players/{id}/stats` | Stats détaillées du joueur |
| `GET` | `/api/games` | Parties en attente (status=waiting) |
| `POST` | `/api/games` | Créer une partie |
| `GET` | `/api/games/{id}` | Détail d'une partie + liste des joueurs |
| `GET` | `/api/leaderboard` | Top 100 (`?mode=&difficulty=&period=`) |
| `GET` | `/api/stats/global` | Stats globales (Pokémon les plus difficiles) |
| `GET` | `/api/achievements` | Catalogue achievements |

---

### `GET /api/health`

**Response 200**
```json
{
  "status": "ok",
  "service": "pokegame-backend"
}
```

---

### `GET /api/pokemon`

Retourne les 151 Pokémon triés par numéro de Pokédex.

**Response 200** — `list[PokemonResponse]`
```json
[
  {
    "id": 1,
    "pokedex_number": 1,
    "name_fr": "Bulbizarre",
    "sprite_url": "https://raw.githubusercontent.com/.../bulbasaur.png",
    "sprite_shiny_url": "https://raw.githubusercontent.com/.../bulbasaur-shiny.png",
    "cry_url": "https://raw.githubusercontent.com/PokeAPI/cries/.../1.ogg",
    "types": ["Plante", "Poison"],
    "pokedex_description": "Une étrange graine a été plantée sur son dos...",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### `GET /api/pokemon/{pokemon_id}`

**Path param** : `pokemon_id` (integer, PK interne)

**Response 200** — `PokemonResponse` (voir format ci-dessus)

**Response 404**
```json
{ "detail": "Pokémon non trouvé" }
```

---

### `POST /api/players`

Crée un joueur. Génère automatiquement un UUID et crée une entrée vide dans `player_stats`.

**Request body**
```json
{
  "pseudo": "Boby",
  "avatar_pokemon_id": 25
}
```

Contraintes : `pseudo` 2–30 caractères, `avatar_pokemon_id` doit exister en BDD.

**Response 201** — `PlayerResponse`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "pseudo": "Boby",
  "avatar_pokemon_id": 25,
  "created_at": "2024-01-01T10:00:00Z",
  "last_seen_at": "2024-01-01T10:00:00Z"
}
```

**Response 404** si `avatar_pokemon_id` inconnu.

---

### `GET /api/players/{player_id}`

Retourne le profil et met à jour `last_seen_at`.

**Response 200** — `PlayerResponse` (voir format ci-dessus)

---

### `PUT /api/players/{player_id}`

Modifie le pseudo et/ou l'avatar. Les champs sont optionnels.

**Request body**
```json
{
  "pseudo": "Boby2",
  "avatar_pokemon_id": 6
}
```

**Response 200** — `PlayerResponse`

---

### `GET /api/players/{player_id}/pokedex`

Pokédex personnel : listes des IDs Pokémon vus et réussis.

**Response 200**
```json
{
  "pokemon_seen": [1, 4, 7, 25, 150],
  "pokemon_caught": [25, 150]
}
```

---

### `GET /api/players/{player_id}/stats`

Stats détaillées du joueur.

**Response 200**
```json
{
  "player_id": "550e8400-...",
  "games_played": 12,
  "games_won": 3,
  "total_correct": 87,
  "total_questions": 120,
  "best_streak": 8,
  "total_score": 74500,
  "accuracy": 72.5,
  "pokemon_mistakes": { "25": 3, "150": 1 },
  "pokemon_seen": [1, 4, 7, 25],
  "pokemon_caught": [25]
}
```

---

### `GET /api/games`

Liste les parties avec `status='waiting'`.

**Response 200** — `list[GameListItem]`
```json
[
  {
    "id": "abc123...",
    "host_pseudo": "Boby",
    "host_avatar_pokemon_id": 25,
    "mode": "guess_name",
    "difficulty": "normal",
    "nb_questions": 20,
    "max_players": 4,
    "players_count": 2,
    "status": "waiting"
  }
]
```

---

### `POST /api/games`

Crée une partie et ajoute l'hôte dans `game_players`. Émet `lobby:games_updated` sur le Socket.IO lobby.

**Request body**
```json
{
  "host_player_id": "550e8400-...",
  "mode": "guess_name",
  "difficulty": "normal",
  "nb_questions": 20,
  "max_players": 4
}
```

Valeurs valides :
- `mode` : `"guess_name"` | `"guess_image"`
- `difficulty` : `"easy"` | `"normal"` | `"hard"`
- `nb_questions` : 1–100
- `max_players` : 2–10

**Response 201** — `GameResponse`
```json
{
  "id": "abc123...",
  "host_player_id": "550e8400-...",
  "mode": "guess_name",
  "difficulty": "normal",
  "nb_questions": 20,
  "max_players": 4,
  "status": "waiting",
  "created_at": "2024-01-01T10:00:00Z",
  "started_at": null,
  "finished_at": null
}
```

---

### `GET /api/games/{game_id}`

Retourne une partie avec sa liste de joueurs actuels.

**Response 200**
```json
{
  "id": "abc123...",
  "host_player_id": "550e8400-...",
  "mode": "guess_name",
  "difficulty": "normal",
  "nb_questions": 20,
  "max_players": 4,
  "status": "waiting",
  "created_at": "...",
  "started_at": null,
  "finished_at": null,
  "players": [
    { "id": "550e8400-...", "pseudo": "Boby", "avatar_pokemon_id": 25 }
  ]
}
```

---

### `GET /api/leaderboard`

Top 100 depuis la materialized view `leaderboard` (fallback jointure directe si view vide).

**Query params** (tous obligatoires sauf `period` et `limit`) :

| Param | Type | Valeurs | Description |
|---|---|---|---|
| `mode` | string | `guess_name`, `guess_image` | Mode de jeu |
| `difficulty` | string | `easy`, `normal`, `hard` | Difficulté |
| `period` | string | `today`, `week`, `all` (défaut) | Filtre temporel |
| `limit` | integer | 1–100 (défaut 100) | Nb d'entrées |

**Response 200** — `list[LeaderboardEntry]`
```json
[
  {
    "rank": 1,
    "player_id": "550e8400-...",
    "pseudo": "Boby",
    "avatar_pokemon_id": 25,
    "final_score": 9750,
    "finished_at": "2024-01-01T11:00:00Z"
  }
]
```

---

### `GET /api/stats/global`

Stats globales agrégées. Pokémon les plus difficiles triés par taux d'erreur.

**Response 200**
```json
{
  "hardest_pokemon": [
    {
      "id": 150,
      "name_fr": "Mewtwo",
      "sprite_url": "...",
      "error_rate": 68.5,
      "times_shown": 120
    }
  ],
  "total_games_played": 45,
  "total_players": 12
}
```

---

### `GET /api/achievements`

Catalogue complet des achievements triés par rareté.

**Response 200**
```json
[
  {
    "code": "first_game",
    "name_fr": "Apprenti dresseur",
    "description_fr": "Terminer ta première partie",
    "icon_emoji": "🎓",
    "rarity": "common"
  }
]
```

---

## Events Socket.IO

**Namespace** : `/` (default)
**Transport** : WebSocket avec upgrade HTTP → WS via Nginx (`/socket.io/*`)

---

### Client → Serveur

| Event | Payload | Description |
|---|---|---|
| `lobby:join` | — | Rejoindre le lobby (reçoit `lobby:games_updated` en retour) |
| `lobby:leave` | — | Quitter le lobby |
| `game:join` | `{game_id, player_id, pseudo, avatar_pokemon_id}` | Rejoindre une partie |
| `game:leave` | `{game_id, player_id}` | Quitter une partie |
| `game:start` | `{game_id, player_id}` | Lancer la partie (hôte seulement) |
| `game:answer` | `{game_id, question_id, selected_pokemon_id, response_time_ms, player_id}` | Envoyer une réponse |
| `game:react` | `{game_id, player_id, emoji}` | Envoyer une réaction emoji |

---

### Serveur → Client

| Event | Payload | Description |
|---|---|---|
| `lobby:games_updated` | `[GameSummary]` | Liste des parties en attente mise à jour |
| `game:room_state` | `{players: [PlayerInRoom]}` | État complet de la room (envoyé au joueur qui rejoint) |
| `game:player_joined` | `{player_id, pseudo, avatar_pokemon_id}` | Nouveau joueur dans la salle |
| `game:player_left` | `{player_id}` | Joueur parti |
| `game:starting` | `{countdown: 3}` | Compte à rebours pré-partie |
| `game:new_question` | `QuestionPayload` | Nouvelle question |
| `game:question_revealed` | `RevealPayload` | Révélation de la bonne réponse (après timeout ou toutes réponses reçues) |
| `game:player_answered` | `{player_id, points_earned, total_score, is_correct}` | Broadcast qu'un joueur a répondu |
| `game:scoreboard_update` | `[ScoreboardEntry]` | Mise à jour du scoreboard live |
| `game:reaction` | `{player_id, emoji}` | Broadcast réaction emoji |
| `game:finished` | `FinishedPayload` | Fin de partie (envoyé individuellement à chaque joueur) |
| `error` | `{message}` | Erreur (ex: hôte non reconnu, partie introuvable) |

---

### Détail des payloads Phase 5

#### `lobby:games_updated`
```json
[
  {
    "game_id": "abc123...",
    "players_count": 2,
    "status": "waiting"
  }
]
```
> Note : lors de la création via `POST /api/games`, le payload est plus riche (inclut `host_pseudo`, `mode`, `difficulty`, etc.)

#### `game:room_state`
```json
{
  "players": [
    {
      "pseudo": "Boby",
      "avatar_pokemon_id": 25,
      "sid": "abc123",
      "score": 0
    }
  ]
}
```

#### `game:new_question`
```json
{
  "question_id": "uuid...",
  "question_index": 0,
  "total": 20,
  "options": [
    { "id": 25, "name_fr": "Pikachu" },
    { "id": 35, "name_fr": "Clefairy" },
    { "id": 39, "name_fr": "Jigglypuff" },
    { "id": 54, "name_fr": "Psyduck" }
  ],
  "image_url": "https://raw.githubusercontent.com/.../pikachu.png",
  "time_limit_ms": 10000,
  "difficulty": "normal"
}
```

#### `game:question_revealed`
```json
{
  "correct_pokemon_id": 25,
  "name_fr": "Pikachu",
  "cry_url": "https://raw.githubusercontent.com/PokeAPI/cries/.../25.ogg"
}
```

#### `game:player_answered`
```json
{
  "player_id": "550e8400-...",
  "points_earned": 850,
  "total_score": 2350,
  "is_correct": true
}
```

#### `game:scoreboard_update`
```json
[
  {
    "player_id": "550e8400-...",
    "pseudo": "Boby",
    "avatar_pokemon_id": 25,
    "score": 2350,
    "rank": 1
  }
]
```

#### `game:finished`
Envoyé **individuellement** à chaque joueur (les `achievements_unlocked` sont propres à chaque joueur).
```json
{
  "final_scoreboard": [
    {
      "player_id": "550e8400-...",
      "pseudo": "Boby",
      "avatar_pokemon_id": 25,
      "score": 9750,
      "rank": 1
    }
  ],
  "achievements_unlocked": [
    {
      "code": "first_victory",
      "name_fr": "Premier sang",
      "description_fr": "Remporter ta première victoire en multi",
      "icon_emoji": "👑",
      "rarity": "common"
    }
  ]
}
```

---

### Logique des rooms Socket.IO

- 1 room **`lobby`** : tous les joueurs en page d'accueil/lobby
- 1 room **`game:{game_id}`** par partie : broadcast des questions, scores, réactions
- Quand une partie démarre, broadcast `game:starting` à `game:{id}` + la boucle de jeu est lancée via `asyncio.create_task`
- Le serveur est la **source de vérité** pour le timer et le scoring — le client n'envoie que `selected_pokemon_id` + `response_time_ms`
- `correct_pokemon_id` n'est jamais envoyé avant l'expiration du timer (event `game:question_revealed`)
