# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────────────────────
# Image Caddy custom — docs/07-deploy.md §2/§7, docs/06-security.md §6.
# Caddy officiel + module `caddy-dns/cloudflare` (TLS via DNS-01 : pas besoin
# d'exposer 80 pour la validation ACME). Version pinnée (politique de deps).
# ─────────────────────────────────────────────────────────────────────────────

ARG CADDY_VERSION=2.10.2

# ── builder : xcaddy compile Caddy avec le module cloudflare ──────────────────
FROM caddy:${CADDY_VERSION}-builder AS builder
RUN xcaddy build \
    --with github.com/caddy-dns/cloudflare

# ── runtime : image Caddy officielle + binaire custom ────────────────────────
FROM caddy:${CADDY_VERSION}
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
# Le Caddyfile est monté en lecture seule par le compose (infra/Caddyfile).
# Sanity-check : le module DNS cloudflare est bien embarqué.
RUN caddy list-modules | grep -q dns.providers.cloudflare
