import re
from decimal import Decimal, InvalidOperation

import httpx
from bs4 import BeautifulSoup

from app.schemas.parse import ParsedItemData

# Заголовки, имитирующие браузер (многие сайты блокируют ботов)
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# Символы валют → коды
CURRENCY_SYMBOLS: dict[str, str] = {
    "₽": "RUB", "руб": "RUB", "rub": "RUB",
    "$": "USD", "usd": "USD",
    "€": "EUR", "eur": "EUR",
    "£": "GBP", "gbp": "GBP",
}


def _extract_price(soup: BeautifulSoup) -> tuple[Decimal | None, str]:
    """Ищет цену в schema.org microdata, meta og:price:amount и в тексте страницы."""
    currency = "RUB"

    # 1. schema.org itemprop="price"
    price_el = soup.find(attrs={"itemprop": "price"})
    if price_el:
        raw = price_el.get("content") or price_el.get_text(strip=True)
        price = _parse_price_str(raw)
        if price:
            curr_el = soup.find(attrs={"itemprop": "priceCurrency"})
            if curr_el:
                currency = curr_el.get("content", currency).upper()
            return price, currency

    # 2. Open Graph price meta
    og_price = soup.find("meta", property="og:price:amount")
    og_curr = soup.find("meta", property="og:price:currency")
    if og_price and og_price.get("content"):
        price = _parse_price_str(og_price["content"])
        if price:
            if og_curr:
                currency = og_curr.get("content", currency).upper()
            return price, currency

    # 3. Попытка найти цену по паттерну в тексте страницы (эвристика)
    text = soup.get_text(" ", strip=True)
    match = re.search(r"(\d[\d\s.,]+)\s*(₽|руб\.?|USD|\$|EUR|€)", text, re.IGNORECASE)
    if match:
        price = _parse_price_str(match.group(1))
        sym = match.group(2).strip().lower()
        currency = CURRENCY_SYMBOLS.get(sym, currency)
        if price:
            return price, currency

    return None, currency


def _parse_price_str(raw: str) -> Decimal | None:
    """Приводит строку '1 299,99' или '12.99' к Decimal."""
    if not raw:
        return None
    cleaned = re.sub(r"[^\d.,]", "", raw)
    # Определяем десятичный разделитель
    if "," in cleaned and "." in cleaned:
        # Например: '1.299,99' (европейский формат)
        cleaned = cleaned.replace(".", "").replace(",", ".")
    elif "," in cleaned:
        cleaned = cleaned.replace(",", ".")
    try:
        value = Decimal(cleaned)
        return value if value > 0 else None
    except InvalidOperation:
        return None


async def parse_url(url: str) -> ParsedItemData:
    """
    Основная функция парсинга.
    Не бросает исключения — при любой ошибке возвращает success=False.
    """
    try:
        async with httpx.AsyncClient(
            headers=HEADERS,
            follow_redirects=True,
            timeout=12.0,
        ) as client:
            response = await client.get(url)
            response.raise_for_status()
    except httpx.HTTPError as e:
        return ParsedItemData(success=False, error=f"Ошибка загрузки страницы: {e}")

    soup = BeautifulSoup(response.text, "lxml")

    def og(prop: str) -> str | None:
        tag = soup.find("meta", property=f"og:{prop}")
        if tag and tag.get("content"):
            return tag["content"].strip() or None
        return None

    title = (
        og("title")
        or (soup.title.string.strip() if soup.title else None)
        or "Без названия"
    )
    description = og("description") or (
        soup.find("meta", attrs={"name": "description"}) or {}
    ).get("content")

    image_url = og("image")

    price, currency = _extract_price(soup)

    return ParsedItemData(
        title=title[:512] if title else None,
        description=description[:1000] if description else None,
        image_url=image_url,
        price=price,
        currency=currency,
        success=True,
    )