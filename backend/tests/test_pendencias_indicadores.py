"""Tests for the Daily performance indicators (tbl_metas) endpoint."""
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from src.api.routers.pendencias import (
    INDICADORES_LIMIT,
    build_indicador,
    list_indicadores,
    parse_indicator_value,
)


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("95", 95.0),
        ("95%", 95.0),
        ("92,5%", 92.5),
        ("92.5", 92.5),
        ("1.234,56", 1234.56),
        ("1,234.56", 1234.56),
        ("1.234.567", 1234567.0),
        ("R$ 10,00", 10.0),
        ("4h", 4.0),
        ("08:30", 8.5),
        ("-3", -3.0),
        ("", None),
        (None, None),
        ("N/A", None),
    ],
)
def test_parse_indicator_value(raw: str | None, expected: float | None) -> None:
    assert parse_indicator_value(raw) == expected


def test_realizado_below_meta_is_not_achieved() -> None:
    assert build_indicador("SLA", "95%", "90%").achieved is False


def test_realizado_equal_meta_is_achieved() -> None:
    assert build_indicador("SLA", "95%", "95,0%").achieved is True


def test_realizado_above_meta_is_achieved() -> None:
    assert build_indicador("Tickets", "100", "120").achieved is True


def test_unparseable_value_has_no_status() -> None:
    out = build_indicador("Projeto", "Go-live", "Em andamento")
    assert out.achieved is None
    assert out.meta == "Go-live" and out.realizado == "Em andamento"


def test_null_columns_become_empty_strings() -> None:
    out = build_indicador(None, None, None)
    assert (out.descricao, out.meta, out.realizado, out.achieved) == ("", "", "", None)


@pytest.mark.asyncio
async def test_list_indicadores_returns_raw_text_and_status() -> None:
    result = MagicMock()
    result.fetchall.return_value = [("SLA", "95%", "90%"), ("NPS", "70", "75")]
    session = MagicMock()
    session.execute = AsyncMock(return_value=result)

    out = await list_indicadores({}, session)

    params = session.execute.await_args.args[1]
    assert params["limit"] == INDICADORES_LIMIT == 8
    assert [(i.descricao, i.meta, i.realizado, i.achieved) for i in out] == [
        ("SLA", "95%", "90%", False),
        ("NPS", "70", "75", True),
    ]


@pytest.mark.asyncio
async def test_list_indicadores_hides_internal_error() -> None:
    session = MagicMock()
    session.execute = AsyncMock(side_effect=RuntimeError("Table 'tbl_metas' doesn't exist"))

    with pytest.raises(HTTPException) as exc_info:
        await list_indicadores({}, session)

    assert exc_info.value.status_code == 500
    assert "tbl_metas" not in exc_info.value.detail
