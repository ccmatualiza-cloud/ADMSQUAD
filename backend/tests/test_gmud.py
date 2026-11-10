"""Tests for the GMUD (Gestão de Mudanças) router."""
from datetime import date, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError, OperationalError

from src.api.routers.gmud import (
    EDITABLE_FIELDS,
    GmudCreate,
    GmudStatusUpdate,
    GmudUpdate,
    build_list_filters,
    create_gmud,
    list_gmuds,
    update_gmud,
    update_gmud_status,
)

USER = {"sub": "5"}


def _payload(**extra) -> dict:
    return {
        "project_name": "Grupo Linhares - Linx Cloud",
        "request_date": "2026-06-09",
        "priority": "high",
        "change_type": "cloud_infra",
        "main_activity": "Desabilitar cifras de 64 bits (SWEET32).",
        **extra,
    }


def _select_result() -> MagicMock:
    keys = ["id", "number", "status", "created_by", "created_by_name", "created_at", "updated_at",
            *EDITABLE_FIELDS]
    values = {f: None for f in EDITABLE_FIELDS}
    values.update(project_name="Grupo Linhares - Linx Cloud", request_date=date(2026, 6, 9),
                  priority="high", change_type="cloud_infra", main_activity="x",
                  progression="sequential")
    row = (1, 8, "open", 5, "Luciano", datetime(2026, 6, 9, 10, 0), None,
           *[values[f] for f in EDITABLE_FIELDS])
    result = MagicMock()
    result.fetchone.return_value = row
    result.keys.return_value = keys
    return result


def _session(*side_effect) -> MagicMock:
    session = MagicMock()
    session.execute = AsyncMock(side_effect=list(side_effect))
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    return session


def test_create_rejects_invalid_status_and_type() -> None:
    with pytest.raises(ValidationError):
        GmudCreate(**_payload(status="done"))
    with pytest.raises(ValidationError):
        GmudCreate(**_payload(change_type="network"))


def test_create_requires_main_fields() -> None:
    with pytest.raises(ValidationError):
        GmudCreate(**_payload(project_name=""))


async def test_create_uses_next_sequential_number() -> None:
    session = _session(MagicMock(lastrowid=1), _select_result())

    out = await create_gmud(GmudCreate(**_payload(cnpj="  ")), USER, session)

    sql = str(session.execute.await_args_list[0].args[0])
    params = session.execute.await_args_list[0].args[1]
    assert "COALESCE(MAX(number), 0) + 1" in sql
    assert params["status"] == "open" and params["created_by"] == 5
    assert params["cnpj"] is None  # blank strings stored as NULL
    assert params["request_date"] == "2026-06-09"
    assert out.number == 8 and out.created_by_name == "Luciano"


async def test_create_retries_on_number_collision() -> None:
    collision = IntegrityError("INSERT", {}, Exception("dup"))
    session = _session(collision, MagicMock(lastrowid=1), _select_result())

    out = await create_gmud(GmudCreate(**_payload()), USER, session)

    assert out.id == 1
    session.rollback.assert_awaited_once()


async def test_create_db_error_returns_generic_500() -> None:
    session = _session(OperationalError("INSERT", {}, Exception("secret")))
    with pytest.raises(HTTPException) as exc:
        await create_gmud(GmudCreate(**_payload()), USER, session)
    assert exc.value.status_code == 500 and "secret" not in str(exc.value.detail)


async def test_update_sets_only_whitelisted_columns() -> None:
    session = _session(MagicMock(rowcount=1), _select_result())

    await update_gmud(3, GmudUpdate(**_payload(status="paused")), USER, session)

    sql = str(session.execute.await_args_list[0].args[0])
    params = session.execute.await_args_list[0].args[1]
    assert sql.startswith("UPDATE tbl_gmud SET") and "number" not in sql.split("WHERE")[0]
    assert params["status"] == "paused" and params["id"] == 3


async def test_update_missing_returns_404() -> None:
    missing = MagicMock()
    missing.fetchone.return_value = None
    session = _session(MagicMock(rowcount=0), missing)
    with pytest.raises(HTTPException) as exc:
        await update_gmud(99, GmudUpdate(**_payload(status="open")), USER, session)
    assert exc.value.status_code == 404


async def test_status_change() -> None:
    found = MagicMock()
    found.fetchone.return_value = (3,)
    session = _session(found, MagicMock())

    await update_gmud_status(3, GmudStatusUpdate(status="completed"), USER, session)

    assert session.execute.await_args_list[1].args[1] == {"status": "completed", "id": 3}
    session.commit.assert_awaited_once()


async def test_status_change_missing_returns_404() -> None:
    missing = MagicMock()
    missing.fetchone.return_value = None
    with pytest.raises(HTTPException) as exc:
        await update_gmud_status(3, GmudStatusUpdate(status="paused"), USER, _session(missing))
    assert exc.value.status_code == 404


def test_list_filters() -> None:
    where, params = build_list_filters("open", " 0008 ")
    assert "status = :status" in where and params == {"status": "open", "q": "%0008%"}
    assert build_list_filters("", "") == ("1=1", {})


async def test_list_orders_by_number_desc() -> None:
    result = MagicMock()
    result.keys.return_value = ["id", "number", "project_name", "requester", "request_date",
                                "priority", "change_type", "status", "created_at"]
    result.fetchall.return_value = [
        (1, 8, "Linhares", "SUSTENTAÇÃO CCM", date(2026, 6, 9), "high", "cloud_infra", "open", None)
    ]
    session = _session(result)

    items = await list_gmuds(USER, session, status_filter=None, q="")

    assert "ORDER BY number DESC" in str(session.execute.await_args.args[0])
    assert items[0].request_date == "2026-06-09"
