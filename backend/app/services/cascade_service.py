from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.contribution import Contribution
from app.models.item import Item
from app.models.wishlist import Wishlist
from app.websocket.events import WSEventType
from app.websocket.manager import manager

SURPRISE_FUND_TITLE = "Фонд «Сюрприз после вечеринки» 🥂"

async def _get_or_create_surprise_fund(
    wishlist: Wishlist, db: AsyncSession, currency: str = "RUB"
) -> Item:
    """Находит или создаёт системную карточку 'Фонд Сюрприз'."""
    result = await db.execute(
        select(Item).where(
            Item.wishlist_id == wishlist.id,
            Item.title == SURPRISE_FUND_TITLE,
        )
    )
    fund = result.scalar_one_or_none()
    if fund:
        return fund

    # Определяем максимальную позицию
    pos_result = await db.execute(
        select(Item.position)
        .where(Item.wishlist_id == wishlist.id)
        .order_by(Item.position.desc())
        .limit(1)
    )
    max_pos = pos_result.scalar_one_or_none() or 0

    fund = Item(
        wishlist_id=wishlist.id,
        title=SURPRISE_FUND_TITLE,
        description="Сюда автоматически переносятся средства с отмененных или выкупленных подарков. Именинник потратит их на своё усмотрение! 🎁",
        is_crowdfunding=True,
        price=None, # У фонда нет цели
        currency=currency,
        is_locked=False,
        position=max_pos + 1,
    )
    db.add(fund)
    await db.flush()
    return fund


async def cascade_transfer(
    db: AsyncSession,
    source_item: Item,
    contributions_to_transfer: list[Contribution],
    wishlist: Wishlist,
) -> Item:
    """
    Новая логика:
    1. Если источник - обычный подарок, переносим деньги СТРОГО в Фонд.
    2. Если источник - Фонд (т.е. мы создали новый подарок), переносим деньги из Фонда в новую мечту.
    """
    if not contributions_to_transfer:
        return source_item

    target = None

    # Если мы пытаемся перенести деньги ИЗ фонда (при добавлении новой мечты)
    if source_item.title == SURPRISE_FUND_TITLE:
        # Ищем самую новую созданную мечту, куда можно перелить деньги
        result = await db.execute(
            select(Item)
            .where(
                Item.wishlist_id == wishlist.id,
                Item.id != source_item.id,
                Item.is_locked.is_(False),
                Item.is_archived.is_(False),
                Item.is_crowdfunding.is_(True),
            )
            .order_by(Item.created_at.desc()) # Берем самую свежую
            .limit(1)
            .options(selectinload(Item.contributions))
        )
        target = result.scalar_one_or_none()
        
    # Если целевая мечта не найдена, или мы удаляем обычный подарок — отправляем в Фонд
    if not target:
        target = await _get_or_create_surprise_fund(wishlist, db, source_item.currency)

    total_transferred = Decimal("0")
    contributor_names: list[str] = []

    for contrib in contributions_to_transfer:
        # Помечаем исходный взнос как перенесённый
        contrib.is_transferred = True

        # Создаём новый взнос на целевом item
        new_contrib = Contribution(
            item_id=target.id,
            contributor_name=contrib.contributor_name,
            contributor_email=contrib.contributor_email,
            amount=contrib.amount,
            message=contrib.message,
            guest_session_id=contrib.guest_session_id,
            original_item_id=source_item.id,
            is_transferred=False,
        )
        db.add(new_contrib)
        total_transferred += contrib.amount
        contributor_names.append(contrib.contributor_name)

    await db.flush()

    # Проверяем: не переполнился ли target после переноса (актуально при переливе ИЗ фонда в новую мечту)
    await db.refresh(target, ["contributions"])
    if target.price and target.funding_percent >= 100:
        target.is_locked = True

    # WebSocket: уведомление о переносе (оригинальный payload)
    await manager.broadcast(
        wishlist.slug,
        {
            "type": WSEventType.CASCADE_TRANSFERRED,
            "payload": {
                "from_item_id": str(source_item.id),
                "to_item_id": str(target.id),
                "to_item_title": target.title,
                "amount": str(total_transferred),
                "contributors": contributor_names,
            },
        },
    )

    return target