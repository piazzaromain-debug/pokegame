# 🎮 PokéGame — Projet Quiz Pokémon Multi-Joueur Temps Réel

> **Fichier de contexte pour Claude Code.** Ce document est la source de vérité pour toutes les décisions techniques, architecturales et de design du projet. Tu (Claude Code) dois t'y référer avant chaque décision et le suivre fidèlement. Si quelque chose te semble manquer ou contradictoire, demande à l'utilisateur avant d'improviser.

---

## 🎯 Objectif & Vision

**PokéGame** est un jeu de quiz web multi-joueur temps réel sur les **151 premiers Pokémon (Génération Kanto)**. Auto-hébergé sur un Mac via Docker, accessible depuis tous les devices (PC, smartphones, tablettes) du réseau WiFi local de l'utilisateur.

**Expérience cible** : un mini-jackbox/kahoot au feeling ultra "gaming" (glassmorphism néon, animations partout, sons authentiques) où des amis se challengent en live sur leur connaissance du Pokédex original.

**Public cible** : famille et amis de l'utilisateur (Boby), tous âges, tous niveaux de geek.

---

## 👤 Profil utilisateur (préférences à respecter)

- **Langue de communication** : français
- **Niveau technique** : connaît bien Python, curieux sur les BDD, notions Azure, se lance dans le dev d'apps dédiées
- **Vient du métier** : maintenance industrielle → expliquer les concepts avancés en détail quand pertinent
- **Veut apprendre** : Claude Code doit **expliquer ses choix** quand il fait quelque chose de non trivial (ex: pourquoi tel index PostgreSQL, pourquoi tel pattern React, pourquoi tel hook Socket.IO)

---

## 🎮 Règles du jeu (cahier des charges fonctionnel)

### Modes de jeu
1. **Mode "Devine le nom"** : une image de Pokémon s'affiche, le joueur choisit le bon nom parmi N propositions
2. **Mode "Devine l'image"** : un nom de Pokémon s'affiche, le joueur clique sur la bonne image parmi N propositions

### Difficulté (configurable par l'hôte de la partie)

| Paramètre | Facile | Normal | Difficile |
|---|---|---|---|
| ⏱️ Timer / question | 15 s | 10 s | 5 s |
| 🖼️ Image (mode "devine le nom") | Sprite officiel coloré | Silhouette noire | Floue qui se révèle progressivement avec le timer |
| 🎯 Nombre d'options | 4 | 4 | 6 |

### Paramètres de partie (configurables par l'hôte)
- **Mode de jeu** : "devine le nom" OU "devine l'image"
- **Difficulté** : Facile / Normal / Difficile
- **Nombre de questions** : libre (suggestions UI : 5, 10, 20, 50, 100)
- **Nombre max de joueurs** : libre (entre 2 et 10)

### Système de scoring
- **Bonus de rapidité** : plus le joueur répond vite, plus il gagne de points
- Formule recommandée : `points = max(100, 1000 - (temps_de_réponse_ms / temps_max_ms) * 900)` → minimum 100 pts pour bonne réponse, max ~1000 pts si réponse instantanée
- **Mauvaise réponse OU timer expiré** : 0 point + on passe à la question suivante (pas de game over, pas de pénalité négative)

### Joueurs
- **Pseudo libre** + **avatar Pokémon** choisi parmi les 151 (avant de jouer)
- Pas de compte/login/password (anonyme avec persistance via cookie/localStorage du `player_id` UUID)

### Lobby & Multi temps réel
- Page d'accueil = liste des **parties en attente** publiques
- N'importe qui peut **créer une partie** → devient l'**hôte**
- Les autres joueurs voient la liste et **rejoignent** une partie ouverte
- L'hôte clique sur "Lancer la partie" → la partie démarre **simultanément pour tous**
- Pendant la partie : **mêmes questions au même moment** pour tous les joueurs de la room
- Pas de chat. Mais **réactions emoji** broadcastées en live (genre Mario Kart 👍 😂 🔥 😎 ⚡)
- **Live scoreboard** : panneau latéral affichant en temps réel le score et la progression de chaque joueur

### Leaderboard
- **Leaderboards séparés** par mode de jeu × difficulté = **6 leaderboards distincts**
- Persisté en BDD, top 100 par leaderboard
- Filtrable par période : "Aujourd'hui" / "Cette semaine" / "Tout-temps"

### Statistiques persistées
- **Stats par joueur** : parties jouées, taux de réussite, Pokémon les plus ratés, badge progression
- **Stats globales** : Pokémon les plus difficiles tous joueurs confondus (utile pour calibrer)

### Achievements / Badges (système d'unlock)
Exemples (liste non exhaustive, à enrichir) :
- 🏆 **Maître de Kanto** : 100% de bonnes réponses sur une partie de 20+ questions
- 🔥 **Combo Master** : 10 bonnes réponses d'affilée
- 👑 **Premier sang** : 1ère victoire en multi
- ⚡ **Rapidité éclair** : répondre en moins d'1 seconde 5 fois dans une partie
- 🎓 **Apprenti dresseur** : 1ère partie terminée
- 💎 **Collectionneur** : avoir vu les 151 Pokémon dans des parties

### Mode Apprentissage (bonus)
- Mode libre, **sans timer**, où l'utilisateur parcourt les 151 Pokémon avec leur sprite + nom + types + description du Pokédex
- Pagination ou défilement, possibilité d'écouter le cri
- Pas de scoring, juste exploration

