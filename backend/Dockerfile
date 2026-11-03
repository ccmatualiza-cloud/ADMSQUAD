# ── Stage 1: build / dependências ─────────────────────────────────────────────
FROM mirror.gcr.io/library/python:3.12.3-slim-bookworm AS builder

ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

WORKDIR /app

# Instalar uv (versão recente)
RUN pip install --no-cache-dir uv

# Copiar manifesto antes do código (cache de layer)
COPY pyproject.toml .
RUN uv sync --no-group dev

# Copiar código fonte
COPY src/ ./src/

# ── Stage 2: runtime ───────────────────────────────────────────────────────────
FROM mirror.gcr.io/library/python:3.12.3-slim-bookworm AS runtime

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV TZ=America/Sao_Paulo
ENV PATH="/app/.venv/bin:$PATH"

WORKDIR /app

# Criar usuário não-root
RUN groupadd --system --gid 1001 appgroup && \
    useradd  --system --uid 1001 --gid appgroup --no-create-home appuser

# Copiar artefatos do builder
COPY --from=builder /app/.venv  ./.venv
COPY --from=builder /app/src    ./src

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:3001/health')" || exit 1

ENTRYPOINT ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "3001", "--workers", "2"]
