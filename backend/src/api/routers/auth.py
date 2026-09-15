import random
import smtplib
import os
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.auth import get_repository, get_db
from src.application.use_cases.login_user import LoginUser
from src.infrastructure.db.user_repository import SQLUserRepository
from src.logger import logger

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    avatar_url: str | None = None


class LoginResponse(BaseModel):
    token: str
    user: UserOut


class LoginStep1Response(BaseModel):
    requires_2fa: bool
    two_fa_token: str | None = None
    token: str | None = None
    user: UserOut | None = None


class Verify2FARequest(BaseModel):
    two_fa_token: str
    code: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "user"


def send_2fa_email(to_email: str, code: str, name: str) -> None:
    smtp_host = "smtp.email.sa-saopaulo-1.oci.oraclecloud.com"
    smtp_port = "25"
    smtp_user = "scripts@ccmtecnologia.com.br"
    smtp_pass = "vsxDgp-j7Q4KuS:p-n6&"

    subject = "ADMSQUAD - Codigo de verificacao"
    body_text = "Ola " + name + ", seu codigo de verificacao e: " + code + ". Valido por 5 minutos."
    body_html = (
        "<div style='font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px;'>"
        "<h2 style='color:#204294'>ADMSQUAD</h2>"
        "<p>Ola, <strong>" + name + "</strong>!</p>"
        "<p>Seu codigo de verificacao e:</p>"
        "<div style='font-size:36px;font-weight:900;letter-spacing:8px;color:#204294;"
        "background:#E8EDF7;padding:16px;border-radius:8px;text-align:center;'>" + code + "</div>"
        "<p style='color:#888;font-size:12px;margin-top:16px;'>Valido por 5 minutos. Nao compartilhe este codigo.</p>"
        "</div>"
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = smtp_user
    msg["To"] = to_email
    msg.attach(MIMEText(body_text, "plain"))
    msg.attach(MIMEText(body_html, "html"))

    with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        if smtp_pass:
            server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, [to_email], msg.as_string())


@router.post("/login")
async def login(
    body: LoginRequest,
    repo: Annotated[SQLUserRepository, Depends(get_repository)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    result = await LoginUser(repo).execute(body.email, body.password)
    if result is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    logger.info("user_logged_in", user_id=result.user.id, email=result.user.email)

    # Check if 2FA is enabled
    r = await session.execute(
        text("SELECT two_fa_enabled, email FROM users WHERE id = :id"),
        {"id": result.user.id}
    )
    row = r.fetchone()
    two_fa_enabled = bool(row[0]) if row else False
    user_email = row[1] if row else body.email

    if not two_fa_enabled:
        return {
            "requires_2fa": False,
            "token": result.token,
            "user": {
                "id": result.user.id, "name": result.user.name,
                "email": result.user.email, "role": result.user.role,
                "avatar_url": result.user.avatar_url,
            }
        }

    # Generate 6-digit code
    code = str(random.randint(100000, 999999))
    expires = datetime.now() + timedelta(minutes=5)

    await session.execute(
        text("UPDATE users SET two_fa_code = :code, two_fa_expires = :expires WHERE id = :id"),
        {"code": code, "expires": expires, "id": result.user.id}
    )
    await session.commit()

    # Send email
    try:
        send_2fa_email(user_email, code, result.user.name)
    except Exception as e:
        logger.error("2fa_email_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Erro ao enviar email de verificacao: " + str(e))

    # Return temporary token (user id encoded)
    import base64
    two_fa_token = base64.b64encode(str(result.user.id).encode()).decode()

    return {
        "requires_2fa": True,
        "two_fa_token": two_fa_token,
        "token": None,
        "user": None,
        "pending_token": result.token,
        "pending_user": {
            "id": result.user.id, "name": result.user.name,
            "email": result.user.email, "role": result.user.role,
            "avatar_url": result.user.avatar_url,
        }
    }


@router.post("/verify-2fa")
async def verify_2fa(
    body: Verify2FARequest,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    import base64
    try:
        user_id = int(base64.b64decode(body.two_fa_token).decode())
    except Exception:
        raise HTTPException(status_code=400, detail="Token invalido")

    r = await session.execute(
        text("SELECT two_fa_code, two_fa_expires, name, email, role, avatar_url FROM users WHERE id = :id"),
        {"id": user_id}
    )
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")

    db_code, expires, name, email, role, avatar_url = row

    if not db_code or db_code != body.code:
        raise HTTPException(status_code=400, detail="Codigo invalido")

    if expires and datetime.now() > expires:
        raise HTTPException(status_code=400, detail="Codigo expirado")

    # Clear code
    await session.execute(
        text("UPDATE users SET two_fa_code = NULL, two_fa_expires = NULL WHERE id = :id"),
        {"id": user_id}
    )
    await session.commit()

    # Generate fresh token
    from src.infrastructure.db.user_repository import SQLUserRepository
    from src.domain.user import User
    import jwt, os
    secret = os.getenv("JWT_SECRET", "secret")
    token = jwt.encode({"sub": str(user_id), "role": role}, secret, algorithm="HS256")

    return {
        "token": token,
        "user": {"id": user_id, "name": name, "email": email, "role": role, "avatar_url": avatar_url}
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    repo: Annotated[SQLUserRepository, Depends(get_repository)],
) -> dict:
    try:
        user = await repo.create(body.name, body.email, body.password, body.role)
        return {"id": user.id, "message": "User created"}
    except Exception as exc:
        if "Duplicate entry" in str(exc):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal error")
