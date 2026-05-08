from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Pokemon(Base):
    __tablename__ = "pokemon"

    id: Mapped[int] = mapped_column(sa.Integer, primary_key=True, autoincrement=True)
    pokedex_number: Mapped[int] = mapped_column(sa.Integer, nullable=False, unique=True)
    name_fr: Mapped[str] = mapped_column(sa.String(100), nullable=False)
    sprite_url: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    sprite_shiny_url: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    cry_url: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    types: Mapped[list | None] = mapped_column(sa.ARRAY(sa.String), nullable=True)
    pokedex_description: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
    )
