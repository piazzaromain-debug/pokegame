import uuid

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
