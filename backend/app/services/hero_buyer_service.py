from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from app.models.contribution import Contribution
from app.models.item import Item
from app.models.wishlist import Wishlist
from app.services.cascade_service import cascade_transfer
from app.websocket.events import WSEventType
from app.websocket.manager import manager


async def activate_hero_buyer(
    db: AsyncSession,
    item: Item,
    wishlist: Wishlist,
    hero_name: str,
    hero_email: str | None,
    message: str | None,
    guest_session_id: str | None,
) -> Item:
    """
    Логика Hero Buyer:
    1. Создать взнос на полную сумму (amount=0 = "куплю сам")
    2. Заблокировать item
    3. Каскадно перенести предыдущие частичные взносы
    4. Разослать WS-событие
    """
    # Загружаем contributions если не загружены
    await db.refresh(item, ["contributions"])

    # Сохраняем существующие частичные взносы для каскада
    partial_contributions = [
        c for c in item.contributions
        if not c.is_transferred and c.amount > 0
    ]

    # Создаём Hero-взнос (amount=0 = полный резерв)
    hero_contrib = Contribution(
        item_id=item.id,
        contributor_name=hero_name,
        contributor_email=hero_email,
        amount=0,
        message=message,
        guest_session_id=guest_session_id,
        is_transferred=False,
    )
    db.add(hero_contrib)

    # Блокируем item
    item.is_locked = True
    item.hero_buyer_name = hero_name

    await db.flush()

    # Каскадный перенос частичных взносов
    if partial_contributions:
        await cascade_transfer(
            db=db,
            source_item=item,
            contributions_to_transfer=partial_contributions,
            wishlist=wishlist,
        )

    # WS: Hero Buyer активирован
    await manager.broadcast(
        wishlist.slug,
        {
            "type": WSEventType.HERO_BUYER_ACTIVATED,
            "payload": {
                "item_id": str(item.id),
                "item_title": item.title,
                "hero_name": hero_name,
                "had_contributions": len(partial_contributions) > 0,
            },
        },
    )

    # WS: Item заблокирован
    await manager.broadcast(
        wishlist.slug,
        {
            "type": WSEventType.ITEM_LOCKED,
            "payload": {"item_id": str(item.id)},
        },
    )

    return item