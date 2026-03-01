from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
from app.routers import auth, wishlists, items, contributions, parse, ws

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Создаём таблицы при старте (Alembic это тоже делает, но так надежнее для синхронизации)
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

# --- НАСТРОЙКА CORS (ИСПРАВЛЕНО) ---
# allow_origin_regex позволит работать любым ссылкам от Vercel (включая превью и основной домен)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://giftsync-gamma.vercel.app", # Ваша текущая ссылка
    ],
    allow_origin_regex=r"https://.*\.vercel\.app", # РАЗРЕШАЕТ ВСЕ ПОДДОМЕНЫ VERCEL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Роутеры
# Убедитесь, что префиксы /auth и т.д. прописаны либо здесь, либо внутри самих файлов роутеров
app.include_router(auth.router)
app.include_router(wishlists.router)
app.include_router(items.router)
app.include_router(contributions.router)
app.include_router(parse.router)
app.include_router(ws.router)

@app.get("/health", tags=["system"])
async def health():
    return {
        "status": "ok", 
        "service": "giftsync-api",
        "database": "connected"
    }

@app.get("/")
async def root():
    return {"message": "Welcome to GiftSync API. Visit /docs for documentation."}