"""Initial schema — all tables for PokéGame Phase 1.

Revision ID: 001
Revises:
Create Date: 2026-05-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ---------------------------------------------------------------------------
# upgrade
# ---------------------------------------------------------------------------

def upgrade() -> None:
    # ------------------------------------------------------------------
    # PostgreSQL ENUM types
    # ------------------------------------------------------------------
    op.execute(sa.text("CREATE TYPE game_mode AS ENUM ('guess_name', 'guess_image')"))
    op.execute(sa.text("CREATE TYPE difficulty AS ENUM ('easy', 'normal', 'hard')"))
    op.execute(sa.text("CREATE TYPE game_status AS ENUM ('waiting', 'in_progress', 'finished', 'abandoned')"))

    # ------------------------------------------------------------------
    # Table: pokemon
    # ------------------------------------------------------------------
    op.execute(sa.text("""
        CREATE TABLE pokemon (
            id                  SERIAL PRIMARY KEY,
            pokedex_number      INTEGER UNIQUE NOT NULL
                                    CHECK (pokedex_number BETWEEN 1 AND 151),
            name_fr             VARCHAR(50) NOT NULL,
            sprite_url          TEXT NOT NULL,
            sprite_shiny_url    TEXT,
            cry_url             TEXT,
            types               JSONB NOT NULL,
            pokedex_description TEXT,
            created_at          TIMESTAMPTZ DEFAULT NOW()
        )
    """))
    # GIN index for JSONB column
    op.execute(sa.text("CREATE INDEX idx_pokemon_types ON pokemon USING GIN (types)"))

    # ------------------------------------------------------------------
    # Table: players  (references pokemon)
    # ------------------------------------------------------------------
    op.execute(sa.text("""
        CREATE TABLE players (
            id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            pseudo            VARCHAR(30) NOT NULL,
            avatar_pokemon_id INTEGER NOT NULL REFERENCES pokemon(id),
            created_at        TIMESTAMPTZ DEFAULT NOW(),
            last_seen_at      TIMESTAMPTZ DEFAULT NOW()
        )
    """))
    op.execute(sa.text("CREATE INDEX idx_players_pseudo ON players(pseudo)"))

    # ------------------------------------------------------------------
    # Table: games  (references players)
    # ------------------------------------------------------------------
    op.execute(sa.text("""
        CREATE TABLE games (
            id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            host_player_id UUID NOT NULL REFERENCES players(id),
            mode           game_mode NOT NULL,
            difficulty     difficulty NOT NULL,
            nb_questions   INTEGER NOT NULL CHECK (nb_questions > 0),
            max_players    INTEGER NOT NULL CHECK (max_players BETWEEN 2 AND 10),
            status         game_status NOT NULL DEFAULT 'waiting',
            created_at     TIMESTAMPTZ DEFAULT NOW(),
            started_at     TIMESTAMPTZ,
            finished_at    TIMESTAMPTZ
        )
    """))
    op.execute(sa.text("CREATE INDEX idx_games_status ON games(status)"))
    op.execute(sa.text("CREATE INDEX idx_games_mode_difficulty ON games(mode, difficulty)"))

    # ------------------------------------------------------------------
    # Table: game_players  (references games, players)
    # ------------------------------------------------------------------
    op.execute(sa.text("""
        CREATE TABLE game_players (
            game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
            player_id       UUID NOT NULL REFERENCES players(id),
            joined_at       TIMESTAMPTZ DEFAULT NOW(),
            final_score     INTEGER DEFAULT 0,
            final_rank      INTEGER,
            correct_answers INTEGER DEFAULT 0,
            PRIMARY KEY (game_id, player_id)
        )
    """))

    # ------------------------------------------------------------------
    # Table: game_questions  (references games, pokemon)
    # ------------------------------------------------------------------
    op.execute(sa.text("""
        CREATE TABLE game_questions (
            id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            game_id            UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
            question_index     INTEGER NOT NULL,
            correct_pokemon_id INTEGER NOT NULL REFERENCES pokemon(id),
            options            JSONB NOT NULL,
            UNIQUE (game_id, question_index)
        )
    """))

    # ------------------------------------------------------------------
    # Table: player_answers  (references game_questions, players, pokemon)
    # ------------------------------------------------------------------
    op.execute(sa.text("""
        CREATE TABLE player_answers (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            question_id         UUID NOT NULL REFERENCES game_questions(id) ON DELETE CASCADE,
            player_id           UUID NOT NULL REFERENCES players(id),
            selected_pokemon_id INTEGER REFERENCES pokemon(id),
            is_correct          BOOLEAN NOT NULL,
            response_time_ms    INTEGER,
            points_earned       INTEGER NOT NULL DEFAULT 0,
            answered_at         TIMESTAMPTZ DEFAULT NOW()
        )
    """))
    op.execute(sa.text("CREATE INDEX idx_player_answers_player ON player_answers(player_id)"))
    op.execute(sa.text("CREATE INDEX idx_player_answers_question ON player_answers(question_id)"))

    # ------------------------------------------------------------------
    # Table: player_stats  (references players)
    # ------------------------------------------------------------------
    op.execute(sa.text("""
        CREATE TABLE player_stats (
            player_id        UUID PRIMARY KEY REFERENCES players(id),
            games_played     INTEGER DEFAULT 0,
            games_won        INTEGER DEFAULT 0,
            total_correct    INTEGER DEFAULT 0,
            total_questions  INTEGER DEFAULT 0,
            best_streak      INTEGER DEFAULT 0,
            total_score      BIGINT DEFAULT 0,
            pokemon_mistakes JSONB DEFAULT '{}'::jsonb,
            pokemon_seen     JSONB DEFAULT '[]'::jsonb,
            pokemon_caught   JSONB DEFAULT '[]'::jsonb,
            updated_at       TIMESTAMPTZ DEFAULT NOW()
        )
    """))

    # ------------------------------------------------------------------
    # Table: pokemon_stats  (references pokemon)
    # ------------------------------------------------------------------
    op.execute(sa.text("""
        CREATE TABLE pokemon_stats (
            pokemon_id           INTEGER PRIMARY KEY REFERENCES pokemon(id),
            times_shown          INTEGER DEFAULT 0,
            times_correct        INTEGER DEFAULT 0,
            times_incorrect      INTEGER DEFAULT 0,
            avg_response_time_ms INTEGER,
            updated_at           TIMESTAMPTZ DEFAULT NOW()
        )
    """))

    # ------------------------------------------------------------------
    # Table: achievements
    # ------------------------------------------------------------------
    op.execute(sa.text("""
        CREATE TABLE achievements (
            code           VARCHAR(50) PRIMARY KEY,
            name_fr        VARCHAR(100) NOT NULL,
            description_fr TEXT NOT NULL,
            icon_emoji     VARCHAR(10),
            rarity         VARCHAR(20) DEFAULT 'common'
        )
    """))

    # ------------------------------------------------------------------
    # Table: player_achievements  (references players, achievements)
    # ------------------------------------------------------------------
    op.execute(sa.text("""
        CREATE TABLE player_achievements (
            player_id        UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
            achievement_code VARCHAR(50) NOT NULL REFERENCES achievements(code),
            unlocked_at      TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (player_id, achievement_code)
        )
    """))


# ---------------------------------------------------------------------------
# downgrade — drop everything in reverse dependency order
# ---------------------------------------------------------------------------

def downgrade() -> None:
    # Tables with FK dependencies first
    op.execute(sa.text("DROP TABLE IF EXISTS player_achievements"))
    op.execute(sa.text("DROP TABLE IF EXISTS achievements"))
    op.execute(sa.text("DROP TABLE IF EXISTS pokemon_stats"))
    op.execute(sa.text("DROP TABLE IF EXISTS player_stats"))
    op.execute(sa.text("DROP TABLE IF EXISTS player_answers"))
    op.execute(sa.text("DROP TABLE IF EXISTS game_questions"))
    op.execute(sa.text("DROP TABLE IF EXISTS game_players"))
    op.execute(sa.text("DROP TABLE IF EXISTS games"))
    op.execute(sa.text("DROP TABLE IF EXISTS players"))
    op.execute(sa.text("DROP TABLE IF EXISTS pokemon"))

    # ENUM types
    op.execute(sa.text("DROP TYPE IF EXISTS game_status"))
    op.execute(sa.text("DROP TYPE IF EXISTS difficulty"))
    op.execute(sa.text("DROP TYPE IF EXISTS game_mode"))
