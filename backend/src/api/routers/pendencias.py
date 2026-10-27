import re
from datetime import date
from typing import Annotated, Literal
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user, get_db
from src.logger import logger

router = APIRouter(prefix="/api/pendencias", tags=["pendencias"])

SELECT_PENDENCIAS = (
    "SELECT id, cliente, ticket, descritivo, tratativa, analista, status, data, data_limite, "
    "DATEDIFF(CURDATE(), data) as dias, created_at FROM tbl_pendencias"
)

StatusType = Literal["aberto", "em_andamento", "impedimento", "resolvido"]


class PendenciaOut(BaseModel):
    id: int
    cliente: str
    ticket: str
    descritivo: str
    tratativa: str | None = None
    analista: str
    status: str
    data: str
    data_limite: str | None = None
    dias: int | None
    created_at: str | None = None


class PendenciaCreate(BaseModel):
    cliente: str
    ticket: str
    descritivo: str
    tratativa: str = ""
    analista: str
    status: StatusType = "aberto"
    data: date
    data_limite: date | None = None


class PendenciaUpdate(BaseModel):
    cliente: str | None = None
    ticket: str | None = None
    descritivo: str | None = None
    tratativa: str | None = None
    analista: str | None = None
    status: StatusType | None = None
    data: date | None = None
    data_limite: date | None = None


class IndicadorOut(BaseModel):
    descricao: str
    meta: str
    realizado: str
    achieved: bool | None = None  # None when meta/realizado cannot be parsed as numbers


INDICADORES_LIMIT = 8  # 2 rows x 4 cards on the Daily screen

_TIME_RE = re.compile(r"^(-?\d+):(\d{1,2})(?::(\d{1,2}))?$")
_NUMBER_CHARS_RE = re.compile(r"[^\d,.\-]")


def parse_indicator_value(raw: str | None) -> float | None:
    """Convert a VARCHAR indicator ('95%', '1.234,5', 'R$ 10,00', '08:30', '4h') to float."""
    if raw is None:
        return None
    value = str(raw).strip()
    if not value:
        return None
    time_match = _TIME_RE.match(value.replace(" ", ""))
    if time_match:
        hours, minutes, seconds = time_match.groups()
        sign = -1 if hours.startswith("-") else 1
        return sign * (abs(int(hours)) + int(minutes) / 60 + int(seconds or 0) / 3600)
    cleaned = _NUMBER_CHARS_RE.sub("", value)
    if not cleaned or not re.search(r"\d", cleaned):
        return None
    if "," in cleaned and "." in cleaned:
        if cleaned.rfind(",") > cleaned.rfind("."):  # pt-BR: 1.234,56
            cleaned = cleaned.replace(".", "").replace(",", ".")
        else:  # en-US: 1,234.56
            cleaned = cleaned.replace(",", "")
    elif "," in cleaned:
        cleaned = cleaned.replace(",", ".") if cleaned.count(",") == 1 else cleaned.replace(",", "")
    elif cleaned.count(".") > 1:  # 1.234.567
        cleaned = cleaned.replace(".", "")
    try:
        return float(cleaned)
    except ValueError:
        return None


def build_indicador(descricao: str | None, meta: str | None, realizado: str | None) -> IndicadorOut:
    meta_num = parse_indicator_value(meta)
    realizado_num = parse_indicator_value(realizado)
    achieved = None if meta_num is None or realizado_num is None else realizado_num >= meta_num
    return IndicadorOut(
        descricao=str(descricao or ""), meta=str(meta or ""),
        realizado=str(realizado or ""), achieved=achieved,
    )


def row_to_out(row, keys) -> PendenciaOut:
    d = dict(zip(keys, row))
    return PendenciaOut(
        id=d["id"], cliente=d["cliente"], ticket=d["ticket"],
        descritivo=d["descritivo"], tratativa=d.get("tratativa"), analista=d.get("analista", ""),
        status=d["status"], data=str(d["data"]),
        data_limite=str(d["data_limite"]) if d.get("data_limite") else None,
        dias=d.get("dias"), created_at=str(d["created_at"]) if d.get("created_at") else None,
    )


