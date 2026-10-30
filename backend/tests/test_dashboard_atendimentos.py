"""Tests for the dashboard WhatsApp attendances (tbl_whatsqtd) endpoint."""
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from src.api.routers.dashboard import (
    DEFAULT_ATENDIMENTO_COLOR,
    atendimentos_whatsapp,
    normalize_color,
    parse_qtd,
)


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("#1DB954", "#1DB954"),
        ("1DB954", "#1DB954"),
        ("#fff", "#fff"),
        (" Green ", "green"),
        ("Verde", "#1DB954"),
        ("vermelho", "#E74C3C"),
        ("Azul Claro", "#00B0EA"),
        ("lilás", "#B39DDB"),
        ("rgb(29, 185, 84)", "rgb(29, 185, 84)"),
        ("cormaluca", DEFAULT_ATENDIMENTO_COLOR),
        ("", DEFAULT_ATENDIMENTO_COLOR),
        (None, DEFAULT_ATENDIMENTO_COLOR),
        ("red;background:url(x)", DEFAULT_ATENDIMENTO_COLOR),
    ],
)
def test_normalize_color(raw: str | None, expected: str) -> None:
    assert normalize_color(raw) == expected


@pytest.mark.parametrize(
    ("raw", "expected"),
    [(12, 12), ("12", 12), ("1.234", 1234), (" 7 ", 7), ("", 0), (None, 0), ("abc", 0), (3.0, 3)],
)
def test_parse_qtd(raw: object, expected: int) -> None:
    assert parse_qtd(raw) == expected


@pytest.mark.asyncio
async def test_atendimentos_whatsapp_maps_rows() -> None:
    result = MagicMock()
    result.fetchall.return_value = [("#1DB954", "Em atendimento", "5"), ("F9A825", "Na fila", 2)]
    session = MagicMock()
    session.execute = AsyncMock(return_value=result)

    out = await atendimentos_whatsapp({}, session)

    assert [(a.cor, a.descricao, a.qtd) for a in out] == [
        ("#1DB954", "Em atendimento", 5),
        ("#F9A825", "Na fila", 2),
    ]


@pytest.mark.asyncio
async def test_atendimentos_whatsapp_hides_internal_error() -> None:
    session = MagicMock()
    session.execute = AsyncMock(side_effect=RuntimeError("Table 'tbl_whatsqtd' doesn't exist"))

    with pytest.raises(HTTPException) as exc_info:
        await atendimentos_whatsapp({}, session)

    assert exc_info.value.status_code == 500
    assert "tbl_whatsqtd" not in exc_info.value.detail
