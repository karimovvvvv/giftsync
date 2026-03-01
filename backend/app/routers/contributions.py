import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.contribution import Contribution
from app.models.item import Item
from app.models.wishlist import Wishlist
from app.schemas.contribution import ContributionCreate, ContributionOut, HeroBuyerCreate
from app.services.cascade_service import cascade_transfer
from app.services.hero_buyer_service import activate_hero_buyer
from app.websocket.events import WSEventType
from app.websocket.manager import manager

router = APIRouter(tags=["contributions"])


async def _get_item_with_wishlist(item_id: uuid.UUID, db: AsyncSession) -> tuple[Item, Wishlist]:
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
    if item.is_archived:
        raise HTTPException(status_code=410, detail="Желание удалено")
    if item.is_locked:
        raise HTTPException(status_code=409, detail="Сбор на это желание уже закрыт")
    return item, item.wishlist


@router.post("/items/{item_id}/contribute", response_model=ContributionOut, status_code=201)
async def contribute(
    item_id: uuid.UUID,
    body: ContributionCreate,
    db: AsyncSession = Depends(get_db),
):
    """Взнос гостя: частичный донат или полный резерв (amount=0)."""
    item, wishlist = await _get_item_with_wishlist(item_id, db)

    # Жёсткий лимит: если уже 100% — блокируем
    if item.is_crowdfunding and item.price:
        remaining = item.price - item.total_collected
        if remaining <= 0:
            item.is_locked = True
            await db.flush()
            raise HTTPException(status_code=409, detail="Сбор уже завершён на 100%")

        # Обрезаем сумму если превышает остаток
        if body.amount > 0 and body.amount > remaining:
            body = body.model_copy(update={"amount": remaining})

    contrib = Contribution(
        item_id=item.id,
        contributor_name=body.contributor_name,
        contributor_email=body.contributor_email,
        amount=body.amount,
        message=body.message,
        guest_session_id=body.guest_session_id,
    )
    db.add(contrib)
    await db.flush()
    await db.refresh(item, ["contributions"])

    # Блокируем товар, если это полный резерв (amount = 0) ИЛИ краудфандинг собрал 100%
    if body.amount == 0 or (item.is_crowdfunding and item.price and item.funding_percent >= 100):
        item.is_locked = True
        await manager.broadcast(
            wishlist.slug,
            {"type": WSEventType.ITEM_LOCKED, "payload": {"item_id": str(item.id)}},
        )

    contrib_out = ContributionOut.model_validate(contrib)

    # WS: уведомление о новом взносе
    await manager.broadcast(
        wishlist.slug,
        {
            "type": WSEventType.CONTRIBUTION_ADDED,
            "payload": {
                "item_id": str(item.id),
                "funding_percent": item.funding_percent,
                "total_collected": str(item.total_collected),
                "contribution": contrib_out.model_dump(mode="json"),
            },
        },
    )

    return contrib_out


@router.post("/items/{item_id}/hero", response_model=ContributionOut, status_code=201)
async def hero_buyer(
    item_id: uuid.UUID,
    body: HeroBuyerCreate,
    db: AsyncSession = Depends(get_db),
):
    """Hero Buyer: перехватить товар — купить целиком."""
    item, wishlist = await _get_item_with_wishlist(item_id, db)

    await activate_hero_buyer(
        db=db,
        item=item,
        wishlist=wishlist,
        hero_name=body.contributor_name,
        hero_email=body.contributor_email,
        message=body.message,
        guest_session_id=body.guest_session_id,
    )

    # Найти созданный Hero-взнос для ответа
    await db.refresh(item, ["contributions"])
    hero_contrib = next(
        (c for c in item.contributions if c.contributor_name == body.contributor_name and c.amount == 0),
        item.contributions[-1],
    )
    return ContributionOut.model_validate(hero_contrib)


@router.delete("/contributions/{contribution_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_contribution(
    contribution_id: uuid.UUID,
    guest_session_id: str,  # Query param для верификации
    db: AsyncSession = Depends(get_db),
):
    """Гость отменяет свой резерв/взнос (по guest_session_id из localStorage)."""
    result = await db.execute(
        select(Contribution)
        .where(Contribution.id == contribution_id)
        .options(selectinload(Contribution.item).selectinload(Item.wishlist))
    )
    contrib = result.scalar_one_or_none()

    if not contrib:
        raise HTTPException(status_code=404, detail="Взнос не найден")
    if contrib.guest_session_id != guest_session_id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    if contrib.is_transferred:
        raise HTTPException(status_code=409, detail="Взнос уже перенесён, отмена невозможна")

    item = contrib.item
    wishlist = item.wishlist

    await db.delete(contrib)
    await db.flush()

    # Разблокируем item если он был заблокирован из-за 100%
    if item.is_locked and not item.hero_buyer_name:
        await db.refresh(item, ["contributions"])
        if item.funding_percent < 100:
            item.is_locked = False

    await manager.broadcast(
        wishlist.slug,
        {
            "type": WSEventType.CONTRIBUTION_REMOVED,
            "payload": {
                "item_id": str(item.id),
                "contribution_id": str(contribution_id),
                "funding_percent": item.funding_percent,
            },
        },
    )