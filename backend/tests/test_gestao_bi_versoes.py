"""Tests for the B.I. clients-per-version (versaoat) chart endpoint."""
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException
from sqlalchemy.exc import OperationalError

from src.api.routers.gestao import _count_by_version, bi_versoes, bi_versoes_camadas


def _session(rows: list[tuple]) -> MagicMock:
    result = MagicMock()
    result.fetchall.return_value = rows
    session = MagicMock()
    session.execute = AsyncMock(return_value=result)
    return session


@pytest.mark.asyncio
async def test_versoes_filters_status_and_groups() -> None:
    session = _session([("2.5.10", 40), ("2.5.9", 12), ("SEM VERSÃO", 3)])

    out = await bi_versoes({}, session)

    sql = str(session.execute.await_args.args[0])
    params = session.execute.await_args.args[1]
    assert "versaoat" in sql and "GROUP BY" in sql
    assert set(params.values()) == {"6 - ATIVO", "4 - BASE", "7 - ATIVO VPU"}
    assert out == [
        {"versao": "2.5.10", "total": 40},
        {"versao": "2.5.9", "total": 12},
        {"versao": "SEM VERSÃO", "total": 3},
    ]


@pytest.mark.asyncio
async def test_versoes_db_error_returns_generic_500() -> None:
    session = MagicMock()
    session.execute = AsyncMock(side_effect=OperationalError("SELECT", {}, Exception("db password leaked")))

    with pytest.raises(HTTPException) as exc:
        await bi_versoes({}, session)

    assert exc.value.status_code == 500
    assert "password" not in str(exc.value.detail)


@pytest.mark.asyncio
async def test_versoes_camadas_uses_versao_column() -> None:
    session = _session([("12.1.0", 30), ("SEM VERSÃO", 2)])

    out = await bi_versoes_camadas({}, session)

    sql = str(session.execute.await_args.args[0])
    params = session.execute.await_args.args[1]
    assert "TRIM(versao)" in sql and "versaoat" not in sql
    assert set(params.values()) == {"6 - ATIVO", "4 - BASE", "7 - ATIVO VPU"}
    assert out == [{"versao": "12.1.0", "total": 30}, {"versao": "SEM VERSÃO", "total": 2}]


@pytest.mark.asyncio
async def test_count_by_version_rejects_unknown_column() -> None:
    with pytest.raises(ValueError):
        await _count_by_version(MagicMock(), "razao; DROP TABLE x", "evt")
