import re
import unicodedata
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_current_user, get_db
from src.logger import logger

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

# status é varchar: '6 - ATIVO', '7 - ATIVO VPU', '0 - IMPLANTAÇÃO', etc.

@router.get("/clientes-ativos")
async def clientes_ativos(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    # ATIVO + ATIVO VPU + IMPLANTAÇÃO (excluindo X - ATIVO COMPLEMENTO)
    result = await session.execute(
        text("SELECT COUNT(*) FROM tbl_linx WHERE status IN ('6 - ATIVO', '7 - ATIVO VPU', '0 - IMPLANTAÇÃO', '1 - PRIMEIRO CONTATO')")
    )
    row = result.fetchone()
    return {"total": int(row[0]) if row else 0}


@router.get("/clientes-cx")
async def clientes_cx(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    # Apenas ATIVO e ATIVO VPU
    result = await session.execute(
        text("SELECT COUNT(*) FROM tbl_linx WHERE status IN ('6 - ATIVO', '7 - ATIVO VPU', '1 - PRIMEIRO CONTATO')")
    )
    row = result.fetchone()
    return {"total": int(row[0]) if row else 0}


@router.get("/clientes-pmo")
async def clientes_pmo(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    # Apenas IMPLANTAÇÃO
    result = await session.execute(
        text("SELECT COUNT(*) FROM tbl_linx WHERE status = '0 - IMPLANTAÇÃO'")
    )
    row = result.fetchone()
    return {"total": int(row[0]) if row else 0}


@router.get("/clientes-pmo-lista")
async def clientes_pmo_lista(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    result = await session.execute(
        text("SELECT * FROM tbl_linx WHERE status = '0 - IMPLANTAÇÃO' ORDER BY 1 LIMIT 200")
    )
    rows = result.fetchall()
    cols = list(result.keys())
    return {"total": len(rows), "clientes": [dict(zip(cols, r)) for r in rows]}


@router.get("/debug-status")
async def debug_status(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    result = await session.execute(
        text("SELECT status, COUNT(*) as total FROM tbl_linx GROUP BY status ORDER BY total DESC")
    )
    rows = result.fetchall()
    return {"por_status": [{"status": r[0], "total": int(r[1])} for r in rows]}


@router.get("/servidores-ativos")
async def servidores_ativos(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    result = await session.execute(
        text("SELECT COUNT(*) FROM tbl_linx WHERE status IN ('6 - ATIVO', '7 - ATIVO VPU', '0 - IMPLANTAÇÃO', 'X - ATIVO COMPLEMENTO')")
    )
    row = result.fetchone()
    return {"total": int(row[0]) if row else 0}


@router.get("/pendencias-abertas")
async def pendencias_abertas(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    try:
        result = await session.execute(
            text("SELECT COUNT(*) FROM tbl_pendencias WHERE status != 'resolvido'")
        )
        row = result.fetchone()
        return {"total": int(row[0]) if row else 0}
    except Exception:
        return {"total": 0}


@router.get("/pendencias-por-analista")
async def pendencias_por_analista(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    try:
        result = await session.execute(
            text("""
                SELECT analista, COUNT(*) as total
                FROM tbl_pendencias
                WHERE status != 'resolvido'
                  AND analista != ''
                GROUP BY analista
                ORDER BY total DESC
            """)
        )
        rows = result.fetchall()
        return [{"nome": r[0], "valor": int(r[1])} for r in rows]
    except Exception:
        return []


@router.get("/historico-atualizacoes")
async def historico_atualizacoes(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    try:
        result = await session.execute(
            text("""
                SELECT
                    data,
                    SUM(CASE WHEN UPPER(useragendar) = 'AGENTE-IA' THEN 1 ELSE 0 END) as agente_ia,
                    SUM(CASE WHEN UPPER(useragendar) != 'AGENTE-IA' THEN 1 ELSE 0 END) as humano
                FROM tbl_history
                WHERE data IS NOT NULL AND data != '' AND data != '00/00/0000'
                GROUP BY data
                ORDER BY STR_TO_DATE(data, '%d/%m/%Y') DESC
                LIMIT 30
            """)
        )
        rows = result.fetchall()
        # Return in ascending order for chart
        data = [{"data": r[0], "agente_ia": int(r[1]), "humano": int(r[2])} for r in rows]
        return list(reversed(data))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/pendencias-por-status")
async def pendencias_por_status(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    try:
        result = await session.execute(
            text("""
                SELECT status, COUNT(*) as total
                FROM tbl_pendencias
                WHERE status != 'resolvido'
                GROUP BY status
                ORDER BY total DESC
            """)
        )
        rows = result.fetchall()
        return [{"status": r[0] or "sem status", "total": int(r[1])} for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/ausencias-proximas")
async def ausencias_proximas(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    try:
        result = await session.execute(
            text("""
                SELECT e.colaborador, e.tipo, e.data_ini, e.hora_ini, e.data_fim, e.hora_fim,
                       g.area, g.depto, g.almoco
                FROM tbl_escala e
                LEFT JOIN tbl_gcolab g ON g.colab = e.colaborador AND g.status = 'Ativo'
                WHERE (
                    -- Começa nos próximos 7 dias
                    (STR_TO_DATE(e.data_ini, '%d/%m/%Y') >= CURDATE()
                     AND STR_TO_DATE(e.data_ini, '%d/%m/%Y') <= DATE_ADD(CURDATE(), INTERVAL 7 DAY))
                    OR
                    -- Já começou mas ainda não terminou (em andamento)
                    (STR_TO_DATE(e.data_ini, '%d/%m/%Y') <= CURDATE()
                     AND STR_TO_DATE(e.data_fim, '%d/%m/%Y') >= CURDATE())
                )
                ORDER BY STR_TO_DATE(e.data_ini, '%d/%m/%Y') ASC, e.hora_ini ASC
            """)
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [dict(zip(keys, r)) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/atividades-hoje")
async def atividades_hoje(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    try:
        result = await session.execute(
            text(
                "SELECT analista, cliente, ticketproj, atividade, tipoatividade, horainicio, horafim, duracao, status "
                "FROM tbl_atividades "
                "WHERE data = CURDATE() "
                "ORDER BY analista ASC, horainicio ASC"
            )
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [dict(zip(keys, r)) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/bh-colaboradores")
async def bh_colaboradores(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    try:
        result = await session.execute(
            text("SELECT colab, bh FROM tbl_gcolab WHERE status = 'Ativo' AND bh != '' ORDER BY colab ASC")
        )
        rows = result.fetchall()
        keys = list(result.keys())
        return [dict(zip(keys, r)) for r in rows]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Atendimentos WhatsApp (tbl_whatsqtd: cor, descricao, qtd) ───────────────

DEFAULT_ATENDIMENTO_COLOR = "#C3C3C3"
_HEX_COLOR_RE = re.compile(r"^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$")
_FUNC_COLOR_RE = re.compile(r"^(rgb|rgba|hsl|hsla)\(\s*[0-9.,%\s/-]+\)$", re.IGNORECASE)
_NAMED_COLOR_RE = re.compile(r"^[a-z]{3,20}$")

# Portuguese color names (as typed in the table) -> CSS color.
PT_COLOR_NAMES: dict[str, str] = {
    "verde": "#1DB954",
    "verdeescuro": "#0E7E3B",
    "verdeclaro": "#7ED957",
    "vermelho": "#E74C3C",
    "vermelhoescuro": "#9B2020",
    "azul": "#204294",
    "azulclaro": "#00B0EA",
    "azulescuro": "#0C1921",
    "ciano": "#00B0EA",
    "amarelo": "#F9E000",
    "laranja": "#F9A825",
    "roxo": "#7F77DD",
    "lilas": "#B39DDB",
    "rosa": "#E91E63",
    "marrom": "#795548",
    "cinza": "#9E9E9E",
    "cinzaclaro": "#C3C3C3",
    "cinzaescuro": "#4A4A4A",
    "preto": "#000000",
    "branco": "#FFFFFF",
}

# CSS named colors accepted as-is (subset; unknown names fall back to gray).
CSS_COLOR_NAMES = frozenset({
    "black", "white", "gray", "grey", "silver", "red", "maroon", "orange", "gold", "yellow",
    "olive", "lime", "green", "darkgreen", "teal", "aqua", "cyan", "blue", "navy", "darkblue",
    "lightblue", "skyblue", "purple", "violet", "magenta", "fuchsia", "pink", "brown",
    "darkred", "darkorange", "orangered", "tomato", "crimson", "indigo", "turquoise",
    "lightgreen", "lightgray", "lightgrey", "darkgray", "darkgrey", "coral", "salmon",
})


class AtendimentoOut(BaseModel):
    cor: str
    descricao: str
    qtd: int


def _strip_accents(value: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", value) if unicodedata.category(c) != "Mn")


def normalize_color(raw: str | None) -> str:
    """Accepts hex (with/without '#'), rgb()/hsl(), CSS names or Portuguese names; else gray."""
    value = (raw or "").strip()
    if not value:
        return DEFAULT_ATENDIMENTO_COLOR
    if _HEX_COLOR_RE.match(value):
        return value if value.startswith("#") else f"#{value}"
    if _FUNC_COLOR_RE.match(value):
        return value.lower()
    key = re.sub(r"[\s_-]+", "", _strip_accents(value).lower())
    if key in PT_COLOR_NAMES:
        return PT_COLOR_NAMES[key]
    if _NAMED_COLOR_RE.match(key) and key in CSS_COLOR_NAMES:
        return key
    logger.warning("atendimento_color_unrecognized", value=value)
    return DEFAULT_ATENDIMENTO_COLOR


def parse_qtd(raw: object) -> int:
    """Converts the qtd column (INT or VARCHAR like '1.234') to int; invalid values become 0."""
    if raw is None:
        return 0
    if isinstance(raw, (int, float)):
        return int(raw)
    digits = re.sub(r"[^0-9-]", "", str(raw))
    try:
        return int(digits) if digits not in ("", "-") else 0
    except ValueError:
        return 0


@router.get("/atendimentos-whatsapp", response_model=list[AtendimentoOut])
async def atendimentos_whatsapp(
    _: Annotated[dict, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[AtendimentoOut]:
    try:
        result = await session.execute(text("SELECT cor, descricao, qtd FROM tbl_whatsqtd"))
        rows = result.fetchall()
    except Exception as exc:
        logger.error("atendimentos_whatsapp_failed", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to load WhatsApp attendances")
    return [
        AtendimentoOut(cor=normalize_color(r[0]), descricao=(r[1] or "").strip(), qtd=parse_qtd(r[2]))
        for r in rows
    ]