### Pokédex personnel (bonus)
- Page profil affichant les Pokémon que le joueur a déjà **rencontrés** (vus en partie) et **réussis** (correctement identifiés)
- Visualisation type "vignettes 151 cases", grisées si pas encore vues, colorées si réussies

---

## 🎨 Design system : "Glassmorphism Néon Gaming"

### Direction artistique
- **Theme** : Dark mode obligatoire, ambiance "salle d'arcade futuriste"
- **Glassmorphism** : `backdrop-filter: blur(20px)` sur les cards, `background: rgba(255,255,255,0.05)`, bordures lumineuses semi-transparentes
- **Néons** : effets `box-shadow` colorés intenses, `text-shadow` glow, bordures animées
- **Pas de plat** : tout doit avoir de la profondeur (couches superposées, ombres portées colorées, halos lumineux)

### Palette de couleurs (CSS variables)
```css
:root {
  /* Backgrounds */
  --bg-base: #0a0612;          /* Noir-violet profond */
  --bg-deep: #050309;          /* Encore plus sombre */
  --bg-card: rgba(255, 255, 255, 0.04);

  /* Néons primaires */
  --neon-cyan: #00f5ff;        /* Action / réponse */
  --neon-magenta: #ff00e5;     /* Accents / hover */
  --neon-yellow: #fff200;      /* Pikachu / score / highlights */
  --neon-green: #00ff88;       /* Bonne réponse / valid */
  --neon-red: #ff003c;         /* Mauvaise réponse / timer critique */
  --neon-purple: #b026ff;      /* Background gradients */

  /* Texte */
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.4);

  /* Glows réutilisables */
  --glow-cyan: 0 0 20px rgba(0, 245, 255, 0.6), 0 0 40px rgba(0, 245, 255, 0.3);
  --glow-magenta: 0 0 20px rgba(255, 0, 229, 0.6), 0 0 40px rgba(255, 0, 229, 0.3);
}
```

### Typographie
- **Display / titres** : `Orbitron` (futuriste, gaming) OU `Press Start 2P` (rétro 8-bit, à utiliser avec parcimonie pour les éléments emblématiques uniquement)
- **Body / UI** : `Rajdhani` ou `Exo 2` (sans-serif moderne, lisible, qui matche le ton gaming)
- **Code/score** : `JetBrains Mono` (chiffres tabulaires)
- ⚠️ **Bannir** : Inter, Roboto, Arial, system-ui (trop génériques, "AI slop")
- Charger via `@fontsource/*` (npm) plutôt que Google Fonts CDN, pour de la perf et fonctionnement offline

### Animations (Framer Motion + CSS)
**Niveau d'animation : Maximaliste assumé.** Le jeu doit *pulser* visuellement.

