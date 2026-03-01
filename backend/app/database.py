from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

# --- МАГИЯ ДЛЯ FASTAPI ---
# Принудительно делаем ссылку асинхронной, даже если в настройках Railway указана обычная
db_url = str(settings.DATABASE_URL)

if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")
elif db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://")

if "sslmode=require" in db_url:
    db_url = db_url.replace("sslmode=require", "ssl=require")

# УБИРАЕМ channel_binding, КОТОРЫЙ ЛОМАЕТ ASYNCPG
if "channel_binding" in db_url:
    # Отрезаем этот параметр, независимо от того, через & или через ? он добавлен
    db_url = db_url.split("&channel_binding")[0]
    db_url = db_url.split("?channel_binding")[0]
# -------------------------

engine = create_async_engine(
    db_url,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise