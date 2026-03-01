from logging.config import fileConfig
from alembic import context
from sqlalchemy import engine_from_config, pool

from app.config import settings
from app.database import Base

# Импортируем все модели чтобы alembic их видел
from app.models import User, Wishlist, Item, Contribution  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# Для миграций используем синхронный psycopg2
# asyncpg имеет баги с Windows event loop при запуске через alembic
def _get_sync_url() -> str:
    url = settings.DATABASE_URL
    # Меняем драйвер на синхронный (psycopg2)
    url = url.replace("postgresql+asyncpg://", "postgresql://")
    # ОБЯЗАТЕЛЬНО: psycopg2 требует sslmode=require, а не ssl=require
    url = url.replace("ssl=require", "sslmode=require")
    return url

def run_migrations_offline() -> None:
    context.configure(
        url=_get_sync_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    cfg = config.get_section(config.config_ini_section, {})
    cfg["sqlalchemy.url"] = _get_sync_url()
    
    connectable = engine_from_config(
        cfg,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()