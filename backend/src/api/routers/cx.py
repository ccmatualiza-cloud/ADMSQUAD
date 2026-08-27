from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user, get_db

router = APIRouter(prefix="/api/cx", tags=["cx"])


class ClienteItem(BaseModel):
    cod: int
    razao: str | None = None
    cliente: str | None = None
    sistema: str | None = None
    versao: str | None = None
    qtdusers: int | None = None
    qtdusersts: int | None = None
    serverbd: str | None = None
    codigoc: str | None = None
    grupo: str | None = None
    status: str | None = None
    doc: str | None = None


class ClienteDetalhe(BaseModel):
    cod: int
    razao: str | None = None
    cliente: str | None = None
    bandeira: str | None = None
    sistema: str | None = None
    versao: str | None = None
    bd: str | None = None
    serverbd: str | None = None
    qtdusers: int | None = None
    qtdusersts: int | None = None
    qtdsistemas: int | None = None
    qtdsrv: str | None = None
    status: str | None = None
    contatos: str | None = None
    telefones: str | None = None
    emails: str | None = None
    reg: str | None = None
    local: str | None = None
    grupo: str | None = None
    tipo: str | None = None
    pacote: str | None = None
    dt_atualiza: str | None = None
    versaoat: str | None = None
    franq: str | None = None
    ufmatriz: str | None = None
    integracoes: str | None = None
    infraprod: str | None = None
    infrats: str | None = None
    shape: str | None = None
    ocpu: str | None = None
    mem: str | None = None
    tsplus: str | None = None
    detalhes: str | None = None
    implat: str | None = None
    datastart: str | None = None
    prxcontat: str | None = None
    cnpj: str | None = None
    codigoc: str | None = None
    agtazure: str | None = None
    linxwebver: str | None = None
    doc: str | None = None
    link1: str | None = None
    link2: str | None = None
    link3: str | None = None


