from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user, get_db

router = APIRouter(prefix="/api/gestao", tags=["gestao"])


class LinkItem(BaseModel):
    cod: int
    acesso: str | None = None
    grupo: str | None = None
    link: str | None = None


class LinkCreate(BaseModel):
    acesso: str
    grupo: str | None = None
    link: str


class LinkUpdate(BaseModel):
    acesso: str | None = None
    grupo: str | None = None
    link: str | None = None


@router.get("/links", response_model=list[LinkItem])
async def list_links(
    q: str = "",
    _: Annotated[dict, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db)] = None,
) -> list[LinkItem]:
    try:
        params: dict = {}
        where = "WHERE 1=1"
        if q:
            where += " AND (acesso LIKE :q OR grupo LIKE :q OR link LIKE :q)"
            params["q"] = f"%{q}%"
        result = await session.execute(
            text(f"SELECT cod, acesso, grupo, link FROM tbl_gacess {where} ORDER BY grupo, acesso"),
            params
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [LinkItem(**dict(zip(keys, r))) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/links", status_code=status.HTTP_201_CREATED)
async def create_link(
    body: LinkCreate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        result = await session.execute(
            text("INSERT INTO tbl_gacess (acesso, grupo, link) VALUES (:acesso, :grupo, :link)"),
            {"acesso": body.acesso, "grupo": body.grupo or "", "link": body.link}
        )
        await session.commit()
        return {"created": True, "id": result.lastrowid}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/links/{cod}")
async def update_link(
    cod: int,
    body: LinkUpdate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        sets, params = [], {"cod": cod}
        if body.acesso is not None: sets.append("acesso=:acesso"); params["acesso"] = body.acesso
        if body.grupo  is not None: sets.append("grupo=:grupo");   params["grupo"]  = body.grupo
        if body.link   is not None: sets.append("link=:link");     params["link"]   = body.link
        if not sets:
            raise HTTPException(status_code=400, detail="Nada para atualizar")
        await session.execute(text(f"UPDATE tbl_gacess SET {', '.join(sets)} WHERE cod = :cod"), params)
        await session.commit()
        return {"updated": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/links/{cod}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_link(
    cod: int,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    try:
        await session.execute(text("DELETE FROM tbl_gacess WHERE cod = :cod"), {"cod": cod})
        await session.commit()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Resultados ──────────────────────────────────────────────────────────────

class ResultadoItem(BaseModel):
    cod: int
    resultado: str
    link: str | None = None
    data_cadastro: str | None = None
    status: str


class ResultadoCreate(BaseModel):
    resultado: str
    link: str | None = None
    status: str = "Ativo"


class ResultadoUpdate(BaseModel):
    resultado: str | None = None
    link: str | None = None
    status: str | None = None


@router.get("/resultados", response_model=list[ResultadoItem])
async def list_resultados(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[ResultadoItem]:
    try:
        result = await session.execute(
            text("SELECT cod, resultado, link, data_cadastro, status FROM tbl_resultados ORDER BY data_cadastro DESC")
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [ResultadoItem(**{k: (str(v) if k == 'data_cadastro' and v else v) for k, v in dict(zip(keys, r)).items()}) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/resultados", status_code=status.HTTP_201_CREATED)
async def create_resultado(
    body: ResultadoCreate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        result = await session.execute(
            text("INSERT INTO tbl_resultados (resultado, link, status) VALUES (:resultado, :link, :status)"),
            {"resultado": body.resultado, "link": body.link or "", "status": body.status}
        )
        await session.commit()
        return {"created": True, "id": result.lastrowid}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/resultados/{cod}")
async def update_resultado(
    cod: int,
    body: ResultadoUpdate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        sets, params = [], {"cod": cod}
        if body.resultado is not None: sets.append("resultado=:resultado"); params["resultado"] = body.resultado
        if body.link      is not None: sets.append("link=:link");           params["link"]      = body.link
        if body.status    is not None: sets.append("status=:status");       params["status"]    = body.status
        if not sets:
            raise HTTPException(status_code=400, detail="Nada para atualizar")
        await session.execute(text(f"UPDATE tbl_resultados SET {', '.join(sets)} WHERE cod = :cod"), params)
        await session.commit()
        return {"updated": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/resultados/{cod}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resultado(
    cod: int,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    try:
        await session.execute(text("DELETE FROM tbl_resultados WHERE cod = :cod"), {"cod": cod})
        await session.commit()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Smartbooks ────────────────────────────────────────────────────────────────

class SmartbookItem(BaseModel):
    cod: int
    colaborador: str
    trilha: str
    link: str | None = None
    qtdcursos: int
    cursosfeitos: int
    concluido: str
    created_at: str | None = None


class SmartbookCreate(BaseModel):
    colaborador: str
    trilha: str
    link: str = ""
    qtdcursos: int = 0
    cursosfeitos: int = 0
    concluido: str = "Nao"


class SmartbookUpdate(BaseModel):
    colaborador: str | None = None
    trilha: str | None = None
    link: str | None = None
    qtdcursos: int | None = None
    cursosfeitos: int | None = None
    concluido: str | None = None


@router.get("/smartbooks", response_model=list[SmartbookItem])
async def list_smartbooks(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[SmartbookItem]:
    try:
        result = await session.execute(
            text("SELECT cod, colaborador, trilha, link, qtdcursos, cursosfeitos, concluido, created_at FROM tbl_smartbook ORDER BY colaborador ASC, trilha ASC")
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [SmartbookItem(**{k: (str(v) if k == "created_at" and v else v) for k, v in dict(zip(keys, r)).items()}) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/smartbooks", status_code=status.HTTP_201_CREATED)
async def create_smartbook(
    body: SmartbookCreate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        result = await session.execute(
            text("INSERT INTO tbl_smartbook (colaborador, trilha, link, qtdcursos, cursosfeitos, concluido) VALUES (:colaborador, :trilha, :link, :qtdcursos, :cursosfeitos, :concluido)"),
            {"colaborador": body.colaborador, "trilha": body.trilha, "link": body.link,
             "qtdcursos": body.qtdcursos, "cursosfeitos": body.cursosfeitos, "concluido": body.concluido}
        )
        await session.commit()
        return {"created": True, "id": result.lastrowid}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/smartbooks/{cod}")
async def update_smartbook(
    cod: int,
    body: SmartbookUpdate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        sets, params = [], {"cod": cod}
        if body.colaborador  is not None: sets.append("colaborador=:colaborador");   params["colaborador"]  = body.colaborador
        if body.trilha       is not None: sets.append("trilha=:trilha");             params["trilha"]       = body.trilha
        if body.link         is not None: sets.append("link=:link");                 params["link"]         = body.link
        if body.qtdcursos    is not None: sets.append("qtdcursos=:qtdcursos");       params["qtdcursos"]    = body.qtdcursos
        if body.cursosfeitos is not None: sets.append("cursosfeitos=:cursosfeitos"); params["cursosfeitos"] = body.cursosfeitos
        if body.concluido    is not None: sets.append("concluido=:concluido");       params["concluido"]    = body.concluido
        if not sets:
            raise HTTPException(status_code=400, detail="Nada para atualizar")
        await session.execute(text(f"UPDATE tbl_smartbook SET {', '.join(sets)} WHERE cod = :cod"), params)
        await session.commit()
        return {"updated": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/smartbooks/{cod}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_smartbook(
    cod: int,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    try:
        await session.execute(text("DELETE FROM tbl_smartbook WHERE cod = :cod"), {"cod": cod})
        await session.commit()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── BI Stats ──────────────────────────────────────────────────────────────────

@router.get("/bi/vpu-users")
async def bi_vpu_users(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    try:
        result = await session.execute(
            text(
                "SELECT razao, COALESCE(qtdusers,0) as qtdusers FROM tbl_linx "
                "WHERE status IN ('6 - ATIVO','7 - ATIVO VPU','0 - IMPLANTAÇÃO','1 - PRIMEIRO CONTATO') AND qtdusers > 0 "
                "ORDER BY qtdusers DESC LIMIT 25"
            )
        )
        rows = result.fetchall()
        return [{"razao": r[0] or "", "qtdusers": int(r[1])} for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/bi/grupos-atualizacao")
async def bi_grupos_atualizacao(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    try:
        result = await session.execute(
            text(
                "SELECT COALESCE(NULLIF(TRIM(grupo),''), 'SEM GRUPO') as grupo, COUNT(*) as total "
                "FROM tbl_linx WHERE status IN ('6 - ATIVO','1 - PRIMEIRO CONTATO') "
                "GROUP BY grupo ORDER BY total DESC"
            )
        )
        rows = result.fetchall()
        return [{"grupo": r[0] or "SEM GRUPO", "total": int(r[1])} for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/bi/sistemas")
async def bi_sistemas(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    try:
        result = await session.execute(
            text(
                "SELECT COALESCE(NULLIF(TRIM(sistema),''), 'SEM SISTEMA') as sistema, COUNT(*) as total "
                "FROM tbl_linx WHERE status IN ('6 - ATIVO','7 - ATIVO VPU','0 - IMPLANTAÇÃO') "
                "GROUP BY sistema ORDER BY total DESC"
            )
        )
        rows = result.fetchall()
        return [{"sistema": r[0] or "SEM SISTEMA", "total": int(r[1])} for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/bi/atualizacoes")
async def bi_atualizacoes(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    try:
        result = await session.execute(
            text(
                "SELECT data, COUNT(*) as total FROM tbl_history "
                "WHERE data IS NOT NULL AND data != '' "
                "GROUP BY data ORDER BY STR_TO_DATE(data, '%d/%m/%Y') DESC LIMIT 30"
            )
        )
        rows = result.fetchall()
        items = [{"data": r[0], "total": int(r[1])} for r in rows]
        items.reverse()
        return items
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/bi/faixas-users")
async def bi_faixas_users(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    try:
        result = await session.execute(
            text(
                "SELECT "
                "  SUM(CASE WHEN qtdusers BETWEEN 1   AND 5    THEN 1 ELSE 0 END) as f1_5, "
                "  SUM(CASE WHEN qtdusers BETWEEN 6   AND 15   THEN 1 ELSE 0 END) as f6_15, "
                "  SUM(CASE WHEN qtdusers BETWEEN 16  AND 30   THEN 1 ELSE 0 END) as f16_30, "
                "  SUM(CASE WHEN qtdusers BETWEEN 31  AND 50   THEN 1 ELSE 0 END) as f31_50, "
                "  SUM(CASE WHEN qtdusers BETWEEN 51  AND 100  THEN 1 ELSE 0 END) as f51_100, "
                "  SUM(CASE WHEN qtdusers BETWEEN 101 AND 300  THEN 1 ELSE 0 END) as f101_300, "
                "  SUM(CASE WHEN qtdusers BETWEEN 301 AND 1200 THEN 1 ELSE 0 END) as f301_1200 "
                "FROM tbl_linx WHERE status IN ('6 - ATIVO','7 - ATIVO VPU','0 - IMPLANTAÇÃO','1 - PRIMEIRO CONTATO') AND qtdusers > 0"
            )
        )
        row = result.fetchone()
        return [
            {"faixa": "01 - 05",    "total": int(row[0] or 0)},
            {"faixa": "06 - 15",    "total": int(row[1] or 0)},
            {"faixa": "16 - 30",    "total": int(row[2] or 0)},
            {"faixa": "31 - 50",    "total": int(row[3] or 0)},
            {"faixa": "51 - 100",   "total": int(row[4] or 0)},
            {"faixa": "101 - 300",  "total": int(row[5] or 0)},
            {"faixa": "301 - 1200", "total": int(row[6] or 0)},
        ]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/bi/stats")
async def bi_stats(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        result = await session.execute(
            text(
                "SELECT COALESCE(SUM(CASE WHEN status IN ('6 - ATIVO','7 - ATIVO VPU','0 - IMPLANTAÇÃO','1 - PRIMEIRO CONTATO') THEN qtdusers ELSE 0 END),0) as total_users,"
                " SUM(CASE WHEN bd='ORACLE' AND status IN ('6 - ATIVO','7 - ATIVO VPU','0 - IMPLANTAÇÃO','1 - PRIMEIRO CONTATO') THEN 1 ELSE 0 END) as oracle_count,"
                " SUM(CASE WHEN bd='SQLSERVER' AND status IN ('6 - ATIVO','7 - ATIVO VPU','0 - IMPLANTAÇÃO','1 - PRIMEIRO CONTATO') THEN 1 ELSE 0 END) as sqlserver_count,"
                " SUM(CASE WHEN status = '7 - ATIVO VPU' THEN 1 ELSE 0 END) as ccm_vpu,"
                " SUM(CASE WHEN status IN ('6 - ATIVO','0 - IMPLANTAÇÃO','1 - PRIMEIRO CONTATO') THEN 1 ELSE 0 END) as linx_ativo,"
                " SUM(CASE WHEN status IN ('6 - ATIVO','7 - ATIVO VPU','0 - IMPLANTAÇÃO','1 - PRIMEIRO CONTATO') THEN 1 ELSE 0 END) as ativos_total,"
                " SUM(CASE WHEN status='9 - INATIVO' THEN 1 ELSE 0 END) as cancelados"
                " FROM tbl_linx"
            )
        )
        row = result.fetchone()
        total_users = int(row[0]) if row and row[0] else 0
        oracle_count = int(row[1]) if row and row[1] else 0
        sqlserver_count = int(row[2]) if row and row[2] else 0
        ccm_vpu = int(row[3]) if row and row[3] else 0
        linx_ativo = int(row[4]) if row and row[4] else 0
        ativos_total = int(row[5]) if row and row[5] else 0
        cancelados = int(row[6]) if row and row[6] else 0
        return {"total_users": total_users, "oracle_count": oracle_count, "sqlserver_count": sqlserver_count, "ccm_vpu": ccm_vpu, "linx_ativo": linx_ativo, "ativos_total": ativos_total, "cancelados": cancelados}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Caminho BD ────────────────────────────────────────────────────────────────

@router.get("/caminho-bd/status")
async def get_caminho_bd_status(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        result = await session.execute(
            text("SELECT caminhobd, databd FROM tbl_auto LIMIT 1")
        )
        row = result.fetchone()
        if not row:
            return {"caminhobd": "N", "databd": ""}
        return {"caminhobd": row[0] or "N", "databd": row[1] or ""}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


class CaminhoBdBody(BaseModel):
    valor: str  # "S" ou "N"


@router.put("/caminho-bd/update")
async def update_caminho_bd(
    body: CaminhoBdBody,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        from datetime import date
        databd = date.today().strftime("%d/%m/%Y")
        await session.execute(
            text("UPDATE tbl_auto SET caminhobd = :caminhobd, databd = :databd"),
            {"caminhobd": body.valor, "databd": databd}
        )
        await session.commit()
        return {"updated": True, "caminhobd": body.valor, "databd": databd}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Caminho Updates ────────────────────────────────────────────────────────────

@router.get("/caminho-updates/status")
async def get_caminho_updates_status(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        result = await session.execute(
            text("SELECT caminhoup, dataup FROM tbl_auto LIMIT 1")
        )
        row = result.fetchone()
        if not row:
            return {"caminhoup": "N", "dataup": ""}
        return {"caminhoup": row[0] or "N", "dataup": row[1] or ""}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/caminho-updates/update")
async def update_caminho_updates(
    body: CaminhoBdBody,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        from datetime import date
        dataup = date.today().strftime("%d/%m/%Y")
        await session.execute(
            text("UPDATE tbl_auto SET caminhoup = :caminhoup, dataup = :dataup"),
            {"caminhoup": body.valor, "dataup": dataup}
        )
        await session.commit()
        return {"updated": True, "caminhoup": body.valor, "dataup": dataup}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Caminho APP ────────────────────────────────────────────────────────────────

@router.get("/caminho-app/status")
async def get_caminho_app_status(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        result = await session.execute(
            text("SELECT caminhoapp, dataapp FROM tbl_auto LIMIT 1")
        )
        row = result.fetchone()
        if not row:
            return {"caminhoapp": "N", "dataapp": ""}
        return {"caminhoapp": row[0] or "N", "dataapp": row[1] or ""}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/caminho-app/update")
async def update_caminho_app(
    body: CaminhoBdBody,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        from datetime import date
        dataapp = date.today().strftime("%d/%m/%Y")
        await session.execute(
            text("UPDATE tbl_auto SET caminhoapp = :caminhoapp, dataapp = :dataapp"),
            {"caminhoapp": body.valor, "dataapp": dataapp}
        )
        await session.commit()
        return {"updated": True, "caminhoapp": body.valor, "dataapp": dataapp}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Colaboradores ─────────────────────────────────────────────────────────────

class ColaboradorItem(BaseModel):
    cod: int
    colab: str | None = None
    area: str | None = None
    nivel: str | None = None
    depto: str | None = None
    dt_admissao: str | None = None
    prx_calferias1: str | None = None
    prx_calferias2: str | None = None
    prx_calferias3: str | None = None
    prx_anoref: str | None = None
    horario: str | None = None
    almoco: str | None = None
    almocof: str | None = None
    horariof: str | None = None
    bh: str | None = None
    userr: str | None = None
    email: str | None = None
    saidaemp: str | None = None
    status: str | None = None


class ColaboradorCreate(BaseModel):
    colab: str
    area: str = ""
    nivel: str = ""
    depto: str = ""
    dt_admissao: str = ""
    prx_calferias1: str = ""
    prx_calferias2: str = ""
    prx_calferias3: str = ""
    prx_anoref: str = ""
    horario: str = ""
    almoco: str = ""
    almocof: str = ""
    horariof: str = ""
    bh: str = ""
    userr: str = ""
    email: str = ""
    saidaemp: str = ""
    status: str = "Ativo"


class ColaboradorUpdate(BaseModel):
    colab: str | None = None
    area: str | None = None
    nivel: str | None = None
    depto: str | None = None
    dt_admissao: str | None = None
    prx_calferias1: str | None = None
    prx_calferias2: str | None = None
    prx_calferias3: str | None = None
    prx_anoref: str | None = None
    horario: str | None = None
    almoco: str | None = None
    almocof: str | None = None
    horariof: str | None = None
    bh: str | None = None
    userr: str | None = None
    email: str | None = None
    saidaemp: str | None = None
    status: str | None = None


@router.get("/colaboradores", response_model=list[ColaboradorItem])
async def list_colaboradores(
    q: str = "",
    status_filter: str = "",
    _: Annotated[dict, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db)] = None,
) -> list[ColaboradorItem]:
    try:
        where = "WHERE 1=1"
        params: dict = {}
        if q:
            where += " AND (colab LIKE :q OR area LIKE :q OR depto LIKE :q)"
            params["q"] = f"%{q}%"
        if status_filter:
            where += " AND status = :status_filter"
            params["status_filter"] = status_filter
        result = await session.execute(
            text(f"SELECT cod, colab, area, nivel, depto, dt_admissao, prx_calferias1, prx_calferias2, prx_calferias3, prx_anoref, horario, almoco, almocof, horariof, bh, userr, email, saidaemp, status FROM tbl_gcolab {where} ORDER BY colab ASC"),
            params
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [ColaboradorItem(**dict(zip(keys, r))) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/colaboradores", status_code=status.HTTP_201_CREATED)
async def create_colaborador(
    body: ColaboradorCreate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        result = await session.execute(
            text("""INSERT INTO tbl_gcolab (colab, area, nivel, depto, dt_admissao, prx_calferias1, prx_calferias2, prx_calferias3, prx_anoref,
                 horario, almoco, almocof, horariof, bh, userr, email, saidaemp, status)
                 VALUES (:colab, :area, :nivel, :depto, :dt_admissao, :prx_calferias1, :prx_calferias2, :prx_calferias3, :prx_anoref,
                 :horario, :almoco, :almocof, :horariof, :bh, :userr, :email, :saidaemp, :status)"""),
            {"colab": body.colab, "area": body.area, "nivel": body.nivel, "depto": body.depto,
             "dt_admissao": body.dt_admissao, "nivel": body.nivel, "prx_calferias1": body.prx_calferias1, "prx_calferias2": body.prx_calferias2, "prx_calferias3": body.prx_calferias3,
             "prx_anoref": body.prx_anoref, "horario": body.horario,
             "almoco": body.almoco, "almocof": body.almocof, "horariof": body.horariof,
             "userr": body.userr, "email": body.email, "bh": body.bh, "saidaemp": body.saidaemp, "status": body.status}
        )
        await session.commit()
        return {"created": True, "id": result.lastrowid}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/colaboradores/{cod}")
async def update_colaborador(
    cod: int,
    body: ColaboradorUpdate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        sets, params = [], {"cod": cod}
        fields = ["colab","area","nivel","depto","dt_admissao","prx_calferias1","prx_calferias2","prx_calferias3","prx_anoref",
                  "horario","almoco","almocof","horariof","bh","userr","email","saidaemp","status"]
        for f in fields:
            v = getattr(body, f)
            if v is not None:
                sets.append(f"{f}=:{f}")
                params[f] = v
        if not sets:
            raise HTTPException(status_code=400, detail="Nada para atualizar")
        await session.execute(text(f"UPDATE tbl_gcolab SET {', '.join(sets)} WHERE cod = :cod"), params)
        await session.commit()
        return {"updated": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Ausências (tbl_escala) ────────────────────────────────────────────────────

class AusenciaItem(BaseModel):
    cod: int
    colaborador: str | None = None
    tipo: str | None = None
    data_ini: str | None = None
    hora_ini: str | None = None
    data_fim: str | None = None
    hora_fim: str | None = None


class AusenciaCreate(BaseModel):
    colaborador: str
    tipo: str = ""
    data_ini: str = ""
    hora_ini: str = ""
    data_fim: str = ""
    hora_fim: str = ""


class AusenciaUpdate(BaseModel):
    colaborador: str | None = None
    tipo: str | None = None
    data_ini: str | None = None
    hora_ini: str | None = None
    data_fim: str | None = None
    hora_fim: str | None = None


@router.get("/ausencias", response_model=list[AusenciaItem])
async def list_ausencias(
    q: str = "",
    _: Annotated[dict, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db)] = None,
) -> list[AusenciaItem]:
    try:
        where = "WHERE 1=1"
        params: dict = {}
        if q:
            where += " AND (colaborador LIKE :q OR tipo LIKE :q)"
            params["q"] = f"%{q}%"
        result = await session.execute(
            text(f"SELECT cod, colaborador, tipo, data_ini, hora_ini, data_fim, hora_fim FROM tbl_escala {where} ORDER BY STR_TO_DATE(data_ini, '%d/%m/%Y') ASC, hora_ini ASC"),
            params
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [AusenciaItem(**dict(zip(keys, r))) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/ausencias", status_code=status.HTTP_201_CREATED)
async def create_ausencia(
    body: AusenciaCreate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        result = await session.execute(
            text("INSERT INTO tbl_escala (colaborador, tipo, data_ini, hora_ini, data_fim, hora_fim) VALUES (:colaborador, :tipo, :data_ini, :hora_ini, :data_fim, :hora_fim)"),
            {"colaborador": body.colaborador, "tipo": body.tipo, "data_ini": body.data_ini, "hora_ini": body.hora_ini, "data_fim": body.data_fim, "hora_fim": body.hora_fim}
        )
        await session.commit()
        return {"created": True, "id": result.lastrowid}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/ausencias/{cod}")
async def update_ausencia(
    cod: int,
    body: AusenciaUpdate,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        sets, params = [], {"cod": cod}
        if body.colaborador is not None: sets.append("colaborador=:colaborador"); params["colaborador"] = body.colaborador
        if body.tipo        is not None: sets.append("tipo=:tipo");               params["tipo"]        = body.tipo
        if body.data_ini   is not None: sets.append("data_ini=:data_ini");       params["data_ini"]    = body.data_ini
        if body.hora_ini   is not None: sets.append("hora_ini=:hora_ini");       params["hora_ini"]    = body.hora_ini
        if body.data_fim   is not None: sets.append("data_fim=:data_fim");       params["data_fim"]    = body.data_fim
        if body.hora_fim   is not None: sets.append("hora_fim=:hora_fim");       params["hora_fim"]    = body.hora_fim
        if not sets:
            raise HTTPException(status_code=400, detail="Nada para atualizar")
        await session.execute(text(f"UPDATE tbl_escala SET {', '.join(sets)} WHERE cod = :cod"), params)
        await session.commit()
        return {"updated": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/ausencias/{cod}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ausencia(
    cod: int,
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    try:
        await session.execute(text("DELETE FROM tbl_escala WHERE cod = :cod"), {"cod": cod})
        await session.commit()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
