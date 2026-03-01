import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, get_optional_user
from app.models.item import Item
from app.models.wishlist import Wishlist
from app.models.user import User
from app.schemas.wishlist import WishlistCreate, WishlistOut, WishlistShortOut, WishlistUpdate
from app.services.wishlist_service import (
    build_wishlist_response,
    generate_unique_slug,
    get_wishlist_with_items,
)
from app.websocket.events import WSEventType
from app.websocket.manager import manager

router = APIRouter(prefix="/wishlists", tags=["wishlists"])


@router.post("", response_model=WishlistOut, status_code=status.HTTP_201_CREATED)
async def create_wishlist(
    body: WishlistCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    slug = await generate_unique_slug(body.title, db)
    wishlist = Wishlist(
        user_id=current_user.id,
        title=body.title,
        description=body.description,
        slug=slug,
        event_date=body.event_date,
        is_public=body.is_public,
    )
    db.add(wishlist)
    await db.flush()
    await db.refresh(wishlist)

    return WishlistOut(
        id=wishlist.id,
        user_id=wishlist.user_id,
        title=wishlist.title,
        description=wishlist.description,
        slug=wishlist.slug,
        event_date=wishlist.event_date,
        is_public=wishlist.is_public,
        is_capsule_revealed=wishlist.is_capsule_revealed,
        created_at=wishlist.created_at,
        items=[],
    )


@router.get("", response_model=list[WishlistShortOut])
async def list_my_wishlists(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Список вишлистов текущего пользователя (для дашборда)."""
    result = await db.execute(
        select(Wishlist)
        .where(Wishlist.user_id == current_user.id)
        .order_by(Wishlist.created_at.desc())
        .options(selectinload(Wishlist.items))
    )
    wishlists = result.scalars().all()

    out = []
    for w in wishlists:
        visible_items = [i for i in w.items if not i.is_archived]
        out.append(
            WishlistShortOut(
                id=w.id,
                title=w.title,
                slug=w.slug,
                event_date=w.event_date,
                is_public=w.is_public,
                is_capsule_revealed=w.is_capsule_revealed,
                created_at=w.created_at,
                items_count=len(visible_items),
            )
        )
    return out


@router.get("/{slug}", response_model=WishlistOut)
async def get_wishlist(
    slug: str,
    current_user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Публичная страница вишлиста.
    Применяет Анти-Спойлер если запрашивает владелец.
    """
    wishlist = await get_wishlist_with_items(slug, db)
    if not wishlist:
        raise HTTPException(status_code=404, detail="Вишлист не найден")
    if not wishlist.is_public and (
        not current_user or current_user.id != wishlist.user_id
    ):
        raise HTTPException(status_code=403, detail="Вишлист приватный")

    is_owner = bool(current_user and current_user.id == wishlist.user_id)

    # Если тайм-капсула только что вскрылась — отправляем WS-событие
    if is_owner and wishlist.is_capsule_revealed and wishlist.event_date:
        await manager.broadcast(
            slug,
            {"type": WSEventType.CAPSULE_REVEALED, "payload": {"slug": slug}},
        )

    return build_wishlist_response(wishlist, is_owner)


@router.put("/{wishlist_id}", response_model=WishlistOut)
async def update_wishlist(
    wishlist_id: uuid.UUID,
    body: WishlistUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Wishlist)
        .where(Wishlist.id == wishlist_id, Wishlist.user_id == current_user.id)
        .options(selectinload(Wishlist.items).selectinload(Item.contributions))
    )
    wishlist = result.scalar_one_or_none()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Вишлист не найден")

    if body.title is not None:
        wishlist.title = body.title
    if body.description is not None:
        wishlist.description = body.description
    if body.event_date is not None:
        wishlist.event_date = body.event_date
    if body.is_public is not None:
        wishlist.is_public = body.is_public

    await db.flush()
    return build_wishlist_response(wishlist, is_owner=True)


@router.delete("/{wishlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_wishlist(
    wishlist_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Wishlist).where(
            Wishlist.id == wishlist_id, Wishlist.user_id == current_user.id
        )
    )
    wishlist = result.scalar_one_or_none()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Вишлист не найден")
    await db.delete(wishlist)