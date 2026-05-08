from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency FastAPI : fournit une session DB async par requête."""
    async with AsyncSessionLocal() as session:
        yield session
