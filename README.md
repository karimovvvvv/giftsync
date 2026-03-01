# 🎁 GiftSync — Social Wishlist

> Эмоциональный сервис дарения с тайм-капсулой, Hero Buyer и сбором вскладчину в реальном времени.

---

## 🚀 Быстрый старт (локальная разработка)

### 1. Клонируем и настраиваем переменные окружения

```bash
git clone <repo-url> giftsync
cd giftsync
cp .env.example backend/.env
cp .env.example frontend/.env.local
# Отредактируйте значения под свою среду
```

### 2. Запускаем PostgreSQL через Docker

```bash
docker-compose up db -d
```

### 3. Бэкенд

```bash
cd backend

# Создаём виртуальное окружение
python -m venv .venv
source .venv/bin/activate      # Linux/Mac
# .venv\Scripts\activate       # Windows PowerShell

# Устанавливаем зависимости
pip install -r requirements.txt

# Применяем миграции
alembic upgrade head

# Запускаем сервер
uvicorn app.main:app --reload --port 8000
```

API будет доступен на [http://localhost:8000](http://localhost:8000)  
Swagger-документация: [http://localhost:8000/docs](http://localhost:8000/docs)

### 4. Фронтенд

```bash
cd frontend
npm install
npm run dev
```

Приложение: [http://localhost:3000](http://localhost:3000)

---

## 🐳 Запуск через Docker Compose (всё сразу)

```bash
docker-compose up --build
```

| Сервис   | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:3000      |
| Backend  | http://localhost:8000      |
| API Docs | http://localhost:8000/docs |
| DB       | localhost:5432             |

---

## 🗂️ Структура проекта

```
giftsync/
├── frontend/               # Next.js 14 (App Router)
│   ├── app/                # Страницы и лейаут
│   ├── components/         # UI-компоненты
│   │   ├── wishlist/       # Сетка, карточки, формы
│   │   ├── modals/         # Модальные окна
│   │   └── shared/         # Avatar, Navbar, SpoilerShield
│   ├── hooks/              # useWebSocket, useWishlist, useAuth...
│   ├── lib/                # Axios, QueryClient, утилиты
│   └── types/              # TypeScript типы
│
└── backend/                # FastAPI (Python)
    ├── app/
    │   ├── models/         # SQLAlchemy модели
    │   ├── schemas/        # Pydantic v2 схемы
    │   ├── routers/        # API эндпоинты
    │   ├── services/       # Бизнес-логика
    │   └── websocket/      # ConnectionManager, события
    └── alembic/            # Миграции БД
```

---

## ✨ Ключевые возможности

| Фича | Описание |
|------|----------|
| 🔗 **Умный ввод URL** | Вставь ссылку — название, фото и цена заполнятся автоматически (OG-теги + schema.org) |
| ⏰ **Тайм-капсула** | До даты события владелец не видит кто что купил. В момент X — WebSocket раскрывает всё |
| 🦸 **Hero Buyer** | Друг перехватывает подарок и покупает целиком. Взносы других каскадно переносятся |
| 💜 **Сбор вскладчину** | Прогресс-бар в реальном времени через WebSocket. Жёсткий лимит 100% |
| 🔄 **Каскадный перенос** | При блокировке сбора взносы автоматически переходят на другое желание или в «Фонд Сюрприз 🥂» |
| 📦 **Smart Archive** | Нельзя удалить желание с взносами — только архивировать с уведомлением |

---

## 🛠 Технологии

**Frontend:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion, TanStack Query, Axios, Sonner

**Backend:** FastAPI, Python 3.11, SQLAlchemy (async), Alembic, Pydantic v2, python-jose, passlib, httpx, BeautifulSoup4

**Infrastructure:** PostgreSQL 16, WebSockets, Docker Compose

---

## 📡 API Эндпоинты

### Auth
| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/auth/register` | Регистрация |
| POST | `/auth/login` | Вход, возвращает JWT |
| GET  | `/auth/me` | Профиль текущего пользователя |

### Wishlists
| Метод | URL | Описание |
|-------|-----|----------|
| GET  | `/wishlists` | Список своих вишлистов |
| POST | `/wishlists` | Создать вишлист |
| GET  | `/wishlists/{slug}` | Публичная страница |
| PUT  | `/wishlists/{id}` | Обновить |
| DELETE | `/wishlists/{id}` | Удалить |

### Items
| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/wishlists/{slug}/items` | Добавить желание |
| PUT  | `/items/{id}` | Редактировать |
| PATCH | `/items/{id}/position` | Обновить порядок |
| DELETE | `/items/{id}` | Smart Archive удаление |

### Contributions
| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/items/{id}/contribute` | Взнос гостя |
| POST | `/items/{id}/hero` | Hero Buyer |
| DELETE | `/contributions/{id}` | Отмена взноса |

### Other
| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/parse` | OG-парсинг URL |
| WS   | `/ws/{slug}` | WebSocket канал вишлиста |

---

## 🌐 WebSocket события

```json
{ "type": "contribution.added",   "payload": { "item_id": "...", "funding_percent": 45 } }
{ "type": "hero_buyer.activated",  "payload": { "item_id": "...", "hero_name": "Иван" } }
{ "type": "cascade.transferred",   "payload": { "from_item_id": "...", "to_item_id": "..." } }
{ "type": "item.locked",           "payload": { "item_id": "..." } }
{ "type": "capsule.revealed",      "payload": { "slug": "my-birthday-2025" } }
```

---

## 🚢 Deploy

**Frontend → Vercel**
```bash
cd frontend
npx vercel --prod
# Установить переменные:
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
# NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
```

**Backend → Railway / Render**
```bash
# Переменные окружения на платформе:
DATABASE_URL=postgresql+asyncpg://...
SECRET_KEY=your-production-secret-key
CORS_ORIGINS=["https://yourdomain.vercel.app"]
```