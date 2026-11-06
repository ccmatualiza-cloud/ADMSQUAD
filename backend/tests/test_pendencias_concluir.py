"""Tests for archiving pendencias from the Gestão > Tarefas Kanban (status 'concluido')."""
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException
from sqlalchemy.exc import OperationalError

from src.api.routers.pendencias import concluir_pendencia, list_pendencias


def _session(rowcount: int = 1) -> MagicMock:
    session = MagicMock()
    session.execute = AsyncMock(return_value=MagicMock(rowcount=rowcount))
    session.commit = AsyncMock()
    return session


@pytest.mark.asyncio
async def test_concluir_only_from_resolvido() -> None:
    session = _session(rowcount=1)

    await concluir_pendencia(7, {"sub": "1"}, session)

    sql = str(session.execute.await_args.args[0])
    params = session.execute.await_args.args[1]
    assert "status = :new" in sql and "status = 'resolvido'" in sql
    assert params == {"new": "concluido", "id": 7}
    session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_concluir_not_resolvido_returns_409() -> None:
    with pytest.raises(HTTPException) as exc:
        await concluir_pendencia(7, {"sub": "1"}, _session(rowcount=0))
    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_concluir_db_error_returns_generic_500() -> None:
    session = MagicMock()
    session.execute = AsyncMock(side_effect=OperationalError("UPDATE", {}, Exception("secret")))
    with pytest.raises(HTTPException) as exc:
        await concluir_pendencia(7, {"sub": "1"}, session)
    assert exc.value.status_code == 500
    assert "secret" not in str(exc.value.detail)


def _list_session() -> MagicMock:
    result = MagicMock()
    result.fetchall.return_value = []
    result.keys.return_value = []
    session = MagicMock()
    session.execute = AsyncMock(return_value=result)
    return session


@pytest.mark.asyncio
@pytest.mark.parametrize("include_resolvido", [True, False])
async def test_list_always_hides_concluido(include_resolvido: bool) -> None:
    session = _list_session()

    await list_pendencias(include_resolvido=include_resolvido, session=session)

    sql = str(session.execute.await_args.args[0])
    assert "'concluido'" in sql
    assert ("'resolvido'" in sql) is (not include_resolvido)


def test_dashboard_counts_exclude_concluido() -> None:
    source = (Path(__file__).parents[1] / "src/api/routers/dashboard.py").read_text(encoding="utf-8")
    assert "status != 'resolvido'" not in source
    assert source.count("status NOT IN ('resolvido', 'concluido')") == 3
