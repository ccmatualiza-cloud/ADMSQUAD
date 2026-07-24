from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user, get_db

router = APIRouter(prefix="/api/pmo", tags=["pmo"])


class ClientePmoItem(BaseModel):
    cod: int
    razao: str | None = None
    implat: str | None = None
    franq: str | None = None
    qtdusers: int | None = None
    prxcontat: str | None = None
    datprev: str | None = None
    stimplant: str | None = None
    status: str | None = None
    tsplus: str | None = None
    qtdusersts: int | None = None


class ClientePmoCreate(BaseModel):
    razao: str
    cliente: str
    qtdusers: int | None = None
    datprev: str | None = None
    sistema: str | None = None
    prxcontat: str | None = None
    franq: str | None = None
    implat: str | None = None
    stimplant: str | None = None
    tsplus: str | None = None
    qtdusersts: int | None = None


class ClientePmoUpdate(BaseModel):
    razao: str | None = None
    qtdusers: int | None = None
    datprev: str | None = None
    sistema: str | None = None
    prxcontat: str | None = None
    franq: str | None = None
    implat: str | None = None
    stimplant: str | None = None
    tsplus: str | None = None
    qtdusersts: int | None = None


@router.get("/clientes", response_model=list[ClientePmoItem])
async def list_clientes_pmo(
    q: str = "",
    _: Annotated[dict, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db)] = None,
) -> list[ClientePmoItem]:
    try:
        params: dict = {}
        where = "WHERE status = '0 - IMPLANTAÇÃO'"
        if q:
            where += " AND (razao LIKE :q OR implat LIKE :q OR franq LIKE :q)"
            params["q"] = f"%{q}%"
        result = await session.execute(
            text(f"SELECT cod, razao, implat, franq, qtdusers, prxcontat, datprev, stimplant, status, tsplus, qtdusersts FROM tbl_linx {where} ORDER BY razao"),
            params
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [ClientePmoItem(**dict(zip(keys, r))) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/clientes", status_code=status.HTTP_201_CREATED)
async def create_cliente_pmo(
    body: ClientePmoCreate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        result = await session.execute(
            text("""
                INSERT INTO tbl_linx (razao, cliente, qtdusers, datprev, sistema, prxcontat, franq, implat, stimplant, tsplus, qtdusersts, status)
                VALUES (:razao, :cliente, :qtdusers, :datprev, :sistema, :prxcontat, :franq, :implat, :stimplant, :tsplus, :qtdusersts, '0 - IMPLANTAÇÃO')
            """),
            {
                "razao":     body.razao,
                "cliente":   body.cliente,
                "qtdusers":  body.qtdusers or 0,
                "datprev":   body.datprev or "",
                "sistema":   body.sistema or "",
                "prxcontat": body.prxcontat or "",
                "franq":     body.franq or "",
                "implat":    body.implat or "",
                "stimplant": body.stimplant or "",
                "tsplus":    body.tsplus or "Nao",
                "qtdusersts": body.qtdusersts or 0,
            }
        )
        await session.commit()
        return {"created": True, "id": result.lastrowid}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/clientes/{cod}")
async def update_cliente_pmo(
    cod: int,
    body: ClientePmoUpdate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        sets, params = [], {"cod": cod}
        if body.razao     is not None: sets.append("razao=:razao");         params["razao"]     = body.razao
        if body.qtdusers  is not None: sets.append("qtdusers=:qtdusers");   params["qtdusers"]  = body.qtdusers
        if body.datprev   is not None: sets.append("datprev=:datprev");     params["datprev"]   = body.datprev
        if body.sistema   is not None: sets.append("sistema=:sistema");     params["sistema"]   = body.sistema
        if body.prxcontat is not None: sets.append("prxcontat=:prxcontat"); params["prxcontat"] = body.prxcontat
        if body.franq     is not None: sets.append("franq=:franq");         params["franq"]     = body.franq
        if body.implat    is not None: sets.append("implat=:implat");       params["implat"]    = body.implat
        if body.stimplant    is not None: sets.append("stimplant=:stimplant");       params["stimplant"]    = body.stimplant
        if body.tsplus       is not None: sets.append("tsplus=:tsplus");             params["tsplus"]       = body.tsplus
        if body.qtdusersts   is not None: sets.append("qtdusersts=:qtdusersts");   params["qtdusersts"]   = body.qtdusersts
        if not sets:
            raise HTTPException(status_code=400, detail="Nada para atualizar")
        await session.execute(text(f"UPDATE tbl_linx SET {', '.join(sets)} WHERE cod = :cod"), params)
        await session.commit()
        return {"updated": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Franquias ──────────────────────────────────────────────────────────────

class FranquiaItem(BaseModel):
    cod: int
    nome: str | None = None
    contato: str | None = None
    celular: str | None = None
    email: str | None = None
    cidade: str | None = None
    modelo: str | None = None
    status: str | None = None


class FranquiaCreate(BaseModel):
    nome: str
    contato: str | None = None
    celular: str | None = None
    email: str | None = None
    cidade: str | None = None
    modelo: str | None = None
    status: str = "ATIVO"


class FranquiaUpdate(BaseModel):
    nome: str | None = None
    contato: str | None = None
    celular: str | None = None
    email: str | None = None
    cidade: str | None = None
    modelo: str | None = None
    status: str | None = None


@router.get("/franquias", response_model=list[FranquiaItem])
async def list_franquias(
    q: str = "",
    _: Annotated[dict, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db)] = None,
) -> list[FranquiaItem]:
    try:
        params: dict = {}
        where = "WHERE 1=1"
        if q:
            where += " AND (nome LIKE :q OR contato LIKE :q OR cidade LIKE :q)"
            params["q"] = f"%{q}%"
        result = await session.execute(
            text(f"SELECT cod, nome, contato, celular, email, cidade, modelo, status FROM tbl_franq {where} ORDER BY nome ASC"),
            params
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [FranquiaItem(**dict(zip(keys, r))) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/franquias", status_code=status.HTTP_201_CREATED)
async def create_franquia(
    body: FranquiaCreate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        result = await session.execute(
            text("""INSERT INTO tbl_franq (nome, contato, celular, email, cidade, modelo, status)
                    VALUES (:nome, :contato, :celular, :email, :cidade, :modelo, :status)"""),
            {
                "nome":     body.nome,
                "contato":  body.contato or "",
                "celular":  body.celular or "",
                "email":    body.email or "",
                "cidade":   body.cidade or "",
                "modelo":   body.modelo or "",
                "status":   body.status,
            }
        )
        await session.commit()
        return {"created": True, "id": result.lastrowid}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/franquias/{cod}")
async def update_franquia(
    cod: int,
    body: FranquiaUpdate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        sets, params = [], {"cod": cod}
        if body.nome     is not None: sets.append("nome=:nome");       params["nome"]     = body.nome
        if body.contato  is not None: sets.append("contato=:contato"); params["contato"]  = body.contato
        if body.celular  is not None: sets.append("celular=:celular"); params["celular"]  = body.celular
        if body.email    is not None: sets.append("email=:email");     params["email"]    = body.email
        if body.cidade   is not None: sets.append("cidade=:cidade");   params["cidade"]   = body.cidade
        if body.modelo   is not None: sets.append("modelo=:modelo");   params["modelo"]   = body.modelo
        if body.status   is not None: sets.append("status=:status");   params["status"]   = body.status
        if not sets:
            raise HTTPException(status_code=400, detail="Nada para atualizar")
        await session.execute(text(f"UPDATE tbl_franq SET {', '.join(sets)} WHERE cod = :cod"), params)
        await session.commit()
        return {"updated": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Cancelamento de Clientes (Inativos) ──────────────────────────────────────

class ClienteInativoItem(BaseModel):
    cod: int
    razao: str | None = None
    caminholoc: str | None = None
    sistema: str | None = None
    serverbd: str | None = None
    dataoff: str | None = None
    status: str | None = None
    qtdusers: int | None = None


@router.get("/inativos", response_model=list[ClienteInativoItem])
async def list_inativos(
    q: str = "",
    _: Annotated[dict, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db)] = None,
) -> list[ClienteInativoItem]:
    try:
        where = "WHERE status = '9 - INATIVO'"
        params: dict = {}
        if q:
            where += " AND (razao LIKE :q OR sistema LIKE :q OR serverbd LIKE :q)"
            params["q"] = f"%{q}%"
        result = await session.execute(
            text(f"SELECT cod, razao, caminholoc, sistema, serverbd, dataoff, status, qtdusers FROM tbl_linx {where} ORDER BY razao"),
            params
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [ClienteInativoItem(**dict(zip(keys, r))) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
