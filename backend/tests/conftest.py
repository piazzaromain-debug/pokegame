import pytest
import pytest_asyncio
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

# ---------------------------------------------------------------------------
# SQLite compatibility patches
#
# Two PostgreSQL-specific column types used in the models are not supported
# by SQLite:
#   - sa.ARRAY(sa.String)  → Pokemon.types
#   - JSONB                → GameQuestion.options
#
# We patch them to sa.JSON before the models are reflected into metadata.
# This must happen BEFORE importing any model that touches these columns.
# ---------------------------------------------------------------------------

# Patch 1 : replace ARRAY with JSON on Pokemon.types
from app.models.pokemon import Pokemon  # noqa: E402

if hasattr(Pokemon.types.property, "columns"):
    col = Pokemon.__table__.c["types"]
    col.type = sa.JSON()

# Patch 2 : replace JSONB with JSON on GameQuestion.options
from app.models.game_question import GameQuestion  # noqa: E402

if hasattr(GameQuestion.options.property, "columns"):
    col = GameQuestion.__table__.c["options"]
    col.type = sa.JSON()

# Patch 3 : replace JSONB with JSON on PlayerStats (pokemon_mistakes, pokemon_seen, pokemon_caught)
import app.models.player  # noqa: F401, E402
import app.models.game  # noqa: F401, E402
import app.models.game_player  # noqa: F401, E402
from app.models.stats import PlayerStats  # noqa: E402

for col_name in ("pokemon_mistakes", "pokemon_seen", "pokemon_caught"):
    if col_name in PlayerStats.__table__.c:
        PlayerStats.__table__.c[col_name].type = sa.JSON()

# Import remaining models so Base.metadata includes every table
import app.models.achievement  # noqa: F401, E402

from app.database import Base  # noqa: E402

# ---------------------------------------------------------------------------
# Test database — SQLite in-memory (no PostgreSQL required)
# ---------------------------------------------------------------------------
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def db_session() -> AsyncSession:
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        # Emit SQLite pragmas to disable FK enforcement so cross-table FKs
        # (games → players, game_questions → games, …) don't break table
        # creation ordering.
    )

    # Disable FK constraints for SQLite — models use PostgreSQL FKs that
    # reference tables we might not always populate in unit tests.
    from sqlalchemy import event as sa_event

    @sa_event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=OFF")
        cursor.close()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    async with AsyncSessionLocal() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()
