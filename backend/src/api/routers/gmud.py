"""GMUD (Gestão de Mudanças) — change requests registered from the Operações menu."""
from datetime import date
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user, get_db
from src.logger import logger

router = APIRouter(prefix="/api/gmud", tags=["gmud"])

GmudStatus = Literal["open", "paused", "cancelled", "completed"]
Priority = Literal["low", "medium", "high"]
ChangeType = Literal["local_infra", "cloud_infra", "database", "linx_dms", "connectivity", "other"]
Progression = Literal["sequential", "parallel", "partial"]

NUMBER_RETRIES = 3  # concurrent creations may collide on the UNIQUE(number) index

SHORT = 255
LONG = 5000


class GmudBase(BaseModel):
    client_cod: int | None = None
    project_name: str = Field(min_length=1, max_length=SHORT)
    project_ref: str | None = Field(default=None, max_length=50)
    requester: str | None = Field(default=None, max_length=150)
    cnpj: str | None = Field(default=None, max_length=20)
    linx_contacts: str | None = Field(default=None, max_length=SHORT)
    cr: str | None = Field(default=None, max_length=150)
    request_date: date
    priority: Priority = "medium"
    change_type: ChangeType
    main_activity: str = Field(min_length=1, max_length=LONG)
    reason: str | None = Field(default=None, max_length=LONG)
    expected_result: str | None = Field(default=None, max_length=LONG)
    estimated_time: str | None = Field(default=None, max_length=SHORT)
    additional_factors: str | None = Field(default=None, max_length=LONG)
    estimated_costs: str | None = Field(default=None, max_length=SHORT)
    release_notes: str | None = Field(default=None, max_length=LONG)
    update_process: str | None = Field(default=None, max_length=LONG)
    prerequisites: str | None = Field(default=None, max_length=LONG)
    impact_client_benefit: str | None = Field(default=None, max_length=500)
    impact_client_risk: str | None = Field(default=None, max_length=500)
    impact_ccm_benefit: str | None = Field(default=None, max_length=500)
    impact_ccm_risk: str | None = Field(default=None, max_length=500)
    impact_linx_benefit: str | None = Field(default=None, max_length=500)
    impact_linx_risk: str | None = Field(default=None, max_length=500)
    impact_other_benefit: str | None = Field(default=None, max_length=500)
    impact_other_risk: str | None = Field(default=None, max_length=500)
    notes: str | None = Field(default=None, max_length=LONG)
    progression: Progression = "sequential"
    progression_detail: str | None = Field(default=None, max_length=SHORT)
    validation_1: str | None = Field(default=None, max_length=SHORT)
    validation_2: str | None = Field(default=None, max_length=SHORT)
    rollback_plan: str | None = Field(default=None, max_length=LONG)
    approver_client: str | None = Field(default=None, max_length=150)
    approver_linx: str | None = Field(default=None, max_length=150)
    approver_ccm: str | None = Field(default=None, max_length=150)


class GmudCreate(GmudBase):
    status: GmudStatus = "open"


class GmudUpdate(GmudBase):
    status: GmudStatus


class GmudStatusUpdate(BaseModel):
    status: GmudStatus


class GmudOut(GmudBase):
    id: int
    number: int
    status: str
    created_by: int | None = None
    created_by_name: str | None = None
    created_at: str | None = None
    updated_at: str | None = None


class GmudListItem(BaseModel):
    id: int
    number: int
    project_name: str
    requester: str | None = None
    request_date: str
    priority: str
    change_type: str
    status: str
    created_at: str | None = None


class GmudClientOption(BaseModel):
    cod: int
    razao: str | None = None
    cliente: str | None = None
    cnpj: str | None = None


# Editable columns — the only names ever interpolated into SQL.
EDITABLE_FIELDS: tuple[str, ...] = tuple(GmudBase.model_fields.keys())

SELECT_GMUD = (
    "SELECT g.id, g.number, g.status, g.created_by, u.name AS created_by_name, "
    "g.created_at, g.updated_at, "
    + ", ".join(f"g.{f}" for f in EDITABLE_FIELDS)
    + " FROM tbl_gmud g LEFT JOIN users u ON u.id = g.created_by"
)


def _params(body: GmudBase) -> dict:
    data = body.model_dump(include=set(EDITABLE_FIELDS))
    for key, value in data.items():
        if isinstance(value, str):
            data[key] = value.strip() or None
    data["request_date"] = str(body.request_date)
    if data.get("project_name") is None or data.get("main_activity") is None:
        raise HTTPException(status_code=422, detail="project_name and main_activity are required")
    return data


def _row_to_out(row, keys) -> GmudOut:
    d = dict(zip(keys, row))
    for key in ("created_at", "updated_at"):
        d[key] = str(d[key]) if d.get(key) else None
    return GmudOut(**d)


def build_list_filters(status_filter: str, q: str) -> tuple[str, dict]:
    where, params = ["1=1"], {}
    if status_filter:
        where.append("status = :status")
        params["status"] = status_filter
    if q.strip():
        where.append(
            "(project_name LIKE :q OR requester LIKE :q OR main_activity LIKE :q "
            "OR CAST(number AS CHAR) LIKE :q)"
        )
        params["q"] = f"%{q.strip()}%"
    return " AND ".join(where), params