@router.get("/", response_model=list[PendenciaOut])
async def list_pendencias(
    include_resolvido: bool = False,
    _: Annotated[dict, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db)] = None,
) -> list[PendenciaOut]:
    try:
        where = "" if include_resolvido else "WHERE status != 'resolvido'"
        result = await session.execute(
            text(f"{SELECT_PENDENCIAS} {where} ORDER BY data ASC, id ASC")
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [row_to_out(r, keys) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erro: {str(exc)}")


@router.get("/indicadores", response_model=list[IndicadorOut])
async def list_indicadores(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[IndicadorOut]:
    """Performance indicators (tbl_metas) shown as cards at the top of the Daily screen."""
    try:
        result = await session.execute(
            text("SELECT descricao, meta, realizado FROM tbl_metas LIMIT :limit"),
            {"limit": INDICADORES_LIMIT},
        )
        return [build_indicador(r[0], r[1], r[2]) for r in result.fetchall()]
    except Exception as exc:
        logger.error("list_indicadores_failed", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to load indicators")


@router.get("/clientes-autocomplete")
async def clientes_autocomplete(
    q: str = "",
    _: Annotated[dict, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db)] = None,
) -> list[str]:
    """Busca clientes na tbl_linx para autocomplete"""
    try:
        result = await session.execute(
            text("SELECT DISTINCT cliente FROM tbl_linx WHERE cliente LIKE :q AND status IN ('6 - ATIVO', '7 - ATIVO VPU', '0 - IMPLANTAÇÃO') ORDER BY cliente LIMIT 20"),
            {"q": f"%{q}%"}
        )
        rows = result.fetchall()
        return [r[0] for r in rows if r[0]]
    except Exception:
        return []


@router.get("/analistas")
async def list_analistas(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    """Lista usuários do sistema para o campo analista"""
    try:
        result = await session.execute(
            text("SELECT id, name FROM users WHERE active = 1 ORDER BY name")
        )
        rows = result.fetchall()
        return [{"id": r[0], "name": r[1]} for r in rows]
    except Exception:
        return []


@router.post("/", response_model=PendenciaOut, status_code=status.HTTP_201_CREATED)
async def create_pendencia(
    body: PendenciaCreate,
    current_user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PendenciaOut:
    try:
        result = await session.execute(
            text("INSERT INTO tbl_pendencias (cliente, ticket, descritivo, tratativa, analista, status, data, data_limite, created_by) VALUES (:cliente, :ticket, :descritivo, :tratativa, :analista, :status, :data, :data_limite, :created_by)"),
            {"cliente": body.cliente, "ticket": body.ticket, "descritivo": body.descritivo, "tratativa": body.tratativa,
             "analista": body.analista, "status": body.status, "data": str(body.data),
             "data_limite": str(body.data_limite) if body.data_limite else None,
             "created_by": int(current_user["sub"])}
        )
        await session.commit()
        new_id = result.lastrowid
        result2 = await session.execute(
            text(f"{SELECT_PENDENCIAS} WHERE id = :id"),
            {"id": new_id}
        )
        row = result2.fetchone()
        return row_to_out(row, list(result2.keys()))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erro: {str(exc)}")


@router.put("/{pendencia_id}", response_model=PendenciaOut)
async def update_pendencia(
    pendencia_id: int,
    body: PendenciaUpdate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PendenciaOut:
    sets, params = [], {"id": pendencia_id}
    if body.cliente    is not None: sets.append("cliente=:cliente");       params["cliente"]    = body.cliente
    if body.ticket     is not None: sets.append("ticket=:ticket");         params["ticket"]     = body.ticket
    if body.descritivo is not None: sets.append("descritivo=:descritivo"); params["descritivo"] = body.descritivo
    if body.tratativa   is not None: sets.append("tratativa=:tratativa");   params["tratativa"]   = body.tratativa
    if body.analista   is not None: sets.append("analista=:analista");     params["analista"]   = body.analista
    if body.status     is not None: sets.append("status=:status");         params["status"]     = body.status
    if body.data       is not None: sets.append("data=:data");             params["data"]       = str(body.data)
    if "data_limite" in body.model_fields_set:  # sent as null clears the deadline
        sets.append("data_limite=:data_limite")
        params["data_limite"] = str(body.data_limite) if body.data_limite else None
    if not sets:
        raise HTTPException(status_code=400, detail="Nada para atualizar")
    await session.execute(text(f"UPDATE tbl_pendencias SET {', '.join(sets)} WHERE id = :id"), params)
    await session.commit()
    result = await session.execute(
        text(f"{SELECT_PENDENCIAS} WHERE id = :id"),
        {"id": pendencia_id}
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Pendência não encontrada")
    return row_to_out(row, list(result.keys()))


@router.delete("/{pendencia_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pendencia(
    pendencia_id: int,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await session.execute(text("DELETE FROM tbl_pendencias WHERE id = :id"), {"id": pendencia_id})
    await session.commit()