@router.get("/clientes", response_model=list[ClienteItem])
async def list_clientes(
    q: str = "",
    status_filter: str = "",
    grupo_filter: str = "",
    serverbd_filter: str = "",
    _: Annotated[dict, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db)] = None,
) -> list[ClienteItem]:
    try:
        where = "WHERE 1=1"
        params: dict = {}
        if q:
            where += " AND (razao LIKE :q OR cliente LIKE :q OR sistema LIKE :q)"
            params["q"] = f"%{q}%"
        if status_filter:
            where += " AND status = :status"
            params["status"] = status_filter
        if grupo_filter:
            where += " AND grupo = :grupo"
            params["grupo"] = grupo_filter
        if serverbd_filter:
            where += " AND serverbd LIKE :serverbd"
            params["serverbd"] = f"%{serverbd_filter}%"
        result = await session.execute(
            text(f"SELECT cod, razao, cliente, sistema, versao, qtdusers, qtdusersts, serverbd, codigoc, grupo, status, doc FROM tbl_linx {where} ORDER BY razao"),
            params
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [ClienteItem(**dict(zip(keys, r))) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/clientes/status-options")
async def status_options(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[str]:
    result = await session.execute(
        text("SELECT DISTINCT status FROM tbl_linx WHERE status IS NOT NULL AND status != '' ORDER BY status")
    )
    return [r[0] for r in result.fetchall()]


@router.get("/clientes/{cod}", response_model=ClienteDetalhe)
async def get_cliente(
    cod: int,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ClienteDetalhe:
    result = await session.execute(
        text("""SELECT cod, razao, cliente, bandeira, sistema, versao, bd, serverbd,
                       qtdusers, qtdusersts, qtdsistemas, qtdsrv, status, contatos, telefones, emails,
                       reg, local, grupo, tipo, pacote, dt_atualiza, versaoat, franq, ufmatriz,
                       integracoes, infraprod, infrats, shape, ocpu, mem, tsplus, detalhes,
                       implat, datastart, prxcontat, cnpj, codigoc, agtazure, linxwebver, doc, link1, link2, link3
                FROM tbl_linx WHERE cod = :cod"""),
        {"cod": cod}
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    keys = list(result.keys())
    return ClienteDetalhe(**dict(zip(keys, row)))


# ── Monitor de Atualizações ──────────────────────────────────────────────────

class AtualizacaoItem(BaseModel):
    cod: int | None = None
    razao: str | None = None
    sistema: str | None = None
    bd: str | None = None
    versao: str | None = None
    ticketupdate: str | None = None
    tipo: str | None = None
    pacote: str | None = None
    useragend: str | None = None
    prioridade: int | None = None
    horaupdate: str | None = None
    concluido: str | int | None = None


class AtualizacaoStats(BaseModel):
    total: int
    pct_nao_iniciado: float
    pct_em_andamento: float
    pct_concluido: float
    nao_iniciado: int
    em_andamento: int
    concluido_count: int


@router.get("/atualizacoes/stats", response_model=AtualizacaoStats)
async def atualizacoes_stats(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AtualizacaoStats:
    try:
        result = await session.execute(
            text("""
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN (TRIM(CAST(concluido AS CHAR)) = '0' OR concluido = 0) THEN 1 ELSE 0 END) as nao_iniciado,
                    SUM(CASE WHEN (TRIM(CAST(concluido AS CHAR)) NOT IN ('0','100') AND concluido NOT IN (0,100)) THEN 1 ELSE 0 END) as em_andamento,
                    SUM(CASE WHEN (TRIM(CAST(concluido AS CHAR)) = '100' OR concluido = 100) THEN 1 ELSE 0 END) as concluido_count
                FROM tbl_linx
                WHERE dt_atualiza = DATE_FORMAT(CURDATE(), '%d/%m/%Y')
            """)
        )
        row = result.fetchone()
        total = int(row[0]) if row and row[0] else 0
        nao   = int(row[1]) if row and row[1] else 0
        em    = int(row[2]) if row and row[2] else 0
        conc  = int(row[3]) if row and row[3] else 0
        def pct(n): return round(n / total * 100, 1) if total > 0 else 0.0
        return AtualizacaoStats(
            total=total, nao_iniciado=nao, em_andamento=em, concluido_count=conc,
            pct_nao_iniciado=pct(nao), pct_em_andamento=pct(em), pct_concluido=pct(conc)
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/atualizacoes", response_model=list[AtualizacaoItem])
async def list_atualizacoes(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[AtualizacaoItem]:
    try:
        result = await session.execute(
            text("""
                SELECT cod, razao, sistema, bd, versao, ticketupdate, tipo, pacote,
                       useragend, prioridade, horaupdate, concluido
                FROM tbl_linx
                WHERE dt_atualiza = DATE_FORMAT(CURDATE(), '%d/%m/%Y')
                ORDER BY CAST(concluido AS UNSIGNED) DESC, prioridade ASC, razao ASC
            """)
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [AtualizacaoItem(**dict(zip(keys, r))) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Agendamentos ──────────────────────────────────────────────────────────────

class AgendamentoCreate(BaseModel):
    cod: int
    cliente: str
    dt_atualiza: str
    ticketupdate: str
    formato: str
    tipo: str
    pacote: str
    useragend: str


class AgendamentoItem(BaseModel):
    cod: int
    razao: str | None = None
    cliente: str | None = None
    sistema: str | None = None
    bd: str | None = None
    versao: str | None = None
    dt_atualiza: str | None = None
    ticketupdate: str | None = None
    formato: str | None = None
    tipo: str | None = None
    pacote: str | None = None
    useragend: str | None = None
    concluido: str | int | None = None
    status: str | None = None


@router.get("/agendamentos/hoje", response_model=list[AgendamentoItem])
async def agendamentos_hoje(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[AgendamentoItem]:
    try:
        result = await session.execute(
            text("""
                SELECT cod, razao, cliente, sistema, bd, versao,
                       dt_atualiza, ticketupdate, formato, tipo, pacote, useragend, concluido, status
                FROM tbl_linx
                WHERE dt_atualiza = DATE_FORMAT(CURDATE(), '%d/%m/%Y')
                ORDER BY razao
            """)
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [AgendamentoItem(**dict(zip(keys, r))) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/agendamentos/clientes-disponiveis")
async def clientes_disponiveis(
    q: str = "",
    _: Annotated[dict, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db)] = None,
) -> list[dict]:
    try:
        where = "status IN ('6 - ATIVO', '7 - ATIVO VPU', '0 - IMPLANTAÇÃO')"
        params: dict = {}
        if q:
            where += " AND (razao LIKE :q OR cliente LIKE :q)"
            params["q"] = f"%{q}%"
        result = await session.execute(
            text(f"SELECT cod, cliente, razao FROM tbl_linx WHERE {where} ORDER BY razao LIMIT 50"),
            params
        )
        rows = result.fetchall()
        return [{"cod": r[0], "cliente": r[1], "razao": r[2]} for r in rows if r[1]]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/agendamentos", status_code=200)
async def create_agendamento(
    body: AgendamentoCreate,
    current_user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        useragend = (current_user.get("name", body.useragend) or "")[:15]
        formato   = (body.formato or "M")[:1]
        tipo      = (body.tipo or "E")[:1]
        pacote    = (body.pacote or "EVO")[:10]

        # 1. UPDATE tbl_linx
        result = await session.execute(
            text("""
                UPDATE tbl_linx SET
                    dt_atualiza  = :dt_atualiza,
                    ticketupdate = :ticketupdate,
                    concluido    = 0,
                    formato      = :formato,
                    tipo         = :tipo,
                    pacote       = :pacote,
                    useragend    = :useragend
                WHERE cod = :cod
            """),
            {
                "dt_atualiza":  body.dt_atualiza,
                "ticketupdate": body.ticketupdate,
                "formato":      formato,
                "tipo":         tipo,
                "pacote":       pacote,
                "useragend":    useragend,
                "cod":          body.cod,
            }
        )

        # 2. Buscar dados do cliente na tbl_linx
        linx = await session.execute(
            text("SELECT razao, cliente, sistema, versao, bd, status FROM tbl_linx WHERE cod = :cod"),
            {"cod": body.cod}
        )
        row = linx.fetchone()

        if row:
            razao, cliente, sistema, versao, bd, status_linx = row

            # 3. INSERT na tbl_history
            await session.execute(
                text("""
                    INSERT INTO tbl_history
                        (razao, cliente, sistema, versao, data, tipo, pacote, ticket, bd, useragendar, concluido, status)
                    VALUES
                        (:razao, :cliente, :sistema, :versao, :data, :tipo, :pacote, :ticket, :bd, :useragendar, 0, 'AGENDADO')
                """),
                {
                    "razao":       razao or "",
                    "cliente":     cliente or "",
                    "sistema":     sistema or "",
                    "versao":      versao or "",
                    "data":        body.dt_atualiza,
                    "tipo":        tipo,
                    "pacote":      pacote[:3],
                    "ticket":      body.ticketupdate[:10],
                    "bd":          bd or "",
                    "useragendar": useragend.upper(),
                }
            )

        await session.commit()

        # 4. Buscar registros em tbl_linx onde servidor2 = cliente do agendado
        #    e agendar com as mesmas informações
        if row:
            razao, cliente, sistema, versao, bd, status_linx = row
            srv2_result = await session.execute(
                text("SELECT cod, razao, cliente, sistema, versao, bd FROM tbl_linx WHERE servidor2 = :cliente"),
                {"cliente": cliente or ""}
            )
            srv2_rows = srv2_result.fetchall()
            srv2_keys = list(srv2_result.keys())

            for sr in srv2_rows:
                sd = dict(zip(srv2_keys, sr))
                await session.execute(
                    text("""
                        UPDATE tbl_linx SET
                            dt_atualiza  = :dt_atualiza,
                            ticketupdate = :ticketupdate,
                            concluido    = 0,
                            formato      = :formato,
                            tipo         = :tipo,
                            pacote       = :pacote,
                            useragend    = :useragend
                        WHERE cod = :cod
                    """),
                    {
                        "dt_atualiza": body.dt_atualiza, "ticketupdate": body.ticketupdate,
                        "formato": formato, "tipo": tipo, "pacote": pacote,
                        "useragend": useragend, "cod": sd["cod"],
                    }
                )
                await session.execute(
                    text("""
                        INSERT INTO tbl_history
                            (razao, cliente, sistema, versao, data, tipo, pacote, ticket, bd, useragendar, concluido, status)
                        VALUES
                            (:razao, :cliente, :sistema, :versao, :data, :tipo, :pacote, :ticket, :bd, :useragendar, 0, 'AGENDADO')
                    """),
                    {
                        "razao": sd["razao"] or "", "cliente": sd["cliente"] or "",
                        "sistema": sd["sistema"] or "", "versao": sd["versao"] or "",
                        "data": body.dt_atualiza, "tipo": tipo, "pacote": pacote[:3],
                        "ticket": body.ticketupdate[:10], "bd": sd["bd"] or "",
                        "useragendar": useragend.upper(),
                    }
                )
            await session.commit()

        return {"updated": result.rowcount, "cod": body.cod}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/agendamentos/{cod}", status_code=200)
async def cancelar_agendamento(
    cod: int,
    current_user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        # 1. Buscar dados antes de cancelar
        linx = await session.execute(
            text("SELECT cliente, dt_atualiza FROM tbl_linx WHERE cod = :cod"),
            {"cod": cod}
        )
        row = linx.fetchone()

        # 2. UPDATE tbl_linx — zera data e marca concluido=100
        await session.execute(
            text("UPDATE tbl_linx SET dt_atualiza = '00/00/0000', concluido = 100 WHERE cod = :cod"),
            {"cod": cod}
        )

        # 3. DELETE tbl_history pelo cliente e data
        if row:
            cliente, data = row
            await session.execute(
                text("DELETE FROM tbl_history WHERE cliente = :cliente AND data = :data"),
                {"cliente": cliente or "", "data": data or ""}
            )

        await session.commit()
        return {"cancelled": True, "cod": cod}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/agendamentos/{cod}", status_code=200)
async def update_agendamento(
    cod: int,
    body: AgendamentoCreate,
    current_user: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        result = await session.execute(
            text("""
                UPDATE tbl_linx SET
                    dt_atualiza  = :dt_atualiza,
                    ticketupdate = :ticketupdate,
                    concluido    = 0,
                    formato      = :formato,
                    tipo         = :tipo,
                    pacote       = :pacote,
                    useragend    = :useragend
                WHERE cod = :cod
            """),
            {
                "dt_atualiza":  body.dt_atualiza,
                "ticketupdate": body.ticketupdate,
                "formato":      (body.formato or "M")[:1],
                "tipo":         (body.tipo or "E")[:1],
                "pacote":       (body.pacote or "EVO")[:10],
                "useragend":    (current_user.get("name", body.useragend) or "")[:15],
                "cod":          cod,
            }
        )
        await session.commit()
        return {"updated": result.rowcount}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Adiantar Atendimentos ─────────────────────────────────────────────────────

class AdiantarItem(BaseModel):
    cod: int
    cliente: str
    data: str
    analista: str
    ticket_linx: str
    ticket_ccm: str
    descritivo: str | None = None
    status: str
    created_at: str | None = None


class AdiantarCreate(BaseModel):
    cliente: str
    data: str
    analista: str
    ticket_linx: str
    ticket_ccm: str = ""
    descritivo: str = ""
    status: str = "aberto"


class AdiantarUpdate(BaseModel):
    cliente: str | None = None
    data: str | None = None
    analista: str | None = None
    ticket_linx: str | None = None
    ticket_ccm: str | None = None
    descritivo: str | None = None
    status: str | None = None


def row_to_adiantar(row, keys) -> AdiantarItem:
    d = dict(zip(keys, row))
    return AdiantarItem(
        cod=d["cod"], cliente=d["cliente"],
        data=str(d["data"]), analista=d["analista"],
        ticket_linx=d["ticket_linx"], ticket_ccm=d["ticket_ccm"],
        descritivo=d.get("descritivo"),
        status=d["status"],
        created_at=str(d["created_at"]) if d.get("created_at") else None,
    )


@router.get("/adiantar", response_model=list[AdiantarItem])
async def list_adiantar(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[AdiantarItem]:
    try:
        result = await session.execute(
            text("SELECT cod, cliente, data, analista, ticket_linx, ticket_ccm, descritivo, status, created_at FROM tbl_adiantar ORDER BY data DESC, cod DESC")
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [row_to_adiantar(r, keys) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/adiantar", response_model=AdiantarItem, status_code=201)
async def create_adiantar(
    body: AdiantarCreate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdiantarItem:
    try:
        result = await session.execute(
            text("INSERT INTO tbl_adiantar (cliente, data, analista, ticket_linx, ticket_ccm, descritivo, status) VALUES (:cliente, :data, :analista, :ticket_linx, :ticket_ccm, :descritivo, :status)"),
            {"cliente": body.cliente, "data": body.data, "analista": body.analista,
             "ticket_linx": body.ticket_linx, "ticket_ccm": body.ticket_ccm, "descritivo": body.descritivo, "status": body.status}
        )
        await session.commit()
        result2 = await session.execute(
            text("SELECT cod, cliente, data, analista, ticket_linx, ticket_ccm, descritivo, status, created_at FROM tbl_adiantar WHERE cod = :cod"),
            {"cod": result.lastrowid}
        )
        row = result2.fetchone()
        return row_to_adiantar(row, list(result2.keys()))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/adiantar/{cod}", response_model=AdiantarItem)
async def update_adiantar(
    cod: int,
    body: AdiantarUpdate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AdiantarItem:
    try:
        sets, params = [], {"cod": cod}
        if body.cliente    is not None: sets.append("cliente=:cliente");       params["cliente"]    = body.cliente
        if body.data       is not None: sets.append("data=:data");             params["data"]       = body.data
        if body.analista   is not None: sets.append("analista=:analista");     params["analista"]   = body.analista
        if body.ticket_linx is not None: sets.append("ticket_linx=:ticket_linx"); params["ticket_linx"] = body.ticket_linx
        if body.ticket_ccm  is not None: sets.append("ticket_ccm=:ticket_ccm");   params["ticket_ccm"]  = body.ticket_ccm
        if body.descritivo  is not None: sets.append("descritivo=:descritivo");   params["descritivo"]  = body.descritivo
        if body.status      is not None: sets.append("status=:status");         params["status"]     = body.status
        if sets:
            await session.execute(text(f"UPDATE tbl_adiantar SET {', '.join(sets)} WHERE cod = :cod"), params)
            await session.commit()
        result = await session.execute(
            text("SELECT cod, cliente, data, analista, ticket_linx, ticket_ccm, descritivo, status, created_at FROM tbl_adiantar WHERE cod = :cod"),
            {"cod": cod}
        )
        row = result.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Registro não encontrado")
        return row_to_adiantar(row, list(result.keys()))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/clientes/{cod}")
async def update_cliente(
    cod: int,
    body: dict,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        allowed = ["razao", "sistema", "versao", "qtdusers", "serverbd", "status",
                   "contatos", "telefones", "emails", "reg", "local", "grupo",
                   "tipo", "pacote", "dt_atualiza", "versaoat", "franq", "ufmatriz",
                   "integracoes", "infraprod", "infrats", "shape", "ocpu", "mem",
                   "tsplus", "detalhes", "implat", "datastart", "prxcontat", "cnpj", "codigoc",
                   "agtazure", "linxwebver", "bandeira", "bd", "doc", "link1", "link2", "link3"]
        sets, params = [], {"cod": cod}
        for k, v in body.items():
            if k in allowed:
                sets.append(f"{k}=:{k}")
                params[k] = v
        if not sets:
            raise HTTPException(status_code=400, detail="Nada para atualizar")
        await session.execute(
            text(f"UPDATE tbl_linx SET {', '.join(sets)} WHERE cod = :cod"), params
        )
        await session.commit()
        return {"updated": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


class ConsultaItem(BaseModel):
    cod: int
    razao: str | None = None
    sistema: str | None = None
    versao: str | None = None
    linxwebver: str | None = None
    linx2camaut: str | None = None
    linx3camaut: str | None = None
    codigoc: str | None = None
    pacote: str | None = None
    useragend: str | None = None
    dt_atualiza: str | None = None
    concluido: str | int | None = None


@router.get("/consultar-atualizacao", response_model=list[ConsultaItem])
async def list_consultar_atualizacao(
    q: str = "",
    data_filter: str = "",
    _: Annotated[dict, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db)] = None,
) -> list[ConsultaItem]:
    try:
        where = "WHERE 1=1"
        params: dict = {}
        if q:
            where += " AND (razao LIKE :q OR cliente LIKE :q OR sistema LIKE :q)"
            params["q"] = f"%{q}%"
        if data_filter:
            where += " AND dt_atualiza = :data_filter"
            params["data_filter"] = data_filter
        result = await session.execute(
            text(f"SELECT cod, razao, sistema, versao, linxwebver, linx2camaut, linx3camaut, codigoc, pacote, useragend, dt_atualiza, concluido FROM tbl_linx {where} ORDER BY razao"),
            params
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [ConsultaItem(**dict(zip(keys, r))) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/consultar-atualizacao/{cod}/cancelar")
async def cancelar_agendamento_consulta(
    cod: int,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        # Busca dados antes
        r = await session.execute(
            text("SELECT cliente, dt_atualiza FROM tbl_linx WHERE cod = :cod"),
            {"cod": cod}
        )
        row = r.fetchone()

        # UPDATE tbl_linx — zera data e marca concluido=100
        await session.execute(
            text("UPDATE tbl_linx SET dt_atualiza = '00/00/0000', concluido = 100 WHERE cod = :cod"),
            {"cod": cod}
        )

        # DELETE tbl_history
        if row:
            cliente, data = row
            await session.execute(
                text("DELETE FROM tbl_history WHERE cliente = :cliente AND data = :data"),
                {"cliente": cliente or "", "data": data or ""}
            )

        await session.commit()
        return {"cancelled": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── TouchPoints ────────────────────────────────────────────────────────────────

class TouchPointItem(BaseModel):
    cod: int
    cliente: str
    data: str | None = None
    periodo: str | None = None
    hora: str | None = None
    nota_contato: str | None = None
    crm: str | None = None
    status: str
    created_at: str | None = None


class TouchPointCreate(BaseModel):
    cliente: str
    data: str = ""
    periodo: str = ""
    hora: str = ""
    nota_contato: str = ""
    crm: str = ""
    status: str = "Aberto"


class TouchPointUpdate(BaseModel):
    cliente: str | None = None
    data: str | None = None
    periodo: str | None = None
    hora: str | None = None
    nota_contato: str | None = None
    crm: str | None = None
    status: str | None = None


@router.get("/touchpoints", response_model=list[TouchPointItem])
async def list_touchpoints(
    q: str = "",
    _: Annotated[dict, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db)] = None,
) -> list[TouchPointItem]:
    try:
        where = "WHERE 1=1"
        params: dict = {}
        if q:
            where += " AND (cliente LIKE :q OR crm LIKE :q)"
            params["q"] = f"%{q}%"
        result = await session.execute(
            text(f"SELECT cod, cliente, data, periodo, hora, nota_contato, crm, status, created_at FROM tbl_touchpoints {where} ORDER BY created_at DESC"),
            params
        )
        rows = result.fetchall()
        keys = list(result.keys())
        items = []
        for r in rows:
            d = dict(zip(keys, r))
            items.append(TouchPointItem(
                cod=d["cod"], cliente=d["cliente"], data=d.get("data"),
                periodo=d.get("periodo"), hora=d.get("hora"),
                nota_contato=d.get("nota_contato"), crm=d.get("crm"),
                status=d["status"],
                created_at=str(d["created_at"]) if d.get("created_at") else None,
            ))
        return items
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/touchpoints", status_code=status.HTTP_201_CREATED)
async def create_touchpoint(
    body: TouchPointCreate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        result = await session.execute(
            text("INSERT INTO tbl_touchpoints (cliente, data, periodo, hora, nota_contato, crm, status) VALUES (:cliente, :data, :periodo, :hora, :nota_contato, :crm, :status)"),
            {"cliente": body.cliente, "data": body.data, "periodo": body.periodo,
             "hora": body.hora, "nota_contato": body.nota_contato,
             "crm": body.crm, "status": body.status}
        )
        await session.commit()
        return {"created": True, "id": result.lastrowid}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/touchpoints/{cod}")
async def update_touchpoint(
    cod: int,
    body: TouchPointUpdate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        sets, params = [], {"cod": cod}
        if body.cliente      is not None: sets.append("cliente=:cliente");           params["cliente"]      = body.cliente
        if body.data         is not None: sets.append("data=:data");                 params["data"]         = body.data
        if body.periodo      is not None: sets.append("periodo=:periodo");           params["periodo"]      = body.periodo
        if body.hora         is not None: sets.append("hora=:hora");                 params["hora"]         = body.hora
        if body.nota_contato is not None: sets.append("nota_contato=:nota_contato"); params["nota_contato"] = body.nota_contato
        if body.crm          is not None: sets.append("crm=:crm");                   params["crm"]          = body.crm
        if body.status       is not None: sets.append("status=:status");             params["status"]       = body.status
        if not sets:
            raise HTTPException(status_code=400, detail="Nada para atualizar")
        await session.execute(text(f"UPDATE tbl_touchpoints SET {', '.join(sets)} WHERE cod = :cod"), params)
        await session.commit()
        return {"updated": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/touchpoints/{cod}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_touchpoint(
    cod: int,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    try:
        await session.execute(text("DELETE FROM tbl_touchpoints WHERE cod = :cod"), {"cod": cod})
        await session.commit()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
