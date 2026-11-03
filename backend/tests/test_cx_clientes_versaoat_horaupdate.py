"""Tests for Ver.At (versaoat) column/search and horaupdate on CX Clientes."""
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.api.routers.cx import ClienteDetalhe, get_cliente, list_clientes, update_cliente

LIST_KEYS = ["cod", "razao", "cliente", "sistema", "versaoat", "versao", "qtdusers",
             "qtdusersts", "serverbd", "codigoc", "grupo", "status", "doc"]


def _session(fetchall: list | None = None, fetchone: tuple | None = None, keys: list | None = None) -> MagicMock:
    result = MagicMock()
    result.fetchall.return_value = fetchall or []
    result.fetchone.return_value = fetchone
    result.keys.return_value = keys or []
    session = MagicMock()
    session.execute = AsyncMock(return_value=result)
    session.commit = AsyncMock()
    return session


@pytest.mark.asyncio
async def test_list_returns_versaoat() -> None:
    row = (1, "LOJA X", "lojax", "LINX ERP", "2.5.10", "2.5.9", 10, 3, "SRV01", "C1", "SEG", "6 - ATIVO", None)
    session = _session(fetchall=[row], keys=LIST_KEYS)

    out = await list_clientes(session=session)

    sql = str(session.execute.await_args.args[0])
    assert "versaoat, versao" in sql
    assert out[0].versaoat == "2.5.10"


@pytest.mark.asyncio
async def test_search_matches_versaoat() -> None:
    session = _session(keys=LIST_KEYS)

    await list_clientes(q="2.5.10", session=session)

    sql = str(session.execute.await_args.args[0])
    params = session.execute.await_args.args[1]
    assert "versaoat LIKE :q" in sql
    assert params["q"] == "%2.5.10%"


@pytest.mark.asyncio
async def test_detail_returns_horaupdate() -> None:
    keys = ["cod", "razao", "horaupdate"]
    session = _session(fetchone=(1, "LOJA X", "22:30"), keys=keys)

    out = await get_cliente(1, {}, session)

    assert "horaupdate" in str(session.execute.await_args.args[0])
    assert isinstance(out, ClienteDetalhe)
    assert out.horaupdate == "22:30"


@pytest.mark.asyncio
async def test_update_accepts_horaupdate() -> None:
    session = _session()

    await update_cliente(1, {"horaupdate": "23:00", "nao_permitido": "x"}, {}, session)

    sql = str(session.execute.await_args.args[0])
    params = session.execute.await_args.args[1]
    assert "horaupdate=:horaupdate" in sql
    assert params["horaupdate"] == "23:00"
    assert "nao_permitido" not in sql
