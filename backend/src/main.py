import sys
import asyncio
import smtplib
import os
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routers import auth, user, dashboard, pendencias, cx, pmo, gestao, operacoes
from src.config import settings
from src.logger import logger

REQUIRED = ["db_host", "db_user", "db_password", "db_name", "jwt_secret"]
for field in REQUIRED:
    if not getattr(settings, field, None):
        logger.critical("missing_required_env", field=field)
        sys.exit(1)

app = FastAPI(title="CCM App API", version="1.0.0",
              docs_url="/api/docs", redoc_url="/api/redoc", openapi_url="/api/openapi.json")

app.add_middleware(CORSMiddleware,
    allow_origins=[settings.frontend_url], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(dashboard.router)
app.include_router(pendencias.router)
app.include_router(cx.router)
app.include_router(pmo.router)
app.include_router(gestao.router)
app.include_router(operacoes.router)

@app.get("/health", tags=["infra"])
async def health() -> dict:
    return {"status": "ok"}


async def email_monitor_job():
    from sqlalchemy import text
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
    from src.config import settings as cfg
    from urllib.parse import quote_plus

    DB_URL = (
        "mysql+asyncmy://" + quote_plus(cfg.db_user) + ":" + quote_plus(cfg.db_password) +
        "@" + cfg.db_host + "/" + cfg.db_name
    )
    engine  = create_async_engine(DB_URL, pool_pre_ping=True)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    smtp_host     = os.getenv("SMTP_HOST", "smtp.email.sa-saopaulo-1.oci.oraclecloud.com")
    smtp_port     = int(os.getenv("SMTP_PORT", "587"))
    smtp_user_auth = os.getenv("SMTP_USER_AUTH", "ocid1.user.oc1..aaaaaaaapibjeei63pvrj244kxlawj2vyqp76itpizkhlz5hgtlbckako4oq@ocid1.tenancy.oc1..aaaaaaaaliaokqoju4gjop3sm5al25e3kijzd4dlvhhalywpbxe4q47oleuq.uo.com")
    smtp_pass     = os.getenv("SMTP_PASS") or "vsxDgp-j7Q4KuS:p-n6&"
    smtp_from     = os.getenv("SMTP_USER", "scripts@ccmtecnologia.com.br")
    cc_email      = "ccm.atualiza@gmail.com"

    while True:
        try:
            async with Session() as session:
                # Reserva atomicamente os registros elegíveis (UPDATE + SELECT)
                # Isso evita duplo envio em caso de execuções simultâneas
                await session.execute(
                    text(
                        "UPDATE tbl_linx SET email_enviado = 9 "
                        "WHERE dt_atualiza = DATE_FORMAT(CURDATE(), '%d/%m/%Y') "
                        "AND (TRIM(CAST(concluido AS CHAR)) = '100' OR concluido = 100) "
                        "AND (email_enviado = 0 OR email_enviado IS NULL) "
                        "AND pacote IN ('EVO','ESS','ESP')"
                    )
                )
                await session.commit()

                # Busca somente os que foram reservados agora (email_enviado = 9)
                result = await session.execute(
                    text(
                        "SELECT cod, razao, cliente, pacote, dt_atualiza, emails, link1, link2, link3, status "
                        "FROM tbl_linx "
                        "WHERE dt_atualiza = DATE_FORMAT(CURDATE(), '%d/%m/%Y') "
                        "AND email_enviado = 9"
                    )
                )
                rows  = result.fetchall()
                keys  = list(result.keys())

                for row in rows:
                    d          = dict(zip(keys, row))
                    cod        = d["cod"]
                    razao      = d["razao"] or d["cliente"] or ""
                    pacote_raw = d["pacote"] or "EVO"
                    dt_atual   = d["dt_atualiza"] or datetime.now().strftime("%d/%m/%Y")
                    emails     = d["emails"] or ""
                    # Normaliza: se for 'null', 'NULL' ou vazio, trata como sem email
                    if emails.strip().lower() in ("null", "none", ""):
                        emails = ""
                    link1      = d["link1"] or ""
                    link2      = d["link2"] or ""
                    link3      = d["link3"] or ""
                    status_cli = d["status"] or ""

                    pacote_map   = {"EVO": "Evolutivo", "ESS": "Essencial", "ESP": "Especifico"}
                    pacote_final = pacote_map.get(pacote_raw, pacote_raw)

                    status_val = 2  # erro por padrao

                    if status_cli.strip() != "6 - ATIVO":
                        pass  # nao envia, status incorreto
                    elif not emails.strip():
                        pass  # nao envia, sem email
                    else:
                        linha1     = "Link para download dos arquivos clients, Pacote " + pacote_final + " - Executado no dia - " + dt_atual
                        subject    = "Atualizacao " + razao + " Concluida"

                        links_text = ""
                        links_html = ""
                        for lnk in [link1, link2, link3]:
                            if lnk:
                                links_text += chr(10) + lnk
                                links_html += "<p><a href='" + lnk + "'>" + lnk + "</a></p>"

                        body_text = linha1 + chr(10) + links_text
                        body_html = "<p>" + linha1 + "</p>" + links_html

                        msg = MIMEMultipart("alternative")
                        msg["Subject"] = subject
                        msg["From"]    = smtp_from
                        msg["To"]      = emails
                        msg["Cc"]      = cc_email
                        msg.attach(MIMEText(body_text, "plain"))
                        msg.attach(MIMEText(body_html, "html"))

                        destinatarios = [e.strip() for e in emails.split(",") if e.strip()]
                        destinatarios.append(cc_email)

                        try:
                            server = smtplib.SMTP(smtp_host, smtp_port, timeout=15)
                            server.ehlo()
                            server.starttls()
                            server.ehlo()
                            server.login(smtp_user_auth, smtp_pass)
                            try:
                                server.sendmail(smtp_from, destinatarios, msg.as_string())
                            except smtplib.SMTPRecipientsRefused:
                                pass
                            try:
                                server.quit()
                            except Exception:
                                pass
                            status_val = 1
                        except Exception:
                            pass

                    await session.execute(
                        text("UPDATE tbl_linx SET email_enviado = :val WHERE cod = :cod"),
                        {"val": status_val, "cod": cod}
                    )
                    await session.commit()

        except Exception:
            pass

        await asyncio.sleep(20)


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(email_monitor_job())
