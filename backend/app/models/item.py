import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Item(Base):
    __tablename__ = "items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    wishlist_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("wishlists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Данные из OG-парсинга или ручного ввода
    url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="RUB", nullable=False)

    # Краудфандинг
    is_crowdfunding: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Состояние
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    hero_buyer_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Drag-and-drop порядок
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    wishlist: Mapped["Wishlist"] = relationship("Wishlist", back_populates="items")  # noqa: F821
    contributions: Mapped[list["Contribution"]] = relationship(  # noqa: F821
        "Contribution",
        back_populates="item",
        cascade="all, delete-orphan",
        foreign_keys="Contribution.item_id",
    )

    @property
    def total_collected(self) -> Decimal:
        """Сумма активных взносов (не перенесённых)."""
        return sum(
            (c.amount for c in self.contributions if not c.is_transferred),
            Decimal("0"),
        )

    @property
    def funding_percent(self) -> float:
        if not self.price or self.price == 0:
            return 0.0
        return min(float(self.total_collected / self.price * 100), 100.0)