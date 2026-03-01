from decimal import Decimal
from pydantic import BaseModel


class ParseRequest(BaseModel):
    url: str


class ParsedItemData(BaseModel):
    title: str | None = None
    description: str | None = None
    image_url: str | None = None
    price: Decimal | None = None
    currency: str = "RUB"
    success: bool = True
    error: str | None = None