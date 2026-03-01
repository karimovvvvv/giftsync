from datetime import datetime
from decimal import Decimal
import uuid

from pydantic import BaseModel, field_validator


# ── Запросы ─────────────────────────────────────────────────

class ContributionCreate(BaseModel):
    contributor_name: str
    contributor_email: str | None = None
    amount: Decimal = Decimal("0")   # 0 = резерв "куплю сам"
    message: str | None = None
    guest_session_id: str | None = None

    @field_validator("contributor_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Укажите ваше имя")
        return v.strip()

    @field_validator("amount")
    @classmethod
    def amount_non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Сумма не может быть отрицательной")
        return v


class HeroBuyerCreate(BaseModel):
    contributor_name: str
    contributor_email: str | None = None
    message: str | None = None
    guest_session_id: str | None = None


# ── Ответы ──────────────────────────────────────────────────

class ContributionOut(BaseModel):
    id: uuid.UUID
    contributor_name: str
    amount: Decimal
    # message скрыт до event_date — заполняется в wishlist_service
    message: str | None
    created_at: datetime
    is_transferred: bool
    original_item_id: uuid.UUID | None

    model_config = {"from_attributes": True}