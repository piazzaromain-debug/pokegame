import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class GameQuestion(Base):
    __tablename__ = "game_questions"

    id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    game_id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("games.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_index: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    correct_pokemon_id: Mapped[int] = mapped_column(
        sa.Integer,
        sa.ForeignKey("pokemon.id", ondelete="RESTRICT"),
        nullable=False,
    )
    options: Mapped[dict | None] = mapped_column(JSONB, nullable=True)


class PlayerAnswer(Base):
    __tablename__ = "player_answers"

    id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("game_questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    player_id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("players.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    selected_pokemon_id: Mapped[int | None] = mapped_column(sa.Integer, nullable=True)
    is_correct: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, default=False)
    response_time_ms: Mapped[int | None] = mapped_column(sa.Integer, nullable=True)
    points_earned: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=0)
    answered_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
    )