À implémenter au minimum :
- **Page load** : staggered reveals des cards (delay incrémental 0.05s)
- **Hover sur boutons/cards** : scale 1.05 + glow intensifié + slight tilt
- **Bonne réponse** : confettis (canvas-confetti), pulse vert, shake léger de joie
- **Mauvaise réponse** : shake horizontal rouge, screen flash subtil
- **Timer critique** (< 3s restantes) : pulse rouge intense + son tic-tac accéléré
- **Transition entre questions** : slide fluide + fade
- **Apparition score** : counter animé (de l'ancien score au nouveau)
- **Fond animé** : gradient mesh subtilement animé en fond de page (pas trop intrusif)
- **Particules** flottantes en fond du lobby (style "étoiles néon")
- **Révélation Pokémon** (mode "devine le nom" en difficile) : déblur progressif synchronisé avec le timer, accompagné du cri du Pokémon
- **Avatar joueur** dans le scoreboard : léger float vertical en idle

### Sons (à charger en lazy)
- **SFX** : clic boutons, hover, bonne/mauvaise réponse, timer tic-tac, lancement partie, victoire, défaite
- **Cris Pokémon authentiques** : depuis PokeAPI (`cries.latest`), joué à la révélation de la bonne réponse
- **Musique de fond** : optionnelle (libre droits, ambiance synthwave/chiptune), avec **toggle mute persistent** dans le header
- **Volume master** : slider dans les paramètres
- 🚨 Tous les sons **mute par défaut au 1er chargement** sur mobile (politique navigateurs), avec un toast "Active le son pour l'expérience complète 🔊"

### Layout & Composition
- **Asymétries assumées** : ne pas centrer mécaniquement, jouer sur des grilles décalées
- **Cards flottantes** avec rotations subtiles (-1° / +1°) pour le côté "magic the gathering"
- **Generous spacing** + densité contrôlée (pas d'horror vacui mais pas de vide gênant)
- **Mobile-first responsive** : tout doit être nickel sur smartphone (multi-device est l'usage principal)

### Accessibilité (à ne PAS sacrifier malgré le côté maximaliste)
- Contrastes WCAG AA minimum sur le texte
- `prefers-reduced-motion` respecté → réduit drastiquement les animations
- Navigation clavier fonctionnelle (Tab, Enter, Esc)
- ARIA labels sur les boutons icônes
- Focus visible (ring néon !)

---

## 🛠️ Stack technique

### Backend
- **Python 3.12**
- **FastAPI** (framework web async)
- **python-socketio** (WebSockets multi-room avec acks, reconnexion auto)
- **Uvicorn** (serveur ASGI)
- **SQLAlchemy 2.x** (ORM async) + **Alembic** (migrations)
- **Pydantic v2** (validation stricte des schemas)
- **asyncpg** (driver PostgreSQL async)
- **httpx** (appels HTTP async vers PokeAPI)
- **Loguru** (logs structurés JSON)
- **pytest** + **pytest-asyncio** (tests)

### Frontend
- **React 18** + **TypeScript**
- **Vite** (bundler)
- **TailwindCSS** (utility-first CSS)
- **Framer Motion** (animations React)
- **socket.io-client** (WebSocket client)
- **Zustand** (state management léger, parfait pour ce scope — préférer à Redux ici)
- **TanStack Query** (cache & fetch des data REST)
- **canvas-confetti** (animations confettis)
- **Howler.js** (gestion audio robuste cross-browser)
- **React Router v6** (routing)
- **Vitest** + **React Testing Library** (tests)

### Base de données
- **PostgreSQL 16** (image officielle Docker `postgres:16-alpine`)
- Utilisation poussée de **JSONB** pour les stats agrégées et les types Pokémon

### Reverse proxy
- **Nginx 1.25 alpine** servant tout sur le port `:8080`
  - `/` → frontend (build statique servi par nginx)
  - `/api/*` → backend FastAPI
  - `/socket.io/*` → backend Socket.IO (avec `upgrade` HTTP → WebSocket)

### Orchestration
- **Docker Compose v2**
- 4 services : `nginx`, `frontend`, `backend`, `db`

---

## 🏗️ Architecture & Structure du projet

```
pokegame/
├── CLAUDE.md                    # Ce fichier (toi tu es là)
├── README.md                    # Doc utilisateur (comment lancer le jeu)
├── docker-compose.yml           # Orchestration des 4 services
├── .env.example                 # Template variables d'env
├── .gitignore
├── Makefile                     # Raccourcis : up, down, logs, seed, reset-db, test
├── start.sh                     # Script de lancement convivial (vérifie prérequis + affiche IP)
│
├── nginx/
│   ├── Dockerfile
│   └── nginx.conf               # Reverse proxy config
│
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml           # Deps via uv ou poetry
│   ├── uv.lock (ou poetry.lock)
│   ├── alembic.ini
│   ├── alembic/
│   │   └── versions/            # Migrations SQL
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app + Socket.IO mount
│   │   ├── config.py            # Settings via Pydantic
│   │   ├── database.py          # Connection PG async
│   │   ├── logging_config.py    # Loguru setup
│   │   ├── models/              # SQLAlchemy models
│   │   │   ├── pokemon.py
│   │   │   ├── player.py
│   │   │   ├── game.py
│   │   │   ├── game_player.py
│   │   │   ├── game_question.py
│   │   │   ├── achievement.py
│   │   │   └── stats.py
│   │   ├── schemas/             # Pydantic schemas (DTOs)
│   │   ├── api/                 # Routes REST
│   │   │   ├── routes/
│   │   │   │   ├── pokemon.py
│   │   │   │   ├── players.py
│   │   │   │   ├── games.py
│   │   │   │   ├── leaderboard.py
│   │   │   │   └── stats.py
│   │   │   └── deps.py          # Dependencies FastAPI
│   │   ├── sockets/             # Logique Socket.IO
│   │   │   ├── server.py        # AsyncServer init
│   │   │   ├── lobby.py         # Events lobby (join, list_games)
│   │   │   ├── game.py          # Events partie (start, answer, react)
│   │   │   └── manager.py       # GameRoomManager (state des parties en cours)
│   │   ├── services/            # Logique métier
│   │   │   ├── pokeapi_seeder.py    # Seed depuis PokeAPI
│   │   │   ├── question_generator.py # Génère questions + leurres
│   │   │   ├── scoring.py            # Calcul des points
│   │   │   ├── achievement_engine.py # Détection unlock badges
│   │   │   └── stats_aggregator.py
│   │   └── utils/
│   ├── scripts/
│   │   └── seed.py              # Entry point du seed (idempotent)
│   └── tests/
│       ├── conftest.py
│       ├── test_scoring.py
│       ├── test_question_generator.py
│       └── test_api/
│
├── frontend/
│   ├── Dockerfile               # Multi-stage : build → nginx static OU dev mode Vite
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── index.html
│   ├── public/
│   │   └── sounds/              # SFX libres de droits
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── routes.tsx
│       ├── api/                 # Client REST (axios/fetch + types)
│       ├── socket/              # Client Socket.IO + hooks
│       ├── store/               # Zustand stores
│       │   ├── playerStore.ts
│       │   ├── gameStore.ts
│       │   └── settingsStore.ts
│       ├── pages/
│       │   ├── HomePage.tsx           # Landing + onboarding pseudo/avatar
│       │   ├── LobbyPage.tsx          # Liste parties + créer
│       │   ├── GameRoomPage.tsx       # Salle d'attente d'une partie
│       │   ├── GamePlayPage.tsx       # Partie en cours
│       │   ├── ResultsPage.tsx        # Récap fin de partie
│       │   ├── LeaderboardPage.tsx    # 6 leaderboards
│       │   ├── ProfilePage.tsx        # Profil + badges + Pokédex perso
│       │   └── LearningModePage.tsx   # Mode apprentissage
│       ├── components/
│       │   ├── ui/              # Composants atomiques (Button, Card, Input...)
│       │   ├── pokemon/         # PokemonCard, PokemonImage (gère les modes flou/silhouette)
│       │   ├── game/            # Timer, ScoreBoard, QuestionCard, AnswerOptions, EmojiReactions
│       │   ├── effects/         # Particles, Confetti, GlowBorder
│       │   └── layout/          # Header, MainLayout
│       ├── hooks/
│       │   ├── useSocket.ts
│       │   ├── useGameRoom.ts
│       │   ├── useTimer.ts
│       │   ├── useSound.ts
│       │   └── useReducedMotion.ts
│       ├── styles/
│       │   ├── globals.css
│       │   └── animations.css
│       ├── utils/
│       └── types/               # Shared TS types (synchros avec backend Pydantic)
│
└── docs/
    ├── ARCHITECTURE.md          # Diagrammes & décisions techniques
    ├── API.md                   # Routes REST + events Socket.IO documentés
    └── GAMEPLAY.md              # Règles du jeu détaillées
```

---

## 🗄️ Schéma de base de données

```sql
-- ============================================
-- Table: pokemon (151 entrées, statiques après seed)
-- ============================================
CREATE TABLE pokemon (
    id                  SERIAL PRIMARY KEY,
    pokedex_number      INTEGER UNIQUE NOT NULL CHECK (pokedex_number BETWEEN 1 AND 151),
    name_fr             VARCHAR(50) NOT NULL,
    sprite_url          TEXT NOT NULL,
    sprite_shiny_url    TEXT,
    cry_url             TEXT,
    types               JSONB NOT NULL,         -- ex: ["Plante", "Poison"]
    pokedex_description TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_pokemon_types ON pokemon USING GIN (types);

-- ============================================
-- Table: players
-- ============================================
CREATE TABLE players (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pseudo              VARCHAR(30) NOT NULL,
    avatar_pokemon_id   INTEGER NOT NULL REFERENCES pokemon(id),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_players_pseudo ON players(pseudo);

-- ============================================
-- Table: games (parties créées)
-- ============================================
CREATE TYPE game_mode AS ENUM ('guess_name', 'guess_image');
CREATE TYPE difficulty AS ENUM ('easy', 'normal', 'hard');
CREATE TYPE game_status AS ENUM ('waiting', 'in_progress', 'finished', 'abandoned');

CREATE TABLE games (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_player_id      UUID NOT NULL REFERENCES players(id),
    mode                game_mode NOT NULL,
    difficulty          difficulty NOT NULL,
    nb_questions        INTEGER NOT NULL CHECK (nb_questions > 0),
    max_players         INTEGER NOT NULL CHECK (max_players BETWEEN 2 AND 10),
    status              game_status NOT NULL DEFAULT 'waiting',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    started_at          TIMESTAMPTZ,
    finished_at         TIMESTAMPTZ
);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_mode_difficulty ON games(mode, difficulty);

-- ============================================
-- Table: game_players (qui joue dans quelle partie)
-- ============================================
CREATE TABLE game_players (
    game_id             UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id           UUID NOT NULL REFERENCES players(id),
    joined_at           TIMESTAMPTZ DEFAULT NOW(),
    final_score         INTEGER DEFAULT 0,
    final_rank          INTEGER,
    correct_answers     INTEGER DEFAULT 0,
    PRIMARY KEY (game_id, player_id)
);

-- ============================================
-- Table: game_questions (les questions générées par partie)
-- ============================================
CREATE TABLE game_questions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id             UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    question_index      INTEGER NOT NULL,                -- 0, 1, 2...
    correct_pokemon_id  INTEGER NOT NULL REFERENCES pokemon(id),
    options             JSONB NOT NULL,                  -- [{"id": 25, "name_fr": "Pikachu"}, ...]
    UNIQUE (game_id, question_index)
);

-- ============================================
-- Table: player_answers (réponse de chaque joueur)
-- ============================================
CREATE TABLE player_answers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id         UUID NOT NULL REFERENCES game_questions(id) ON DELETE CASCADE,
    player_id           UUID NOT NULL REFERENCES players(id),
    selected_pokemon_id INTEGER REFERENCES pokemon(id),  -- NULL si timeout
    is_correct          BOOLEAN NOT NULL,
    response_time_ms    INTEGER,                         -- NULL si timeout
    points_earned       INTEGER NOT NULL DEFAULT 0,
    answered_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_player_answers_player ON player_answers(player_id);
CREATE INDEX idx_player_answers_question ON player_answers(question_id);

-- ============================================
-- Table: player_stats (stats agrégées par joueur, mises à jour à chaque fin de partie)
-- ============================================
CREATE TABLE player_stats (
    player_id           UUID PRIMARY KEY REFERENCES players(id),
    games_played        INTEGER DEFAULT 0,
    games_won           INTEGER DEFAULT 0,                -- 1ère place en multi
    total_correct       INTEGER DEFAULT 0,
    total_questions     INTEGER DEFAULT 0,
    best_streak         INTEGER DEFAULT 0,
    total_score         BIGINT DEFAULT 0,
    pokemon_mistakes    JSONB DEFAULT '{}'::jsonb,        -- {"25": 3, "150": 1, ...} (count d'erreurs par pokémon)
    pokemon_seen        JSONB DEFAULT '[]'::jsonb,        -- [1, 4, 7, 25, ...] (Pokédex perso)
    pokemon_caught      JSONB DEFAULT '[]'::jsonb,        -- réussis au moins une fois
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: pokemon_stats (stats globales par Pokémon)
-- ============================================
CREATE TABLE pokemon_stats (
    pokemon_id          INTEGER PRIMARY KEY REFERENCES pokemon(id),
    times_shown         INTEGER DEFAULT 0,
    times_correct       INTEGER DEFAULT 0,
    times_incorrect     INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER,
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: achievements (catalogue + unlocks)
-- ============================================
CREATE TABLE achievements (
    code                VARCHAR(50) PRIMARY KEY,           -- ex: "kanto_master"
    name_fr             VARCHAR(100) NOT NULL,
    description_fr      TEXT NOT NULL,
    icon_emoji          VARCHAR(10),
    rarity              VARCHAR(20) DEFAULT 'common'       -- common / rare / epic / legendary
);

CREATE TABLE player_achievements (
    player_id           UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    achievement_code    VARCHAR(50) NOT NULL REFERENCES achievements(code),
    unlocked_at         TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (player_id, achievement_code)
);

-- ============================================
-- Vue matérialisée: leaderboards (rafraîchie à chaque fin de partie)
-- ============================================
CREATE MATERIALIZED VIEW leaderboard AS
SELECT
    g.mode,
    g.difficulty,
    p.id AS player_id,
    p.pseudo,
    p.avatar_pokemon_id,
    gp.final_score,
    g.finished_at,
    ROW_NUMBER() OVER (PARTITION BY g.mode, g.difficulty ORDER BY gp.final_score DESC) AS rank
FROM game_players gp
JOIN games g ON g.id = gp.game_id
JOIN players p ON p.id = gp.player_id
WHERE g.status = 'finished';

CREATE INDEX idx_leaderboard_mode_diff_score ON leaderboard(mode, difficulty, final_score DESC);
```

---

## 🔌 API Backend

### Routes REST (`/api/*`)

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/health` | Healthcheck |
| `GET` | `/api/pokemon` | Liste les 151 Pokémon (pour avatar selector + apprentissage) |
| `GET` | `/api/pokemon/:id` | Détail d'un Pokémon |
| `POST` | `/api/players` | Créer un profil joueur (pseudo + avatar_pokemon_id) → renvoie player_id |
| `GET` | `/api/players/:id` | Profil joueur + stats + achievements |
| `GET` | `/api/players/:id/pokedex` | Pokédex personnel du joueur |
| `GET` | `/api/games` | Liste les parties en attente (status='waiting') |
| `POST` | `/api/games` | Créer une nouvelle partie (host_player_id, mode, difficulty, nb_questions, max_players) |
| `GET` | `/api/games/:id` | Détail d'une partie |
| `GET` | `/api/leaderboard` | Top 100 leaderboard, filtres : `?mode=&difficulty=&period=` |
| `GET` | `/api/stats/global` | Stats globales (Pokémon les plus difficiles) |
| `GET` | `/api/achievements` | Catalogue de tous les achievements |

### Events Socket.IO

**Namespace** : `/` (default)

#### Émis par le **client** :
- `lobby:join` → entre dans le lobby (reçoit liste des parties)
- `lobby:leave`
- `game:join` `{game_id, player_id}` → rejoint une partie en lobby
- `game:leave` `{game_id, player_id}`
- `game:start` `{game_id}` → SEUL l'hôte peut émettre, lance la partie
- `game:answer` `{game_id, question_id, selected_pokemon_id, response_time_ms}`
- `game:react` `{game_id, emoji}` → broadcast emoji aux autres

#### Émis par le **serveur** :
- `lobby:games_updated` `[{game_id, host_pseudo, mode, difficulty, players_count, max_players}]`
- `game:player_joined` `{player_id, pseudo, avatar_pokemon_id}`
- `game:player_left` `{player_id}`
- `game:starting` `{countdown: 3}` → pre-game countdown
- `game:new_question` `{question_id, question_index, total, options: [...], image_url, time_limit_ms}`
- `game:question_revealed` `{correct_pokemon_id, sound_url}` → après timeout
- `game:player_answered` `{player_id, points_earned, total_score}` → broadcast à toute la room
- `game:scoreboard_update` `[{player_id, score, rank, last_correct: bool}]`
- `game:reaction` `{player_id, emoji}` → broadcast réactions
- `game:finished` `{final_scoreboard, achievements_unlocked: [...]}`

### Logique des "rooms" Socket.IO
- 1 room **`lobby`** : tous les joueurs en page d'accueil/lobby
- 1 room par partie : nom = `game:{game_id}`
- Quand une partie démarre, broadcast `game:starting` à `game:{id}` + retire la partie du lobby

---

## 🌱 Seed PokeAPI (script `backend/scripts/seed.py`)

**Comportement attendu** :
1. **Idempotent** : `if SELECT COUNT(*) FROM pokemon >= 151: log("Already seeded, skip"); return`
2. Pour chaque Pokémon ID 1 à 151 :
   - Fetch `https://pokeapi.co/api/v2/pokemon/{id}/` → sprites, types, cries
   - Fetch `https://pokeapi.co/api/v2/pokemon-species/{id}/` → noms localisés FR + flavor_text FR
   - Mapper les types EN → FR (table de correspondance hardcodée : `fire→Feu`, `water→Eau`, etc.)
   - Insérer en BDD
3. **Concurrency** : utiliser `asyncio.gather` avec sémaphore (max 10 requêtes parallèles, par respect du rate limit PokeAPI)
4. **Robustesse** : retry sur échec HTTP (3 essais avec backoff exponentiel)
5. **Progression** : afficher une barre de progression dans les logs (`[42/151] Aérodactyl ✓`)

**Données à extraire** :
- `name_fr` : `species.names[]` filtré sur `language.name == "fr"`
- `sprite_url` : `sprites.other["official-artwork"].front_default` (haute qualité) avec fallback `sprites.front_default`
- `sprite_shiny_url` : `sprites.other["official-artwork"].front_shiny` avec fallback `sprites.front_shiny`
- `cry_url` : `cries.latest`
- `types` : `[map_fr(t.type.name) for t in pokemon.types]`
- `pokedex_description` : `species.flavor_text_entries[]` filtré FR + version (préférer "red" ou "blue"), nettoyé des `\n` et `\f`

---

## 🐳 Docker Compose & Lancement

### `docker-compose.yml` (structure attendue)
```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: pokegame
      POSTGRES_USER: pokegame
      POSTGRES_PASSWORD: ${DB_PASSWORD:-pokegame_dev}
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pokegame"]
      interval: 5s
      retries: 5
    networks: [pokegame_net]

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql+asyncpg://pokegame:${DB_PASSWORD:-pokegame_dev}@db:5432/pokegame
      LOG_LEVEL: INFO
    depends_on:
      db: { condition: service_healthy }
    volumes:
      - ./backend:/app  # hot-reload en dev
    networks: [pokegame_net]
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build:
      context: ./frontend
      target: dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
    networks: [pokegame_net]
    command: npm run dev -- --host 0.0.0.0

  nginx:
    build: ./nginx
    ports:
      - "8080:80"
    depends_on: [frontend, backend]
    networks: [pokegame_net]

volumes:
  pg_data:

networks:
  pokegame_net:
    driver: bridge
```

### `nginx.conf` (extrait clé)
```nginx
server {
    listen 80;

    # Frontend Vite dev (HMR via WebSocket)
    location / {
        proxy_pass http://frontend:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # API REST
    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Socket.IO (WebSocket upgrade obligatoire)
    location /socket.io/ {
        proxy_pass http://backend:8000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

### `Makefile`
```makefile
.PHONY: help up down logs logs-back logs-front seed reset-db test build

help:                  ## Affiche cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

up:                    ## Lance tous les services
	docker compose up -d
	@echo "🎮 PokéGame est lancé !"
	@echo "📍 Accès local : http://localhost:8080"
	@echo "📡 Accès réseau : http://$$(ipconfig getifaddr en0):8080"

down:                  ## Arrête tous les services
	docker compose down

logs:                  ## Affiche tous les logs
	docker compose logs -f

logs-back:             ## Logs backend uniquement
	docker compose logs -f backend

logs-front:            ## Logs frontend uniquement
	docker compose logs -f frontend

seed:                  ## Lance le seed Pokémon depuis PokeAPI
	docker compose exec backend python scripts/seed.py

reset-db:              ## ⚠️ Reset complet de la BDD
	docker compose down -v
	docker compose up -d db
	sleep 5
	docker compose up -d
	make seed

test:                  ## Lance tous les tests (back + front)
	docker compose exec backend pytest
	docker compose exec frontend npm test

build:                 ## Rebuild complet des images
	docker compose build --no-cache
```

### `start.sh` (UX premier lancement)
```bash
#!/usr/bin/env bash
set -e
echo "🎮 ===== PokéGame Launcher ====="

# Vérifier Docker installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Installe-le d'abord : https://www.docker.com/"
    exit 1
fi

# Vérifier Docker daemon actif
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon non démarré. Lance Docker Desktop puis relance ce script."
    exit 1
fi

echo "✅ Docker OK"
echo "🚀 Lancement des services..."
docker compose up -d --build

echo "⏳ Attente que les services soient prêts..."
sleep 5

# Récupérer IP locale (Mac)
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "unavailable")

echo ""
echo "🎉 PokéGame est prêt !"
echo "📍 Sur ce Mac : http://localhost:8080"
echo "📱 Pour les autres devices du réseau : http://$LOCAL_IP:8080"
echo ""
echo "💡 Utiliser 'make logs' pour suivre les logs en direct"
echo "💡 Utiliser 'make down' pour tout arrêter"
```

---

## 🧪 Tests

### Backend (pytest)
- **Tests unitaires** sur les services critiques :
  - `test_scoring.py` : formule de points (cas: réponse instant, réponse au timer, mauvaise réponse, timeout)
  - `test_question_generator.py` : génération sans doublons, options correctes, leurres pertinents
  - `test_achievement_engine.py` : détection des unlocks
- **Tests d'intégration API** : routes principales (POST player, POST game, GET leaderboard)
- **Tests Socket.IO** : utiliser `python-socketio` AsyncClient pour simuler 2-3 clients dans une partie

### Frontend (Vitest)
- **Tests composants** : Timer (countdown correct), AnswerOption (clic + état correct/incorrect)
- **Tests stores Zustand** : transitions d'état logiques
- **Tests hooks** : useTimer, useSocket (mock socket)

**Pas de tests E2E pour le MVP** (Playwright/Cypress = trop lourd à mettre en place pour un projet perso).

---

## 📝 Conventions de code

### Python
- **Type hints obligatoires** sur signatures publiques
- **Pydantic v2** pour tous les DTOs (api request/response, events Socket.IO)
- **async/await** partout (pas de blocking I/O)
- **Loguru** pour les logs : `logger.info("Game started", game_id=g.id, players=len(p))`
- Format : `ruff` + `black` (line length 100)
- Imports triés par `ruff`/`isort`

### TypeScript
- **Strict mode activé** (`"strict": true` dans tsconfig)
- **Pas de `any`** (utiliser `unknown` + narrowing si nécessaire)
- Composants en **fonction + hooks** (jamais de class components)
- Naming : `PascalCase` pour composants, `camelCase` pour fonctions/variables, `UPPER_SNAKE` pour constantes
- Format : `prettier` + `eslint`

### Git / Commits
- Convention **Conventional Commits** : `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- 1 commit par feature logique, pas de "wip" en main
- Branche principale : `main`
- Branches features : `feat/lobby-multi`, `feat/scoring`, etc.

---

## 🚀 Workflow de développement attendu

Claude Code doit suivre cet ordre pour développer en parallèle les 3 instances (mais avec des dépendances logiques) :

### Phase 0 — Setup repo (séquentiel, 15 min)
1. Demander à l'utilisateur l'URL du repo Git (cf. prompt de démarrage)
2. `git clone` ou `git init` + `git remote add origin <url>`
3. Créer la structure de dossiers complète (avec fichiers `.gitkeep` si besoin)
4. Créer `docker-compose.yml`, `Makefile`, `start.sh`, `.env.example`, `.gitignore`, `README.md` initial
5. **Premier commit** : `chore: initial project structure`

### Phase 1 — Fondations (parallèle, ~45 min)
En parallèle (3 sous-tâches indépendantes) :
- **DB** : Dockerfile postgres + alembic init + 1ère migration (toutes les tables ci-dessus) + script seed.py squelette
- **Backend** : Dockerfile + pyproject.toml + FastAPI app minimale + healthcheck + Socket.IO mount + connexion BDD
- **Frontend** : Dockerfile (multi-stage dev/prod) + Vite scaffold + Tailwind config + design tokens CSS + page d'accueil placeholder

→ Commit : `feat: project foundations (db schema, backend skeleton, frontend scaffold)`

### Phase 2 — Seed & données (séquentiel, 30 min)
- Implémenter `scripts/seed.py` complet (PokeAPI)
- Tester le seed (`make seed`)
- Endpoint `GET /api/pokemon` qui renvoie les 151
- Page frontend simple qui affiche les 151 sprites pour valider l'intégration

→ Commit : `feat: pokemon seed from PokeAPI + listing endpoint`

### Phase 3 — Onboarding joueur (parallèle, ~30 min)
- **Back** : `POST /api/players` (création), `GET /api/players/:id`
- **Front** : page d'accueil avec saisie pseudo + avatar Pokémon picker (grille des 151) + persistance localStorage

→ Commit : `feat: player onboarding (pseudo + avatar selection)`

### Phase 4 — Lobby (parallèle, ~1h)
- **Back** : `POST /api/games`, `GET /api/games`, events Socket.IO `lobby:*`, `game:join`
- **Front** : page Lobby (liste parties live via WebSocket), formulaire création partie, page GameRoom (salle d'attente avec liste joueurs en live)

→ Commit : `feat: multiplayer lobby with realtime updates`

### Phase 5 — Cœur du jeu (séquentiel, ~2h)
- Service `question_generator.py` (logique selon mode/difficulté/leurres)
- Service `scoring.py`
- Events Socket.IO `game:start`, `game:new_question`, `game:answer`, `game:question_revealed`, `game:scoreboard_update`, `game:finished`
- Page GamePlayPage avec :
  - Timer animé synchronisé avec le serveur
  - Affichage image (avec mode flou progressif en hard)
  - 4 ou 6 options cliquables (selon difficulté)
  - Live scoreboard latéral
  - Animations bonne/mauvaise réponse
  - Son du Pokémon à la révélation
- Page Results avec récap + confettis pour le gagnant

→ Commit : `feat: core gameplay loop (questions, timer, scoring, results)`

### Phase 6 — Leaderboards & Stats (parallèle, ~45 min)
- **Back** : refresh de la materialized view, endpoint `/api/leaderboard?mode=&difficulty=&period=`, agrégation `player_stats` post-partie
- **Front** : page Leaderboard avec onglets (6 tables), page Profil avec stats personnelles + Pokédex perso

→ Commit : `feat: leaderboards and player stats`

### Phase 7 — Achievements & polish (parallèle, ~1h)
- **Back** : `achievement_engine.py` qui détecte les unlocks à chaque fin de partie + seed du catalogue d'achievements
- **Front** : toast d'unlock pendant la partie/à la fin, badges sur la page profil
- **Front** : réactions emoji pendant la partie (boutons + broadcast Socket.IO)
- **Polish global** : sons, particules, transitions, mode reduced-motion

→ Commit : `feat: achievements + emoji reactions + polish`

### Phase 8 — Mode apprentissage (parallèle, ~30 min)
- Page LearningModePage : grille des 151 + détail au clic (sprite, types, description, cri)

→ Commit : `feat: learning mode`

### Phase 9 — Tests & docs (séquentiel, ~45 min)
- Tests unitaires sur scoring, question_generator, achievement_engine
- Tests intégration API principales
- 1 test Socket.IO end-to-end (2 joueurs simulés jouent une partie courte)
- Compléter `README.md` avec : prérequis, install, lancement, captures d'écran, troubleshooting
- Compléter `docs/API.md` et `docs/ARCHITECTURE.md`

→ Commit : `test: unit and integration tests + docs`

### Phase 10 — Final review
- `make build && make up && make seed`
- Tester un parcours complet (création joueur → lobby → multi 2 joueurs → leaderboard → profil)
- Vérifier responsive mobile (Chrome DevTools)
- Vérifier que `start.sh` fonctionne depuis zéro
- Push final

---

## ⚠️ Pièges & règles strictes pour Claude Code

1. **Ne JAMAIS exposer la BDD au réseau hôte** (port 5432 non publié dans docker-compose). Seul Nginx (8080) est public.
2. **Ne JAMAIS hardcoder des secrets** : tout passe par `.env` (avec `.env.example` versionné, mais `.env` dans `.gitignore`).
3. **Ne JAMAIS faire confiance au client** sur le scoring : la **vérification de la bonne réponse + calcul des points** se fait **côté serveur** uniquement. Le client envoie juste `{selected_pokemon_id, response_time_ms}`.
4. **Ne JAMAIS broadcaster `correct_pokemon_id` avant timeout** : le serveur attend la fin du timer (ou que tous les joueurs aient répondu) avant de révéler la réponse via `game:question_revealed`.
5. **Synchroniser le timer côté serveur** : le serveur est la source de vérité. Le client affiche un compteur basé sur `time_limit_ms` reçu, mais à la fin, c'est le serveur qui décide.
6. **Race conditions Socket.IO** : protéger les sections critiques du `GameRoomManager` avec `asyncio.Lock()` (notamment quand 2 joueurs répondent en même temps).
7. **CORS** : avec Nginx en reverse proxy, **PAS BESOIN** d'autoriser CORS larges côté FastAPI (même origine). Ne configurer CORS que pour `localhost:8080` en dev.
8. **Mobile-first toujours** : tester chaque page en viewport 375px en premier, puis desktop.
9. **Expliquer les choix non triviaux** dans des commentaires de code ou des messages au user (ex: "j'utilise une materialized view ici car le leaderboard sera consulté très souvent et changera peu, c'est plus performant que de recalculer à chaque GET").
10. **Demander avant d'improviser** si une décision technique sort de ce CLAUDE.md (ex: changement de librairie, nouvelle dépendance lourde, refonte d'archi).

---

## 🎓 Notes pédagogiques pour l'utilisateur

Au fil du dev, Claude Code doit **expliquer ces concepts** quand ils sont rencontrés (ils sont précieux pour le profil de Boby) :

- **Async/await en Python** (avantages vs threads, asyncio.gather, sémaphores)
- **WebSocket vs HTTP polling** (pourquoi le temps réel a besoin de WS)
- **Socket.IO rooms et namespaces** (architecture pub/sub)
- **PostgreSQL JSONB** (différence avec JSON, indexation GIN)
- **Materialized views** (cache de requêtes complexes)
- **Reverse proxy** (séparation des préoccupations, lien avec Azure App Gateway / AWS ALB)
- **Docker networks** (pourquoi les services se parlent par nom de service)
- **Healthchecks et dépendances de services** (`depends_on: condition: service_healthy`)
- **Migrations Alembic** (versioning de schéma, équivalent EF Migrations en .NET)
- **State management React** (pourquoi Zustand plutôt que Context API ou Redux pour ce scope)
- **TanStack Query** (cache + dedup + revalidation)
- **CSS Variables** (theming maintenable)
- **prefers-reduced-motion** (accessibilité, l'éthique du dev moderne)

---

## ✅ Definition of Done (MVP)

Le MVP est terminé quand **toutes** ces conditions sont remplies :

- [ ] `./start.sh` lance tout sans erreur sur un Mac vierge (Docker installé seulement)
- [ ] Les 151 Pokémon sont en BDD avec sprites, cris, types, descriptions FR
- [ ] Un utilisateur peut créer un profil (pseudo + avatar) qui persiste entre les sessions
- [ ] 2+ utilisateurs sur des devices différents du WiFi peuvent rejoindre la même partie via le lobby
- [ ] Une partie multi temps réel se déroule correctement (mêmes questions au même moment, scores live, fin synchro)
- [ ] Les 2 modes de jeu fonctionnent (devine le nom, devine l'image)
- [ ] Les 3 niveaux de difficulté sont implémentés (timer, image, nb options)
- [ ] L'effet flou progressif marche en mode difficile
- [ ] Le cri du Pokémon est joué à la révélation
- [ ] Les 6 leaderboards (2 modes × 3 difficultés) sont consultables et triés
- [ ] Le profil joueur affiche stats + Pokédex perso + badges
- [ ] Au moins 6 achievements sont implémentés et débloqués correctement
- [ ] Les réactions emoji fonctionnent en multi temps réel
- [ ] Mode apprentissage fonctionnel
- [ ] L'UI est responsive et utilisable sur smartphone
- [ ] Le mode reduced-motion est respecté
- [ ] Tests pytest passent (au moins scoring + question_generator + 1 test Socket.IO)
- [ ] Tests vitest passent (au moins Timer + 2 composants)
- [ ] `README.md` à jour avec captures d'écran
- [ ] Pas de warning console critique en dev
- [ ] Le code suit les conventions (`ruff`/`black`/`prettier`/`eslint` clean)

---

**Fin du CLAUDE.md.** Bon dev ! 🎮⚡
