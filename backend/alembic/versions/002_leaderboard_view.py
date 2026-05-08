"""Add leaderboard materialized view.

Revision ID: 002
Revises: 001
Create Date: 2026-05-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(sa.text("""
        CREATE MATERIALIZED VIEW leaderboard AS
        SELECT
            g.mode,
            g.difficulty,
            p.id AS player_id,
            p.pseudo,
            p.avatar_pokemon_id,
            gp.final_score,
            g.finished_at,
            ROW_NUMBER() OVER (
                PARTITION BY g.mode, g.difficulty
                ORDER BY gp.final_score DESC
            ) AS rank
        FROM game_players gp
        JOIN games g ON g.id = gp.game_id
        JOIN players p ON p.id = gp.player_id
        WHERE g.status = 'finished'
        WITH NO DATA;

        CREATE UNIQUE INDEX idx_leaderboard_player_mode_diff
        ON leaderboard(player_id, mode, difficulty);

        CREATE INDEX idx_leaderboard_mode_diff_score
        ON leaderboard(mode, difficulty, final_score DESC);
    """))


def downgrade() -> None:
    op.execute(sa.text("DROP MATERIALIZED VIEW IF EXISTS leaderboard;"))
