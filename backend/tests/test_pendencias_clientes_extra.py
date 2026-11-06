"""Tests for the extra internal clients on the Daily client autocomplete."""
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.api.routers.pendencias import (
    EXTRA_CLIENTES,
    clientes_autocomplete,
    merge_cliente_suggestions,
)


def test_extras_match_case_insensitive_and_come_first() -> None:
    out = merge_cliente_suggestions("squad", ["SQUADRA MODAS"])
    assert out == ["SQUAD CCM BULLS", "SQUAD CCM LAKERS", "SQUAD CCM ROCKETS",
                   "SQUAD CCM WARRIORS", "SQUADRA MODAS"]


def test_partial_match_and_no_duplicates() -> None:
    out = merge_cliente_suggestions("ccm", ["GRC CCM", "LOJA CCM"])
    assert out.count("GRC CCM") == 1
    assert "ENGENHARIA CCM" in out and "PED CCM" in out and "LOJA CCM" in out
    assert "LINX SISTEMAS" not in out


def test_all_twelve_extras_exist() -> None:
    assert len(EXTRA_CLIENTES) == 12
    for name in ("FINANCEIRO CCM", "RH CCM", "COMERCIAL CCM", "MARKETING CCM"):
        assert name in EXTRA_CLIENTES
    assert merge_cliente_suggestions("", []) == list(EXTRA_CLIENTES)


@pytest.mark.asyncio
async def test_endpoint_merges_db_results() -> None:
    result = MagicMock()
    result.fetchall.return_value = [("LINX SISTEMAS",), ("LINX MODAS",)]
    session = MagicMock()
    session.execute = AsyncMock(return_value=result)

    out = await clientes_autocomplete(q="linx", session=session)

    assert out == ["LINX SISTEMAS", "LINX MODAS"]


@pytest.mark.asyncio
async def test_endpoint_db_error_still_returns_extras() -> None:
    session = MagicMock()
    session.execute = AsyncMock(side_effect=RuntimeError("down"))

    assert await clientes_autocomplete(q="ped", session=session) == ["PED CCM"]
