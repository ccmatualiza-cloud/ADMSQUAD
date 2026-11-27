"""Tests for Operações > Revisão (cancelled clients review tags in tbl_linx.detalhes)."""
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.exc import OperationalError

from src.api.routers.revisao import (
    RevisaoActionBody,
    apply_action,
    apply_revisao_action,
    list_revisao,
)

USER = {"sub": "5"}


def _session(*side_effect) -> MagicMock:
    session = MagicMock()
    session.execute = AsyncMock(side_effect=list(side_effect))
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    return session


def _fetchone(row) -> MagicMock:
    result = MagicMock()
    result.fetchone.return_value = row
    return result


@pytest.mark.parametrize(
    ("current", "action", "expected"),
    [
        (None, "pmp", "PMP"),
        ("PMP", "oci", "PMP - OCI"),
        ("PMP - OCI", "db", "PMP - OCI - DB"),
        ("PMP - OCI", "oci", "PMP - OCI"),      # no duplicates
        ("OK", "db", "DB"),                     # a new tag replaces OK
        ("PMP - OCI", "ok", "OK"),
        ("PMP - OCI - DB", "clear", None),
        ("", "clear", None),
    ],
)
def test_apply_action(current, action, expected) -> None:
    assert apply_action(current, action) == expected


def test_action_body_rejects_unknown_action() -> None:
    with pytest.raises(ValidationError):
        RevisaoActionBody(action="delete")


async def test_list_filters_inactive_and_normalizes_numbers() -> None:
    result = MagicMock()
    result.keys.return_value = ["cod", "razao", "cliente", "sistema", "qtdusers",
                                "qtdusersts", "grupo", "detalhes"]
    result.fetchall.return_value = [(10, "Auto X", "X", "DMS", "0", "", "INT", "PMP")]
    session = _session(result)

    items = await list_revisao(USER, session, q="auto")

    sql, params = str(session.execute.call_args.args[0]), session.execute.call_args.args[1]
    assert "status = :status" in sql
    assert params == {"status": "9 - INATIVO", "q": "%auto%"}
    assert items[0].qtdusers == 0 and items[0].qtdusersts is None
    assert items[0].detalhes == "PMP"


async def test_action_appends_and_commits() -> None:
    session = _session(_fetchone(("PMP",)), MagicMock())

    out = await apply_revisao_action(7, RevisaoActionBody(action="db"), USER, session)

    assert out.detalhes == "PMP - DB"
    update_params = session.execute.call_args_list[1].args[1]
    assert update_params == {"detalhes": "PMP - DB", "cod": 7}
    session.commit.assert_awaited_once()


async def test_action_404_when_client_not_inactive() -> None:
    session = _session(_fetchone(None))
    with pytest.raises(HTTPException) as exc:
        await apply_revisao_action(7, RevisaoActionBody(action="ok"), USER, session)
    assert exc.value.status_code == 404
    session.commit.assert_not_awaited()


async def test_action_db_error_returns_generic_500() -> None:
    session = _session(OperationalError("x", {}, Exception("boom")))
    with pytest.raises(HTTPException) as exc:
        await apply_revisao_action(7, RevisaoActionBody(action="ok"), USER, session)
    assert exc.value.status_code == 500
    assert "boom" not in exc.value.detail
    session.rollback.assert_awaited_once()
