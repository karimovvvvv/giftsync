from datetime import datetime
import uuid

from pydantic import BaseModel, EmailStr, field_validator


# ── Запросы ─────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Пароль должен содержать минимум 8 символов")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ── Ответы ──────────────────────────────────────────────────

class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    avatar_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenData(BaseModel):
    user_id: str