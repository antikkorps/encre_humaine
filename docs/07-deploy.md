# 07 — Déploiement & infrastructure

> Dépend de tous les fichiers. Tout est dockerisé et déployable à l'identique sur n'importe quel hôte Docker (cible : Hetzner + Cloudflare). CI/CD via Forgejo Actions.

---

## 1. Topologie (docker compose)

Services : **caddy** · **web** (Nuxt/Nitro) · **directus** · **postgres** · **umami**. Réseau interne ; seuls 80/443 exposés (par Caddy).

```
caddy ──► web        (site public + API Nitro)
      ├─► directus    (CMS, sous-domaine ou /admin)
      └─► umami       (analytics, sous-domaine)
web, directus, umami ──► postgres   (schémas app / directus / umami)
assets (directus) ──► R2 (externe)
```

`depends_on` avec `condition: service_healthy` (healthchecks sur postgres, directus, web). `restart: unless-stopped`. Volumes nommés (postgres). Pas de volume d'assets (→ R2).

---

## 2. Reverse proxy — Caddy

- Image Caddy **officielle** (`caddy:2.11.3`) — TLS automatique via **ACME HTTP-01**, **aucun token requis**. Cloudflare (mode orange) laisse passer `/.well-known/acme-challenge` vers l'origine, donc le challenge fonctionne derrière le proxy (port 80 ouvert aux IP CF).
- Mapping :
  - `encrehumaine.fr` → `web`
  - `cms.encrehumaine.fr` → `directus`
  - `stats.encrehumaine.fr` → `umami`
- En-têtes de sécurité + CSP posés ici (cf. `06` §6). Compression (zstd/gzip), HTTP/2-3.

---

## 3. PostgreSQL — schémas & rôles

Script d'init (premier boot) :
1. Créer les schémas `app`, `directus`, `umami`.
2. Créer des **rôles séparés** :
   - `directus_user` : privilèges limités au schéma `directus` (aucun accès à `app`).
   - `umami_user` : limité au schéma `umami`.
   - `app_user` : limité au schéma `app`.
3. `search_path` adapté par rôle.

> C'est l'isolation citée en `02` §6 et `06` §9 : Directus ne peut **pas** lire `orders`/`leads`/`subscribers`.

---

## 4. Migrations Drizzle

- Job dédié (service one-shot `migrate` ou étape CI) exécutant `drizzle-kit migrate` sur le schéma `app` **avant** le démarrage/rollout de `web`.
- Jamais de `push` auto en prod. Migrations committées (`packages/db/migrations`).
- Directus & Umami s'auto-migrent au boot (ne pas interférer).

---

## 5. Variables d'environnement (`infra/env/.env.example`)

```
# Domaine
BASE_URL=https://encrehumaine.fr

# Postgres
POSTGRES_HOST=postgres
POSTGRES_DB=...
APP_DATABASE_URL=postgres://app_user:...@postgres:5432/...?schema=app

# Directus
DIRECTUS_KEY=...
DIRECTUS_SECRET=...
DIRECTUS_DB_URL=postgres://directus_user:...@postgres:5432/...
DIRECTUS_ADMIN_EMAIL=...
DIRECTUS_ADMIN_PASSWORD=...
DIRECTUS_PUBLIC_URL=https://cms.encrehumaine.fr
DIRECTUS_READ_TOKEN=...          # token lecture seule, published only (côté serveur Nuxt)

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_SHIPPING_RATE_FR=shr_...
VAT_ENABLED=false                # bascule franchise → assujetti
VAT_RATE=0

# Resend
RESEND_API_KEY=...
RESEND_AUDIENCE_ID=...
NEWSLETTER_FROM="L'Encre Humaine <contact@encrehumaine.fr>"
CONTACT_NOTIFY_TO=...

# Turnstile
TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...

# Prise de RDV (Cal.com — nom agnostique)
BOOKING_URL=https://cal.com/...

# R2 (storage Directus + backups)
R2_ENDPOINT=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_ASSETS=...
R2_BUCKET_BACKUPS=...

# Umami
UMAMI_DB_URL=postgres://umami_user:...@postgres:5432/...
UMAMI_APP_SECRET=...

# Caddy : TLS via HTTP-01, aucun token Cloudflare requis.
```

**Validation au boot** (`06` §5) : un schéma vérifie la présence/forme de ces variables ; `web` refuse de démarrer sinon.

---

## 6. Stockage & sauvegardes

- **Assets Directus** : adaptateur S3 → **R2** (`R2_BUCKET_ASSETS`). App stateless côté fichiers.
- **Backups** : tâche planifiée (conteneur cron ou cron hôte) `pg_dump` → chiffré → **rclone** → `R2_BUCKET_BACKUPS`. Rétention (ex. 7 quotidiens / 4 hebdo). **Test de restauration** documenté avant prod (`06` §11).

---

## 7. Images Docker

- **web** : build multi-stage, `pnpm` (workspaces), preset Nitro `node-server`. Image finale = `.output/` sur Node slim, non-root, port interne. Healthcheck HTTP.
- **directus**, **postgres**, **umami** : images officielles **pinnées** (politique 30 j).
- Caddy : image custom (module cloudflare) pinnée.

---

## 8. CI/CD — Forgejo Actions

Pipeline sur push :
```
1. setup pnpm + cache
2. install (frozen lockfile)
3. lint (Biome) + typecheck (vue-tsc)
4. test (Vitest) + e2e critiques (Playwright)
5. build image web → push vers le registry Forgejo
6. deploy : sur l'hôte, pull image + `docker compose up -d`
           (job migrate avant rollout web)
```
- Déploiement : SSH vers l'hôte (clé en secret) ou runner self-hosted dans le réseau (cf. ton setup Forgejo habituel).
- **Renovate** (Forgejo) : `minimumReleaseAge: "30 days"`, `vulnerabilityAlerts` prioritaires, lockfile maintenu.

---

## 9. DNS (Cloudflare)
- Enregistrements `@`, `cms`, `stats` → IP de l'hôte (proxied selon besoin ; DNS-01 fonctionne proxied).
- Token API scopé à l'édition DNS de la zone (pour Caddy).

---

## 10. Critères d'acceptation
1. `docker compose up` sur un hôte vierge lève tout le stack, TLS auto via Cloudflare DNS-01.
2. Les 3 schémas et 3 rôles Postgres sont créés ; Directus ne voit pas `app`.
3. Migrations Drizzle appliquées avant le rollout de `web`.
4. `web` refuse de démarrer si une variable requise manque.
5. Assets servis depuis R2 ; un redéploiement sur un autre hôte ne perd aucun fichier.
6. Backup `pg_dump` → R2 fonctionnel et **restauration testée**.
7. Pipeline Forgejo : lint + typecheck + tests bloquants avant build/déploiement.
8. Renovate actif avec fenêtre 30 j + exception sécurité.

---

*Suivant : `CLAUDE.md` (amorce agent).*
