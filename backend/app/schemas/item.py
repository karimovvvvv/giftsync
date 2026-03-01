from datetime import datetime
from decimal import Decimal
import uuid

from pydantic import BaseModel

from app.schemas.contribution import ContributionOut


# ── Запросы ─────────────────────────────────────────────────

class ItemCreate(BaseModel):
    url: str | None = None
    title: str
    description: str | None = None
    image_url: str | None = None
    price: Decimal | None = None
    currency: str = "RUB"
    is_crowdfunding: bool = False


class ItemUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    image_url: str | None = None
    price: Decimal | None = None
    currency: str | None = None
    is_crowdfunding: bool | None = None


class ItemPositionUpdate(BaseModel):
    position: int


# ── Ответы ──────────────────────────────────────────────────

class ItemOut(BaseModel):
    id: uuid.UUID
    wishlist_id: uuid.UUID
    url: str | None
    title: str
    description: str | None
    image_url: str | None
    price: Decimal | None
    currency: str
    is_crowdfunding: bool
    is_archived: bool
    is_locked: bool
    hero_buyer_name: str | None
    position: int
    funding_percent: float
    total_collected: Decimal
    created_at: datetime
    # Взносы — могут быть скрыты для владельца до event_date (см. wishlist_service)
    contributions: list[ContributionOut] = []

    model_config = {"from_attributes": True}