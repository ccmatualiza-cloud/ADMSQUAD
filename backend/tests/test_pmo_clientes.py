"""Regression tests for PMO client creation (POST /api/pmo/clientes)."""
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.api.routers.pmo import ClientePmoCreate, create_cliente_pmo


def _fake_session(lastrowid: int = 123) -> MagicMock:
    session = MagicMock()
    session.execute = AsyncMock(return_value=MagicMock(lastrowid=lastrowid))
    session.commit = AsyncMock()
    return session


def test_create_model_accepts_projeto() -> None:
    body = ClientePmoCreate(razao="ACME LTDA", cliente="ACME", projeto="PRJ-01")
    assert body.projeto == "PRJ-01"


@pytest.mark.asyncio
async def test_create_cliente_persists_projeto() -> None:
    session = _fake_session()
    body = ClientePmoCreate(razao="ACME LTDA", cliente="ACME", projeto="PRJ-01", qtdusers=5)

    result = await create_cliente_pmo(body, {"role": "admin"}, session)

    assert result == {"created": True, "id": 123}
    params = session.execute.await_args.args[1]
    assert params["projeto"] == "PRJ-01"
    assert params["qtdusers"] == 5
    session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_create_cliente_without_projeto_defaults_to_empty() -> None:
    session = _fake_session()
    body = ClientePmoCreate(razao="ACME LTDA", cliente="ACME")

    await create_cliente_pmo(body, {"role": "admin"}, session)

    params = session.execute.await_args.args[1]
    assert params["projeto"] == ""
    assert params["tsplus"] == "Nao"
