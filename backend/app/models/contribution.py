import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Contribution(Base):
    __tablename__ = "contributions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Данные гостя (без регистрации)
    contributor_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contributor_email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # amount == 0  → полный резерв "куплю сам"
    # amount > 0   → частичный донат
    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=Decimal("0"), nullable=False
    )

    # Поздравление — видно владельцу только после event_date
    message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # guest_session_id из localStorage — для отмены гостем
    guest_session_id: Mapped[str | None] = mapped_column(
        String(64), nullable=True, index=True
    )

    # Каскадный перенос: откуда пришёл взнос
    original_item_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("items.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Флаг: средства уже перенесены — не считать в исходном item
    is_transferred: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    item: Mapped["Item"] = relationship(  # noqa: F821
        "Item", back_populates="contributions", foreign_keys=[item_id]
    )
    original_item: Mapped["Item | None"] = relationship(  # noqa: F821
        "Item", foreign_keys=[original_item_id]
    )