import re
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.item import Item
from app.models.wishlist import Wishlist
from app.schemas.contribution import ContributionOut
from app.schemas.item import ItemOut
from app.schemas.wishlist import WishlistOut


def _slugify(text: str) -> str:
    """Транслитерация + очистка строки → URL-безопасный slug."""
    translit = {
        "а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"zh",
        "з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o",
        "п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"kh","ц":"ts",
        "ч":"ch","ш":"sh","щ":"sch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu",
        "я":"ya",
    }
    text = text.lower()
    result = "".join(translit.get(c, c) for c in text)
    result = re.sub(r"[^a-z0-9]+", "-", result)
    result = result.strip("-")
    return result[:50] or "wishlist"


async def generate_unique_slug(title: str, db: AsyncSession) -> str:
    """Создаёт уникальный slug, добавляя суффикс при коллизии."""
    base = _slugify(title)
    slug = base
    attempt = 0
    while True:
        exists = await db.execute(select(Wishlist).where(Wishlist.slug == slug))
        if not exists.scalar_one_or_none():
            return slug
        attempt += 1
        slug = f"{base}-{uuid.uuid4().hex[:6]}"
        if attempt > 10:
            # крайний случай — полностью уникальный
            return f"{base}-{uuid.uuid4().hex}"


async def get_wishlist_with_items(slug: str, db: AsyncSession) -> Wishlist | None:
    """Загружает вишлист со всеми связями одним запросом."""
    result = await db.execute(
        select(Wishlist)
        .where(Wishlist.slug == slug)
        .options(
            selectinload(Wishlist.items).selectinload(Item.contributions)
        )
    )
    return result.scalar_one_or_none()


def build_wishlist_response(wishlist: Wishlist, is_owner: bool) -> WishlistOut:
    """
    Собирает WishlistOut с учётом Анти-Спойлера:
    - Если запрашивает владелец И тайм-капсула ещё не вскрыта →
      скрыть имена/суммы взносов и поздравления.
    """
    revealed = wishlist.is_capsule_revealed
    hide_details = is_owner and not revealed

    items_out: list[ItemOut] = []
    for item in wishlist.items:
        # Прячем архив от гостей, но оставляем для владельца
        if item.is_archived and not is_owner:
            continue

        contributions_out: list[ContributionOut] = []
        for c in item.contributions:
            if c.is_transferred:
                continue
            if hide_details:
                # Владелец до события: показываем только факт взноса, без имени и суммы
                contributions_out.append(
                    ContributionOut(
                        id=c.id,
                        contributor_name="🎁 Сюрприз",
                        amount=0,          # сумма скрыта
                        message=None,      # поздравление скрыто
                        created_at=c.created_at,
                        is_transferred=c.is_transferred,
                        original_item_id=c.original_item_id,
                    )
                )
            else:
                contributions_out.append(ContributionOut.model_validate(c))

        items_out.append(
            ItemOut(
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
                # hero_buyer_name — скрываем от владельца до события
                hero_buyer_name=item.hero_buyer_name if not hide_details else None,
                position=item.position,
                funding_percent=item.funding_percent,
                total_collected=item.total_collected,
                created_at=item.created_at,
                contributions=contributions_out,
            )
        )

    return WishlistOut(
        id=wishlist.id,
        user_id=wishlist.user_id,
        title=wishlist.title,
        description=wishlist.description,
        slug=wishlist.slug,
        event_date=wishlist.event_date,
        is_public=wishlist.is_public,
        is_capsule_revealed=revealed,
        created_at=wishlist.created_at,
        items=items_out,
    )