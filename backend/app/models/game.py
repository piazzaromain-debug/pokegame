import enum
import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class GameMode(str, enum.Enum):
    GUESS_NAME = "guess_name"
    GUESS_IMAGE = "guess_image"


class Difficulty(str, enum.Enum):
    EASY = "easy"
    NORMAL = "normal"
    HARD = "hard"


class GameStatus(str, enum.Enum):
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    FINISHED = "finished"


class Game(Base):
    __tablename__ = "games"

    id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    host_player_id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("players.id", ondelete="CASCADE"),
        nullable=False,
    )
    mode: Mapped[GameMode] = mapped_column(
        sa.Enum(GameMode, name="game_mode"),
        nullable=False,
        default=GameMode.GUESS_NAME,
    )
    difficulty: Mapped[Difficulty] = mapped_column(
        sa.Enum(Difficulty, name="difficulty"),
        nullable=False,
        default=Difficulty.NORMAL,
    )
    nb_questions: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=10)
    max_players: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=8)
    status: Mapped[GameStatus] = mapped_column(
        sa.Enum(GameStatus, name="game_status"),
        nullable=False,
        default=GameStatus.WAITING,
    )
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
    )
    started_at: Mapped[datetime | None] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=True,
    )
    finished_at: Mapped[datetime | None] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=True,
    )
