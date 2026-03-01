from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, wishlists, items, contributions, parse, ws


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Создаём таблицы при старте (для разработки; в проде — alembic)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="GiftSync API",
    version="1.0.0",
    description="Social Wishlist — Backend API",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Роутеры
app.include_router(auth.router)
app.include_router(wishlists.router)
app.include_router(items.router)
app.include_router(contributions.router)
app.include_router(parse.router)
app.include_router(ws.router)


@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok", "service": "giftsync-api"}