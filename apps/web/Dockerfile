# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────────────────────
# Image `web` — Nuxt/Nitro (preset node-server) — docs/07-deploy.md §7.
# Build multi-stage : install workspace → build Nuxt → image finale = `.output/`
# sur Node slim, non-root. Une cible `migrate` (drizzle-kit) partage le même build.
# Contexte de build = racine du monorepo (cf. infra/docker-compose.yml).
# Node pinné sur .node-version (politique de dépendances). Pas de corepack en
# Node 26 → pnpm installé via npm, version alignée sur `packageManager`.
# ─────────────────────────────────────────────────────────────────────────────

ARG NODE_IMAGE=node:26.2.0-bookworm-slim
ARG PNPM_VERSION=10.16.1

# ── base : Node + pnpm ───────────────────────────────────────────────────────
FROM ${NODE_IMAGE} AS base
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=true
RUN npm install -g pnpm@${PNPM_VERSION}
WORKDIR /app

# ── builder : install complet (dev inclus) + build Nuxt ──────────────────────
# Source copiée avant l'install : le postinstall `nuxi prepare` (apps/web) et les
# builds natifs (esbuild/sharp/@parcel/watcher) ont besoin du code et tournent ici.
FROM base AS builder
COPY . .
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
RUN pnpm --filter @encre/web build

# ── migrate : job one-shot drizzle-kit (docs/07 §4) ──────────────────────────
# Réutilise le build (drizzle-kit + migrations + config). Applique les migrations
# du schéma `app` AVANT le rollout de `web`. Lit APP_DATABASE_URL dans l'env.
FROM builder AS migrate
CMD ["pnpm", "--filter", "@encre/db", "db:migrate"]

# ── runtime : image finale minimale, non-root ────────────────────────────────
# Ne contient que `.output` (bundle Nitro autonome, deps incluses). Pas de
# node_modules de dev, pas de source, pas de secret.
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000
WORKDIR /app
COPY --from=builder --chown=node:node /app/apps/web/.output ./.output
USER node
EXPOSE 3000
# Pas de wget/curl dans l'image slim → sonde via fetch natif (Node 26).
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", ".output/server/index.mjs"]
