import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Achievement(Base):
    __tablename__ = "achievements"

    code: Mapped[str] = mapped_column(sa.String(100), primary_key=True)
    name_fr: Mapped[str] = mapped_column(sa.String(200), nullable=False)
    description_fr: Mapped[str] = mapped_column(sa.Text, nullable=False)
    icon_emoji: Mapped[str | None] = mapped_column(sa.String(10), nullable=True)
    rarity: Mapped[str | None] = mapped_column(sa.String(50), nullable=True)


class PlayerAchievement(Base):
    __tablename__ = "player_achievements"

    player_id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("players.id", ondelete="CASCADE"),
        primary_key=True,
    )
    achievement_code: Mapped[str] = mapped_column(
        sa.String(100),
        sa.ForeignKey("achievements.code", ondelete="CASCADE"),
        primary_key=True,
    )
    unlocked_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
    )
