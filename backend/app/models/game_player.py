import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class GamePlayer(Base):
    __tablename__ = "game_players"

    game_id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("games.id", ondelete="CASCADE"),
        primary_key=True,
    )
    player_id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("players.id", ondelete="CASCADE"),
        primary_key=True,
    )
    joined_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
    )
    final_score: Mapped[int | None] = mapped_column(sa.Integer, nullable=True)
    final_rank: Mapped[int | None] = mapped_column(sa.Integer, nullable=True)
    correct_answers: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=0)
