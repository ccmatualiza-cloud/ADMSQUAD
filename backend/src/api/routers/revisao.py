"""Revisão — review of cancelled clients (tbl_linx status '9 - INATIVO') from the Operações menu.

Each row gets review tags in tbl_linx.detalhes:
- pmp / oci / db -> append the tag (no duplicates; replaces a previous "OK")
- ok             -> detalhes = "OK"
- clear          -> detalhes = NULL
"""
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user, get_db
from src.logger import logger

router = APIRouter(prefix="/api/revisao", tags=["revisao"])

INACTIVE_STATUS = "9 - INATIVO"
SEPARATOR = " - "
OK_TAG = "OK"

ReviewAction = Literal["pmp", "oci", "db", "ok", "clear"]


class RevisaoItem(BaseModel):
    cod: int
    razao: str | None = None
    cliente: str | None = None
    sistema: str | None = None
    qtdusers: int | None = None
    qtdusersts: int | None = None
    grupo: str | None = None
    detalhes: str | None = None


class RevisaoActionBody(BaseModel):
    action: ReviewAction


class RevisaoActionOut(BaseModel):
    cod: int
    detalhes: str | None = None


def apply_action(current: str | None, action: ReviewAction) -> str | None:
    """Return the new detalhes value for a review action."""
    if action == "clear":
        return None
    if action == "ok":
        return OK_TAG
    tags = [t.strip() for t in (current or "").split("-") if t.strip()]
    tags = [t for t in tags if t.upper() != OK_TAG]
    new_tag = action.upper()
    if new_tag not in (t.upper() for t in tags):
        tags.append(new_tag)
    return SEPARATOR.join(tags) or None


def _to_int(value) -> int | None:
    try:
        return int(value) if value is not None and str(value).strip() != "" else None
    except (TypeError, ValueError):
        return None


@router.get("/", response_model=list[RevisaoItem])
async def list_revisao(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    q: str = "",
) -> list[RevisaoItem]:
    where = "status = :status"
    params: dict = {"status": INACTIVE_STATUS}
    if q.strip():
        where += " AND (razao LIKE :q OR cliente LIKE :q OR sistema LIKE :q OR grupo LIKE :q)"
        params["q"] = f"%{q.strip()}%"
    try:
        result = await session.execute(
            text(
                "SELECT cod, razao, cliente, sistema, qtdusers, qtdusersts, grupo, detalhes "
                f"FROM tbl_linx WHERE {where} ORDER BY razao"
            ),
            params,
        )
        keys = list(result.keys())
        items = []
        for row in result.fetchall():
            d = dict(zip(keys, row))
            d["qtdusers"] = _to_int(d.get("qtdusers"))
            d["qtdusersts"] = _to_int(d.get("qtdusersts"))
            items.append(RevisaoItem(**d))
        return items
    except SQLAlchemyError:
        logger.exception("list_revisao_failed")
        raise HTTPException(status_code=500, detail="Failed to load cancelled clients")


@router.put("/{cod}/action", response_model=RevisaoActionOut)
async def apply_revisao_action(
    cod: int,
    body: RevisaoActionBody,
    current_user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> RevisaoActionOut:
    try:
        result = await session.execute(
            text("SELECT detalhes FROM tbl_linx WHERE cod = :cod AND status = :status"),
            {"cod": cod, "status": INACTIVE_STATUS},
        )
        row = result.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Cancelled client not found")
        new_value = apply_action(row[0], body.action)
        await session.execute(
            text("UPDATE tbl_linx SET detalhes = :detalhes WHERE cod = :cod"),
            {"detalhes": new_value, "cod": cod},
        )
        await session.commit()
    except SQLAlchemyError:
        await session.rollback()
        logger.exception("revisao_action_failed", cod=cod, action=body.action)
        raise HTTPException(status_code=500, detail="Failed to update review")
    logger.info("revisao_action_applied", cod=cod, action=body.action,
                user=current_user.get("sub"))
    return RevisaoActionOut(cod=cod, detalhes=new_value)