@router.get("/", response_model=list[GmudListItem])
async def list_gmuds(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    status_filter: GmudStatus | None = None,
    q: str = "",
) -> list[GmudListItem]:
    where, params = build_list_filters(status_filter or "", q)
    try:
        result = await session.execute(
            text(
                "SELECT id, number, project_name, requester, request_date, priority, "
                f"change_type, status, created_at FROM tbl_gmud WHERE {where} "
                "ORDER BY number DESC"
            ),
            params,
        )
        keys = list(result.keys())
        items = []
        for row in result.fetchall():
            d = dict(zip(keys, row))
            d["request_date"] = str(d["request_date"])
            d["created_at"] = str(d["created_at"]) if d.get("created_at") else None
            items.append(GmudListItem(**d))
        return items
    except SQLAlchemyError:
        logger.exception("list_gmuds_failed")
        raise HTTPException(status_code=500, detail="Failed to load GMUDs")


@router.get("/clients", response_model=list[GmudClientOption])
async def list_clients(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[GmudClientOption]:
    """Clients from tbl_linx to fill project name / CNPJ on the GMUD form."""
    try:
        result = await session.execute(
            text("SELECT cod, razao, cliente, cnpj FROM tbl_linx ORDER BY razao")
        )
        return [
            GmudClientOption(cod=r[0], razao=r[1], cliente=r[2], cnpj=r[3])
            for r in result.fetchall()
        ]
    except SQLAlchemyError:
        logger.exception("list_gmud_clients_failed")
        raise HTTPException(status_code=500, detail="Failed to load clients")


async def _fetch(session: AsyncSession, gmud_id: int) -> GmudOut:
    result = await session.execute(text(f"{SELECT_GMUD} WHERE g.id = :id"), {"id": gmud_id})
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="GMUD not found")
    return _row_to_out(row, list(result.keys()))


@router.get("/{gmud_id}", response_model=GmudOut)
async def get_gmud(
    gmud_id: int,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> GmudOut:
    try:
        return await _fetch(session, gmud_id)
    except SQLAlchemyError:
        logger.exception("get_gmud_failed", gmud_id=gmud_id)
        raise HTTPException(status_code=500, detail="Failed to load GMUD")


@router.post("/", response_model=GmudOut, status_code=status.HTTP_201_CREATED)
async def create_gmud(
    body: GmudCreate,
    current_user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> GmudOut:
    """Create a GMUD with the next sequential number (MAX(number) + 1)."""
    params = _params(body)
    params["status"] = body.status
    params["created_by"] = int(current_user["sub"])
    columns = ", ".join(EDITABLE_FIELDS)
    values = ", ".join(f":{f}" for f in EDITABLE_FIELDS)
    sql = text(
        f"INSERT INTO tbl_gmud (number, status, created_by, {columns}) "
        f"SELECT COALESCE(MAX(number), 0) + 1, :status, :created_by, {values} FROM tbl_gmud"
    )
    for attempt in range(1, NUMBER_RETRIES + 1):
        try:
            result = await session.execute(sql, params)
            await session.commit()
            new_id = result.lastrowid
            break
        except IntegrityError:
            await session.rollback()
            logger.warning("gmud_number_collision", attempt=attempt)
            if attempt == NUMBER_RETRIES:
                raise HTTPException(status_code=409, detail="Could not allocate GMUD number")
        except SQLAlchemyError:
            await session.rollback()
            logger.exception("create_gmud_failed")
            raise HTTPException(status_code=500, detail="Failed to create GMUD")
    created = await _fetch(session, new_id)
    logger.info("gmud_created", gmud_id=new_id, number=created.number, user=current_user.get("sub"))
    return created


@router.put("/{gmud_id}", response_model=GmudOut)
async def update_gmud(
    gmud_id: int,
    body: GmudUpdate,
    current_user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> GmudOut:
    params = _params(body)
    params["status"] = body.status
    params["id"] = gmud_id
    sets = ", ".join(f"{f} = :{f}" for f in (*EDITABLE_FIELDS, "status"))
    try:
        await session.execute(text(f"UPDATE tbl_gmud SET {sets} WHERE id = :id"), params)
        await session.commit()
    except SQLAlchemyError:
        await session.rollback()
        logger.exception("update_gmud_failed", gmud_id=gmud_id)
        raise HTTPException(status_code=500, detail="Failed to update GMUD")
    # rowcount is 0 in MySQL when nothing changed, so _fetch decides 404.
    updated = await _fetch(session, gmud_id)
    logger.info("gmud_updated", gmud_id=gmud_id, user=current_user.get("sub"))
    return updated


@router.put("/{gmud_id}/status", status_code=status.HTTP_204_NO_CONTENT)
async def update_gmud_status(
    gmud_id: int,
    body: GmudStatusUpdate,
    current_user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    try:
        exists = await session.execute(
            text("SELECT id FROM tbl_gmud WHERE id = :id"), {"id": gmud_id}
        )
        if not exists.fetchone():
            raise HTTPException(status_code=404, detail="GMUD not found")
        await session.execute(
            text("UPDATE tbl_gmud SET status = :status WHERE id = :id"),
            {"status": body.status, "id": gmud_id},
        )
        await session.commit()
    except SQLAlchemyError:
        await session.rollback()
        logger.exception("update_gmud_status_failed", gmud_id=gmud_id)
        raise HTTPException(status_code=500, detail="Failed to update GMUD status")
    logger.info("gmud_status_changed", gmud_id=gmud_id, status=body.status,
                user=current_user.get("sub"))
