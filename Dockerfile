# syntax=docker/dockerfile:1.7
# URFON platformasi — production image: API (Fastify) + web SPA (web/dist) + Telegram bot + rejali ishlar, bitta jarayonda.
# Qurish:  docker compose build   (yoki: docker build -t urfon-platforma .)
# Ishga tushganda: prisma migrate deploy → node api/dist/index.js

ARG NODE_VERSION=22
# api/package.json dagi devDependencies bilan bir xil boʻlsin (runtimeʼda migratsiya va seed/admin skriptlari uchun)
ARG PRISMA_VERSION=6.19.3
ARG TSX_VERSION=4.20.6

# ─────────────── base: Prisma uchun openssl ───────────────
FROM node:${NODE_VERSION}-bookworm-slim AS base
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV CHECKPOINT_DISABLE=1 PRISMA_HIDE_UPDATE_MESSAGE=1

# ─────────────── deps: barcha bogʻliqliklar (build uchun) ───────────────
# Eslatma: node:22 dagi npm 10 root package.json dagi "allowScripts" (npm 11) maydonini bilmaydi va
# install skriptlarini odatdagidek bajaradi. Shunga qaramay Prisma client quyida aniq generate qilinadi.
FROM base AS deps
COPY package.json package-lock.json ./
COPY api/package.json api/package.json
COPY web/package.json web/package.json
COPY api/prisma api/prisma
RUN npm ci --no-audit --no-fund

# ─────────────── build: prisma generate + api (tsup) + web (vite) ───────────────
FROM deps AS build
COPY . .
RUN npx prisma generate --schema api/prisma/schema.prisma \
 && npm run build -w api \
 && npm run build -w web \
 && test -f api/dist/index.js && test -f web/dist/index.html

# ─────────────── prod-deps: faqat apiʼning production bogʻliqliklari ───────────────
# --ignore-scripts: prod paketlarida majburiy install skripti yoʻq (argon2/esbuild — optional binar paketlar),
# Prisma client esa build bosqichidan tayyor holda koʻchiriladi.
FROM base AS prod-deps
COPY package.json package-lock.json ./
COPY api/package.json api/package.json
COPY web/package.json web/package.json
RUN npm ci --omit=dev --workspace=api --ignore-scripts --no-audit --no-fund

# ─────────────── tools: prisma CLI (migrate deploy) va tsx (seed/admin skriptlari) ───────────────
FROM base AS tools
ARG PRISMA_VERSION
ARG TSX_VERSION
WORKDIR /opt/tools
RUN npm init -y >/dev/null \
 && npm install --no-audit --no-fund "prisma@${PRISMA_VERSION}" "tsx@${TSX_VERSION}" \
 && ./node_modules/.bin/prisma --version

# ─────────────── runtime ───────────────
FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    WEB_DIST=/app/web/dist \
    UPLOAD_DIR=/data/uploads \
    PATH=/opt/tools/node_modules/.bin:$PATH

COPY --from=tools /opt/tools /opt/tools
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY package.json package-lock.json ./
COPY web/package.json web/package.json
COPY api/package.json api/tsconfig.json api/
# prisma: sxema + migratsiyalar (+ seed skriptlari, agar mavjud boʻlsa); src/scripts: tsx bilan ishlaydigan ops skriptlari
COPY api/prisma api/prisma
COPY api/src api/src
COPY api/scripts api/scripts
COPY --from=build /app/api/dist api/dist
COPY --from=build /app/web/dist web/dist

RUN mkdir -p /data/uploads && chown -R node:node /data
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Migratsiya muvaffaqiyatsiz boʻlsa server ishga tushmaydi (konteyner qayta uriniladi)
CMD ["sh", "-c", "prisma migrate deploy --schema api/prisma/schema.prisma && exec node api/dist/index.js"]
