import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.contribution import Contribution
from app.models.item import Item
from app.models.wishlist import Wishlist
from app.models.user import User
from app.schemas.item import ItemCreate, ItemOut, ItemPositionUpdate, ItemUpdate
from app.services.cascade_service import cascade_transfer
from app.websocket.events import WSEventType
from app.websocket.manager import manager

router = APIRouter(tags=["items"])


async def _get_item_for_owner(
    item_id: uuid.UUID, user: User, db: AsyncSession
) -> tuple[Item, Wishlist]:
    """Возвращает item и wishlist, проверяя что user — владелец."""
    result = await db.execute(
        select(Item)
        .where(Item.id == item_id)
        .options(
            selectinload(Item.wishlist),
            selectinload(Item.contributions),
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Желание не найдено")
    if item.wishlist.user_id != user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    return item, item.wishlist


@router.post("/wishlists/{slug}/items", response_model=ItemOut, status_code=201)
async def add_item(
    slug: str,
    body: ItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Wishlist).where(
            Wishlist.slug == slug, Wishlist.user_id == current_user.id
        )
    )
    wishlist = result.scalar_one_or_none()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Вишлист не найден")

    # Определяем следующую позицию
    pos_result = await db.execute(
        select(Item.position)
        .where(Item.wishlist_id == wishlist.id)
        .order_by(Item.position.desc())
        .limit(1)
    )
    next_pos = (pos_result.scalar_one_or_none() or 0) + 1

    item = Item(
        wishlist_id=wishlist.id,
        url=body.url,
        title=body.title,
        description=body.description,
        image_url=body.image_url,
        price=body.price,
        currency=body.currency,
        is_crowdfunding=body.is_crowdfunding,
        position=next_pos,
    )
    db.add(item)
    await db.flush()

    # === ПЕРЕЛИВ ИЗ ФОНДА СЮРПРИЗ ===
    if item.is_crowdfunding and item.price:
        # Ищем фонд Сюрприз
        fund = await db.execute(
            select(Item).where(
                Item.wishlist_id == wishlist.id,
                Item.title == "Фонд «Сюрприз после вечеринки» 🥂",
                Item.is_archived == False
            ).options(selectinload(Item.contributions))
        )
        fund_item = fund.scalar_one_or_none()
        
        if fund_item:
            # Берем активные деньги из фонда
            fund_contribs = [c for c in fund_item.contributions if not c.is_transferred]
            if fund_contribs:
                # Перекидываем их на новый подарок с помощью нашего каскада
                await cascade_transfer(db, fund_item, fund_contribs, wishlist)
    # ================================

    await db.refresh(item, ["contributions"])

    item_out = _item_to_out(item)

    await manager.broadcast(
        slug,
        {"type": WSEventType.ITEM_ADDED, "payload": item_out.model_dump(mode="json")},
    )
    return item_out


@router.put("/items/{item_id}", response_model=ItemOut)
async def update_item(
    item_id: uuid.UUID,
    body: ItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item, wishlist = await _get_item_for_owner(item_id, current_user, db)

    if body.title is not None:
        item.title = body.title
    if body.description is not None:
        item.description = body.description
    if body.image_url is not None:
        item.image_url = body.image_url
    if body.price is not None:
        item.price = body.price
    if body.currency is not None:
        item.currency = body.currency
    if body.is_crowdfunding is not None:
        item.is_crowdfunding = body.is_crowdfunding

    await db.flush()
    item_out = _item_to_out(item)
    await manager.broadcast(
        wishlist.slug,
        {"type": WSEventType.ITEM_UPDATED, "payload": item_out.model_dump(mode="json")},
    )
    return item_out


@router.patch("/items/{item_id}/position", response_model=ItemOut)
async def update_position(
    item_id: uuid.UUID,
    body: ItemPositionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item, _ = await _get_item_for_owner(item_id, current_user, db)
    item.position = body.position
    await db.flush()
    return _item_to_out(item)


@router.delete("/items/{item_id}")
async def delete_item(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Smart Archive:
    - 0% собрано → физическое удаление
    - >0% и <100% → архив + каскадный перенос
    - 100% → только архив (с предупреждением)
    """
    item, wishlist = await _get_item_for_owner(item_id, current_user, db)

    active_contribs = [c for c in item.contributions if not c.is_transferred]
    has_contributions = bool(active_contribs)
    is_full = item.funding_percent >= 100

    if not has_contributions:
        # Обычное удаление
        await db.delete(item)
        await manager.broadcast(
            wishlist.slug,
            {"type": WSEventType.ITEM_ARCHIVED, "payload": {"item_id": str(item_id)}},
        )
        return {"detail": "Удалено"}

    # Архивируем
    item.is_archived = True
    item.is_locked = True

    if not is_full:
        # Каскадный перенос частичных взносов
        await cascade_transfer(
            db=db,
            source_item=item,
            contributions_to_transfer=active_contribs,
            wishlist=wishlist,
        )
        detail = "Архивировано, взносы перенесены"
    else:
        detail = "Архивировано (100% собрано)"

    await db.flush()
    await manager.broadcast(
        wishlist.slug,
        {"type": WSEventType.ITEM_ARCHIVED, "payload": {"item_id": str(item_id)}},
    )
    return {"detail": detail, "archived": True, "is_full": is_full}


def _item_to_out(item: Item) -> ItemOut:
    return ItemOut(
        id=item.id,
        wishlist_id=item.wishlist_id,
        url=item.url,
        title=item.title,
        description=item.description,
        image_url=item.image_url,
        price=item.price,
        currency=item.currency,
        is_crowdfunding=item.is_crowdfunding,
        is_archived=item.is_archived,
        is_locked=item.is_locked,
        hero_buyer_name=item.hero_buyer_name,
        position=item.position,
        funding_percent=item.funding_percent,
        total_collected=item.total_collected,
        created_at=item.created_at,
        contributions=item.contributions if hasattr(item, 'contributions') else [],
    )