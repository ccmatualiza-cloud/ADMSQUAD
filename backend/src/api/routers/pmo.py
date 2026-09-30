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
            text(f"SELECT cod, razao, caminholoc, sistema, serverbd, dataoff, status, qtdusers FROM tbl_linx {where} ORDER BY STR_TO_DATE(dataoff, '%d/%m/%Y') DESC"),
            params
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [ClienteInativoItem(**dict(zip(keys, r))) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Cancelamento actions ──────────────────────────────────────────────────────

@router.get("/cancelamento/cliente/{cod}")
async def get_cliente_cancelamento(
    cod: int,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        result = await session.execute(
            text("SELECT cod, razao, qtdusers, grupo, status, caminholoc FROM tbl_linx WHERE cod = :cod"),
            {"cod": cod}
        )
        row = result.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Cliente não encontrado")
        keys = list(result.keys())
        d = dict(zip(keys, row))
        return {
            "cod": d["cod"], "razao": d["razao"] or "",
            "qtdusers": d["qtdusers"] or 0, "grupo": d["grupo"] or "",
            "status": d["status"] or "", "caminholoc": d["caminholoc"] or "",
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


class CancelamentoBody(BaseModel):
    cod: int


@router.post("/cancelamento/cancelar")
async def cancelar_cliente(
    body: CancelamentoBody,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        from datetime import date
        # Get current qtdusers
        r = await session.execute(
            text("SELECT qtdusers FROM tbl_linx WHERE cod = :cod"),
            {"cod": body.cod}
        )
        row = r.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Cliente não encontrado")
        qtd = int(row[0]) if row[0] else 0
        dataoff = date.today().strftime("%d/%m/%Y")
        caminholoc_val = f"Cancelado - QTD users = {qtd}"

        await session.execute(
            text("""UPDATE tbl_linx SET
                caminholoc       = :caminholoc,
                qtdusers         = 0,
                bd               = 'CANCELADO',
                grupo            = 'INT',
                status           = '9 - INATIVO',
                srvtreino        = 'C',
                descricaotreino  = 'CANCELADO-TOTAL',
                dataoff          = :dataoff,
                bdtreino         = 'CANCELADO-TOTAL'
            WHERE cod = :cod"""),
            {"caminholoc": caminholoc_val, "dataoff": dataoff, "cod": body.cod}
        )
        await session.commit()
        return {"cancelled": True}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Ações rápidas implantação ─────────────────────────────────────────────────

@router.put("/clientes/{cod}/concluir-implantacao")
async def concluir_implantacao(
    cod: int,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        await session.execute(
            text("UPDATE tbl_linx SET stimplant = 'CONCLUIDO', status = '1 - PRIMEIRO CONTATO' WHERE cod = :cod"),
            {"cod": cod}
        )
        await session.commit()
        return {"updated": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/clientes/{cod}/cancelar-implantacao")
async def cancelar_implantacao(
    cod: int,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        await session.execute(
            text("UPDATE tbl_linx SET stimplant = 'CANCELADO', status = '5 - EM CANCELAMENTO' WHERE cod = :cod"),
            {"cod": cod}
        )
        await session.commit()
        return {"updated": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Checklist ────────────────────────────────────────────────────────────────

class ModeloItem(BaseModel):
    cod: int
    nome: str
    descricao: str | None = None

class ModeloItemDetalhe(BaseModel):
    cod: int
    ordem: int
    descricao: str

class ModeloCreate(BaseModel):
    nome: str
    descricao: str = ""
    itens: list[str] = []

class ChecklistItem(BaseModel):
    cod: int
    cliente: str
    implantador: str | None = None
    modelo_cod: int | None = None
    status: str
    total_itens: int = 0
    concluidos: int = 0
    created_at: str | None = None

class ChecklistCreate(BaseModel):
    cliente: str
    implantador: str = ""
    modelo_cod: int | None = None
    itens: list[str] = []

class ChecklistItemUpdate(BaseModel):
    concluido: bool
    obs: str = ""


@router.get("/checklist/modelos", response_model=list[ModeloItem])
async def list_modelos(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[ModeloItem]:
    try:
        result = await session.execute(text("SELECT cod, nome, descricao FROM tbl_checklist_modelos ORDER BY nome ASC"))
        rows = result.fetchall()
        return [ModeloItem(cod=r[0], nome=r[1], descricao=r[2]) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/checklist/modelos/{cod}/itens", response_model=list[ModeloItemDetalhe])
async def get_modelo_itens(
    cod: int,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[ModeloItemDetalhe]:
    try:
        result = await session.execute(
            text("SELECT cod, ordem, descricao FROM tbl_checklist_modelo_itens WHERE modelo_cod = :cod ORDER BY ordem ASC"),
            {"cod": cod}
        )
        rows = result.fetchall()
        return [ModeloItemDetalhe(cod=r[0], ordem=r[1], descricao=r[2]) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/checklist/modelos", status_code=201)
async def create_modelo(
    body: ModeloCreate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        result = await session.execute(
            text("INSERT INTO tbl_checklist_modelos (nome, descricao) VALUES (:nome, :desc)"),
            {"nome": body.nome, "desc": body.descricao}
        )
        modelo_id = result.lastrowid
        for i, item in enumerate(body.itens):
            if item.strip():
                await session.execute(
                    text("INSERT INTO tbl_checklist_modelo_itens (modelo_cod, ordem, descricao) VALUES (:m, :o, :d)"),
                    {"m": modelo_id, "o": i, "d": item.strip()}
                )
        await session.commit()
        return {"created": True, "id": modelo_id}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/checklist/modelos/{cod}", status_code=204)
async def delete_modelo(
    cod: int,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    try:
        await session.execute(text("DELETE FROM tbl_checklist_modelos WHERE cod = :cod"), {"cod": cod})
        await session.commit()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/checklists", response_model=list[ChecklistItem])
async def list_checklists(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[ChecklistItem]:
    try:
        result = await session.execute(text("""
            SELECT c.cod, c.cliente, c.implantador, c.modelo_cod, c.status,
                   COUNT(i.cod) as total, SUM(i.concluido) as conc,
                   c.created_at
            FROM tbl_checklists c
            LEFT JOIN tbl_checklist_itens i ON i.checklist_cod = c.cod
            GROUP BY c.cod
            ORDER BY c.created_at DESC
        """))
        rows = result.fetchall()
        return [ChecklistItem(
            cod=r[0], cliente=r[1], implantador=r[2], modelo_cod=r[3], status=r[4],
            total_itens=int(r[5] or 0), concluidos=int(r[6] or 0),
            created_at=str(r[7]) if r[7] else None
        ) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/checklists", status_code=201)
async def create_checklist(
    body: ChecklistCreate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        result = await session.execute(
            text("INSERT INTO tbl_checklists (cliente, implantador, modelo_cod) VALUES (:c, :i, :m)"),
            {"c": body.cliente, "i": body.implantador, "m": body.modelo_cod}
        )
        chk_id = result.lastrowid
        itens = body.itens
        if not itens and body.modelo_cod:
            r2 = await session.execute(
                text("SELECT descricao FROM tbl_checklist_modelo_itens WHERE modelo_cod = :m ORDER BY ordem ASC"),
                {"m": body.modelo_cod}
            )
            itens = [row[0] for row in r2.fetchall()]
        for i, item in enumerate(itens):
            if item.strip():
                await session.execute(
                    text("INSERT INTO tbl_checklist_itens (checklist_cod, ordem, descricao) VALUES (:c, :o, :d)"),
                    {"c": chk_id, "o": i, "d": item.strip()}
                )
        await session.commit()
        return {"created": True, "id": chk_id}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/checklists/{cod}/status")
async def update_checklist_status(
    cod: int,
    status: str,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        await session.execute(
            text("UPDATE tbl_checklists SET status = :s WHERE cod = :cod"),
            {"s": status, "cod": cod}
        )
        await session.commit()
        return {"updated": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/checklists/{cod}", status_code=204)
async def delete_checklist(
    cod: int,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    try:
        await session.execute(text("DELETE FROM tbl_checklists WHERE cod = :cod"), {"cod": cod})
        await session.commit()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/checklists/{cod}/itens")
async def get_checklist_itens(
    cod: int,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    try:
        result = await session.execute(
            text("SELECT cod, ordem, descricao, concluido, obs, updated_at FROM tbl_checklist_itens WHERE checklist_cod = :cod ORDER BY ordem ASC"),
            {"cod": cod}
        )
        rows = result.fetchall()
        return [{"cod": r[0], "ordem": r[1], "descricao": r[2], "concluido": bool(r[3]), "obs": r[4], "updated_at": str(r[5]) if r[5] else None} for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/checklists/itens/{cod}")
async def update_checklist_item(
    cod: int,
    body: ChecklistItemUpdate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        from datetime import datetime as dt
        await session.execute(
            text("UPDATE tbl_checklist_itens SET concluido = :c, obs = :o, updated_at = :u WHERE cod = :cod"),
            {"c": 1 if body.concluido else 0, "o": body.obs, "u": dt.now(), "cod": cod}
        )
        await session.commit()
        return {"updated": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


class ChecklistNovoItem(BaseModel):
    descricao: str

@router.post("/checklists/{cod}/itens", status_code=201)
async def add_checklist_item(
    cod: int,
    body: ChecklistNovoItem,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        r = await session.execute(
            text("SELECT MAX(ordem) FROM tbl_checklist_itens WHERE checklist_cod = :cod"),
            {"cod": cod}
        )
        max_ordem = r.scalar() or 0
        await session.execute(
            text("INSERT INTO tbl_checklist_itens (checklist_cod, ordem, descricao) VALUES (:c, :o, :d)"),
            {"c": cod, "o": max_ordem + 1, "d": body.descricao}
        )
        await session.commit()
        return {"created": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
