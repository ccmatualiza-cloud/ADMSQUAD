"""Tests for the public monitor list returning qtdsistemas (robot column M)."""
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.api.routers.cx import list_atualizacoes_public

KEYS = ["cod", "razao", "sistema", "bd", "versao", "linxwebver", "ticketupdate", "tipo", "pacote",
        "useragend", "prioridade", "horaupdate", "concluido", "versaoat", "qtdsistemas"]


@pytest.mark.asyncio
async def test_public_list_returns_versaoat_and_qtdsistemas() -> None:
    row = (1, "LOJA X", "LINX DMS", "BD1", "3", "20261101.1", "T1", "A", "EVO",
           "ana", 1, "22:00", "0", "3.01", 1)
    result = MagicMock()
    result.fetchall.return_value = [row]
    result.keys.return_value = KEYS
    session = MagicMock()
    session.execute = AsyncMock(return_value=result)

    out = await list_atualizacoes_public(session=session)

    sql = str(session.execute.await_args.args[0])
    assert "versaoat, qtdsistemas" in sql
    assert out[0]["versaoat"] == "3.01"
    assert out[0]["qtdsistemas"] == 1
