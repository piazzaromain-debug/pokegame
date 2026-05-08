import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# ---------------------------------------------------------------------------
# Alembic Config object — gives access to the values within alembic.ini.
# ---------------------------------------------------------------------------
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ---------------------------------------------------------------------------
# Import the SQLAlchemy Base so that autogenerate can detect model changes.
# ---------------------------------------------------------------------------
from app.models import Base  # noqa: E402

target_metadata = Base.metadata

# ---------------------------------------------------------------------------
# Resolve the database URL from the environment variable DATABASE_URL.
# Alembic uses a synchronous driver for migrations, so we convert
# postgresql+asyncpg:// → postgresql:// when necessary.
# ---------------------------------------------------------------------------

def get_sync_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL environment variable is not set. "
            "Export it before running Alembic commands."
        )
    # Replace the async asyncpg driver with the sync psycopg2 driver.
    return url.replace("postgresql+asyncpg://", "postgresql://")


# ---------------------------------------------------------------------------
# Run migrations in 'offline' mode.
# ---------------------------------------------------------------------------

def run_migrations_offline() -> None:
    """Run migrations without an active DB connection (generates SQL script)."""
    url = get_sync_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


# ---------------------------------------------------------------------------
# Run migrations in 'online' mode.
# ---------------------------------------------------------------------------

def run_migrations_online() -> None:
    """Run migrations with an active DB connection."""
    # Override the sqlalchemy.url key programmatically so alembic.ini
    # does not need to contain a hard-coded connection string.
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = get_sync_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
