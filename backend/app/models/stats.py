import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PlayerStats(Base):
    __tablename__ = "player_stats"

    player_id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("players.id", ondelete="CASCADE"),
        primary_key=True,
    )
    games_played: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=0)
    games_won: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=0)
    total_correct: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=0)
    total_questions: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=0)
    best_streak: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=0)
    total_score: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=0)
    pokemon_mistakes: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    pokemon_seen: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    pokemon_caught: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )


class PokemonStats(Base):
    __tablename__ = "pokemon_stats"

    pokemon_id: Mapped[int] = mapped_column(
        sa.Integer,
        sa.ForeignKey("pokemon.id", ondelete="CASCADE"),
        primary_key=True,
    )
    times_shown: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=0)
    times_correct: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=0)
    times_incorrect: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )
