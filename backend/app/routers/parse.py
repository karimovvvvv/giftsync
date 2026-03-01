from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.parse import ParsedItemData, ParseRequest
from app.services.og_parser import parse_url

router = APIRouter(prefix="/parse", tags=["parse"])


@router.post("", response_model=ParsedItemData)
async def parse_item_url(
    body: ParseRequest,
    _: User = Depends(get_current_user),  # только авторизованные
):
    """
    Парсит OG-теги и microdata по переданному URL.
    Всегда возвращает 200; при ошибке success=False, error=<описание>.
    """
    return await parse_url(body.url)