"""Tests for the optional data_limite (deadline) field on Daily pendencias."""
from datetime import date
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.api.routers.pendencias import (
    PendenciaCreate,
    PendenciaUpdate,
    create_pendencia,
    update_pendencia,
)

KEYS = ["id", "cliente", "ticket", "descritivo", "tratativa", "analista",
        "status", "data", "data_limite", "dias", "created_at"]


def _row(data_limite: date | None) -> tuple:
    return (1, "CCM-DB03", "#152000", "Falha no job", None, "Delianne",
            "impedimento", date(2026, 7, 8), data_limite, 3, None)


def _session(data_limite: date | None) -> MagicMock:
    select_result = MagicMock()
    select_result.fetchone.return_value = _row(data_limite)
    select_result.keys.return_value = KEYS
    session = MagicMock()
    session.execute = AsyncMock(side_effect=[MagicMock(lastrowid=1), select_result])
    session.commit = AsyncMock()
    return session


def _base_payload(**extra: object) -> dict:
    return {"cliente": "CCM-DB03", "ticket": "#152000", "descritivo": "Falha no job",
            "analista": "Delianne", "status": "impedimento", "data": "2026-07-08", **extra}


@pytest.mark.asyncio
async def test_create_with_data_limite() -> None:
    session = _session(date(2026, 7, 15))
    body = PendenciaCreate(**_base_payload(data_limite="2026-07-15"))

    out = await create_pendencia(body, {"sub": "7"}, session)

    insert_params = session.execute.await_args_list[0].args[1]
    assert insert_params["data_limite"] == "2026-07-15"
    assert out.data_limite == "2026-07-15"


@pytest.mark.asyncio
async def test_create_without_data_limite_stores_null() -> None:
    session = _session(None)
    body = PendenciaCreate(**_base_payload(data_limite=None))

    out = await create_pendencia(body, {"sub": "7"}, session)

    insert_params = session.execute.await_args_list[0].args[1]
    assert insert_params["data_limite"] is None
    assert out.data_limite is None


@pytest.mark.asyncio
async def test_update_sets_data_limite() -> None:
    session = _session(date(2026, 7, 20))
    body = PendenciaUpdate(data_limite="2026-07-20")

    await update_pendencia(1, body, {}, session)

    sql = str(session.execute.await_args_list[0].args[0])
    params = session.execute.await_args_list[0].args[1]
    assert "data_limite=:data_limite" in sql
    assert params["data_limite"] == "2026-07-20"


@pytest.mark.asyncio
async def test_update_null_clears_data_limite() -> None:
    session = _session(None)
    body = PendenciaUpdate(data_limite=None)

    await update_pendencia(1, body, {}, session)

    params = session.execute.await_args_list[0].args[1]
    assert "data_limite" in params and params["data_limite"] is None


@pytest.mark.asyncio
async def test_update_status_only_keeps_data_limite() -> None:
    session = _session(date(2026, 7, 20))
    body = PendenciaUpdate(status="resolvido")

    await update_pendencia(1, body, {}, session)

    sql = str(session.execute.await_args_list[0].args[0])
    assert "data_limite" not in sql
