# ── Stage 1: build ─────────────────────────────────────────────────────────────
FROM mirror.gcr.io/library/node:20.11.1-alpine3.19 AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2: runtime (nginx) ───────────────────────────────────────────────────
FROM mirror.gcr.io/library/nginx:1.25.4-alpine3.18-slim AS runtime

ENV TZ=America/Sao_Paulo

# Configuração nginx para SPA (React Router)
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar logo para pasta pública
# (os logos públicos ficam em /app/public e são copiados no build)

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

ENTRYPOINT ["nginx", "-g", "daemon off;"]
