from datetime import datetime
import uuid

from pydantic import BaseModel, field_validator

from app.schemas.item import ItemOut


# ── Запросы ─────────────────────────────────────────────────

class WishlistCreate(BaseModel):
    title: str
    description: str | None = None
    event_date: datetime | None = None
    is_public: bool = True

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Название не может быть пустым")
        return v.strip()


class WishlistUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    event_date: datetime | None = None
    is_public: bool | None = None


# ── Ответы ──────────────────────────────────────────────────

class WishlistOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    description: str | None
    slug: str
    event_date: datetime | None
    is_public: bool
    is_capsule_revealed: bool
    created_at: datetime
    items: list[ItemOut] = []

    model_config = {"from_attributes": True}


class WishlistShortOut(BaseModel):
    """Краткая карточка для дашборда владельца."""
    id: uuid.UUID
    title: str
    slug: str
    event_date: datetime | None
    is_public: bool
    is_capsule_revealed: bool
    created_at: datetime
    items_count: int = 0

    model_config = {"from_attributes": True}