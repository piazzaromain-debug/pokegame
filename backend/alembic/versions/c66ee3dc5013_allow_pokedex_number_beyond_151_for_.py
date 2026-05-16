"""Allow pokedex_number beyond 151 for custom pokemon

Revision ID: c66ee3dc5013
Revises: 002
Create Date: 2026-05-16 15:39:20.754037

"""
from typing import Sequence, Union

from alembic import op

revision: str = "c66ee3dc5013"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("pokemon_pokedex_number_check", "pokemon", type_="check")
    op.create_check_constraint(
        "pokemon_pokedex_number_check",
        "pokemon",
        "pokedex_number >= 1",
    )


def downgrade() -> None:
    op.drop_constraint("pokemon_pokedex_number_check", "pokemon", type_="check")
    op.create_check_constraint(
        "pokemon_pokedex_number_check",
        "pokemon",
        "pokedex_number BETWEEN 1 AND 151",
    )
