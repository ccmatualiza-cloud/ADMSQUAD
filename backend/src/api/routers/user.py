from datetime import datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, update, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user, get_db, require_admin
from src.infrastructure.db.models import UserModel
from src.infrastructure.security.crypto import hash_password

router = APIRouter(prefix="/api/user", tags=["user"])




class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    active: bool
    created_at: datetime | None = None
    last_login: datetime | None = None


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "operador_cx"


class UserUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    active: bool | None = None
    password: str | None = None


async def get_db_session(session: Annotated[AsyncSession, Depends(get_db)]) -> AsyncSession:
    return session


@router.get("/me", response_model=UserOut)
async def get_me(
    current_user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> UserOut:
    result = await session.execute(select(UserModel).where(UserModel.id == int(current_user["sub"])))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserOut(id=user.id, name=user.name, email=user.email, role=user.role,
                   active=user.active, created_at=user.created_at, last_login=user.last_login)


@router.get("/", response_model=list[UserOut])
async def list_users(
    current_user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[UserOut]:
    if current_user.get("role") not in ("admin", "gestor"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado")
    try:
        result = await session.execute(select(UserModel).order_by(UserModel.name))
        users = result.scalars().all()
        return [UserOut(id=u.id, name=u.name, email=u.email, role=str(u.role),
                        active=bool(u.active), created_at=u.created_at, last_login=u.last_login)
                for u in users]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(exc)}")


@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: UserCreate,
    _: Annotated[dict, Depends(require_admin)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> UserOut:
    model = UserModel(
        name=body.name,
        email=body.email.lower().strip(),
        password=hash_password(body.password),
        role=body.role,
    )
    session.add(model)
    try:
        await session.commit()
        await session.refresh(model)
    except Exception as exc:
        await session.rollback()
        if "Duplicate entry" in str(exc):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email já cadastrado")
        raise HTTPException(status_code=500, detail="Erro interno")
    return UserOut(id=model.id, name=model.name, email=model.email, role=model.role,
                   active=model.active, created_at=model.created_at, last_login=model.last_login)


@router.put("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: int,
    body: UserUpdate,
    _: Annotated[dict, Depends(require_admin)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> UserOut:
    result = await session.execute(select(UserModel).where(UserModel.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    if body.name is not None:
        user.name = body.name
    if body.role is not None:
        user.role = body.role
    if body.active is not None:
        user.active = body.active
    if body.password:
        user.password = hash_password(body.password)
    await session.commit()
    await session.refresh(user)
    return UserOut(id=user.id, name=user.name, email=user.email, role=user.role,
                   active=user.active, created_at=user.created_at, last_login=user.last_login)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_user(
    user_id: int,
    current_user: Annotated[dict, Depends(require_admin)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    if int(current_user["sub"]) == user_id:
        raise HTTPException(status_code=400, detail="Não é possível inativar o próprio usuário")
    await session.execute(
        update(UserModel).where(UserModel.id == user_id).values(active=False)
    )
    await session.commit()


@router.get("/check-role")
async def check_role(
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    return {"role": current_user.get("role"), "id": current_user.get("sub"), "email": current_user.get("email")}


class ChangePasswordBody(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password", status_code=200)
async def change_password(
    body: ChangePasswordBody,
    current_user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    from src.infrastructure.security.crypto import hash_password, verify_password
    result = await session.execute(select(UserModel).where(UserModel.id == int(current_user["sub"])))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if not verify_password(body.current_password, user.password):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")
    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="Nova senha deve ter ao menos 6 caracteres")
    user.password = hash_password(body.new_password)
    await session.commit()
    return {"ok": True}


@router.get("/by-role")
async def get_users_by_role(
    role: str = "",
    _: Annotated[dict, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db)] = None,
) -> list[dict]:
    try:
        params: dict = {}
        where = "WHERE active = 1"
        if role:
            where += " AND role = :role"
            params["role"] = role
        result = await session.execute(
            text(f"SELECT id, name FROM users {where} ORDER BY name"),
            params
        )
        rows = result.fetchall()
        return [{"id": r[0], "name": r[1]} for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/toggle-2fa/{user_id}")
async def toggle_2fa(
    user_id: int,
    current_user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    if current_user.get("role") not in ("admin", "gestor"):
        raise HTTPException(status_code=403, detail="Sem permissao")
    try:
        r = await session.execute(
            text("SELECT two_fa_enabled FROM users WHERE id = :id"),
            {"id": user_id}
        )
        row = r.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Usuario nao encontrado")
        new_val = 0 if row[0] else 1
        await session.execute(
            text("UPDATE users SET two_fa_enabled = :val WHERE id = :id"),
            {"val": new_val, "id": user_id}
        )
        await session.commit()
        return {"two_fa_enabled": bool(new_val)}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/list-with-2fa")
async def list_users_with_2fa(
    current_user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    if current_user.get("role") not in ("admin", "gestor"):
        raise HTTPException(status_code=403, detail="Sem permissao")
    try:
        result = await session.execute(
            text("SELECT id, name, email, role, active, two_fa_enabled, created_at, last_login FROM users ORDER BY name")
        )
        rows = result.fetchall()
        keys = ["id", "name", "email", "role", "active", "two_fa_enabled", "created_at", "last_login"]
        items = []
        for r in rows:
            d = dict(zip(keys, r))
            d["created_at"] = str(d["created_at"]) if d["created_at"] else None
            d["last_login"]  = str(d["last_login"])  if d["last_login"]  else None
            items.append(d)
        return items
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
