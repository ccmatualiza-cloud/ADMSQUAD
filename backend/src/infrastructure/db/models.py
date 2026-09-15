from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from src.infrastructure.db.database import Base


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[int]           = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str]         = mapped_column(String(120), nullable=False)
    email: Mapped[str]        = mapped_column(String(191), nullable=False, unique=True, index=True)
    password: Mapped[str]     = mapped_column(String(255), nullable=False)
    role: Mapped[str]         = mapped_column(String(30), nullable=False, default="operador_cx")
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    active: Mapped[bool]      = mapped_column(Boolean, nullable=False, default=True)
    two_fa_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    two_fa_code: Mapped[str | None] = mapped_column(String(6), nullable=True)
    two_fa_expires: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    last_login: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
