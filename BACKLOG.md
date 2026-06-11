# BACKLOG — L'Encre Humaine

Suivi de progression du site (spec-driven). Source de vérité : `docs/`.
Légende : `[ ]` à faire · `[~]` en cours · `[x]` fait · `[!]` bloqué.

> **Convention** : on n'écrit pas de code sans spec. Chaque item référence sa spec.
> DoD par feature : spec respectée + critères d'acceptation ✅ · Biome/typecheck 0 warning ·
> Vitest + Playwright verts · Lighthouse ≥ 95 mobile · WCAG AA · env validé au boot.

---

## Décisions actées (ce projet)

- **UI** : Reka UI (primitives headless) + Tailwind. Pas de lib JS lourde côté public.
- **Validation** : `valibot` (léger), schémas dans `packages/shared`, réutilisés client + serveur.
- **Docs** : les specs vivent dans `docs/` (l'amorce mentionne `specs/` — on reste sur `docs/`).
- **Git** : dépôt `main`, hébergement Forgejo, miroir GitHub (à câbler).

## Points ouverts / à fournir par Franck

- [ ] Contenu CGV (prestations + produits physiques, rétractation 14 j) — `docs/10-legal.md`.
- [ ] Identité légale : `legal_name`, `legal_status`, `siret`, adresse, hébergeur — pour `site_settings`.
- [ ] Secrets réels (Stripe, Resend, Turnstile, Cloudflare, R2, Directus) au moment du déploiement.
- [x] ~~Docker indisponible dans ce WSL~~ → **résolu** (Docker Desktop était éteint ; server 29.5.2, compose v5.1.4).
- [ ] URL Forgejo + remote GitHub miroir.

---

## Phase 0 — Socle technique (run en cours)

### Scaffold monorepo & outillage — `docs/CLAUDE.md` §Méthode 1
- [~] `git init` (main) + `.gitignore` + `.node-version` + `.editorconfig`
- [~] `pnpm-workspace.yaml` + `package.json` racine (scripts) + `tsconfig.base.json`
- [~] Biome (lint + format) — `biome.json`
- [~] `renovate.json` (`minimumReleaseAge: 30 days`, vulnérabilités prioritaires)
- [x] `Makefile` (raccourcis dev) + `infra/docker-compose.dev.yml` (overlay dev opt-in, Postgres exposé sur `127.0.0.1:55432`) : `make db-up` · `psql` · `psql-app` · `db-migrate` · `query` · `db-reset`
- [ ] Vitest (config racine + par package)
- [ ] Playwright (parcours critiques)
- [ ] Validation d'env au boot (`packages/shared`, valibot) — `docs/06-security.md` §5

### `packages/shared` — schémas & types partagés
- [~] Schéma d'env (valibot) + parse au boot
- [ ] Enveloppe d'erreur uniforme `{ error: { code, message } }`
- [ ] Schémas de validation : contact, newsletter subscribe — `docs/03-api-contracts.md`

### `packages/db` — Drizzle (schéma `app`) — `docs/01-data-model.md`
- [~] `_schema.ts` (pgSchema app) + `_helpers.ts` (pk uuidv7, timestamps) + enums
- [~] Tables `orders`, `contact_leads`, `newsletter_subscribers`
- [~] Exports de types dérivés (`InferSelectModel`/`InferInsertModel`)
- [x] `drizzle.config.ts` + génération migration initiale (`0000_messy_yellowjacket.sql`, `CREATE SCHEMA IF NOT EXISTS app` pour coexister avec `init.sql`)
- [~] Test Vitest : idempotence `orders.stripe_session_id` — test structurel (index unique) ✅ ; comportement `ON CONFLICT DO NOTHING` (double insert → 1 ligne) **vérifié manuellement contre Postgres 17 réel** le 2026-06-08 ; test automatisé du comportement = avec l'endpoint webhook (Phase 1)

### `packages/directus` — schéma + accès — `docs/02-content-model.md`
- [x] Bootstrap idempotent (`bootstrap.ts` : DSL `fields.ts` → `schema.ts` → moteur) — **vérifié contre Directus 11.12 réel** : 16 collections (8 singletons + 8) + jonction `products_files`, bloc statut/SEO, re-run = +0 partout
- [x] Scripts `snapshot` / `apply` (`make cms-snapshot` / `cms-apply`) — round-trip prouvé (snapshot → apply = « No changes to apply »). Snapshot versionné : `packages/directus/snapshots/schema.yaml`. Le CLI Directus s'invoque via `node cli.js` (pas dans le PATH de l'image)
- [x] Rôles : Admin (système, Franck), Éditrice (Eléonore, CRUD contenu+fichiers : 72 perms), API lecture seule published-only (18 perms) + user à token statique — vérifié actif
- [ ] Client Directus typé (`@directus/sdk`) côté serveur Nuxt → Phase 1

### `infra` — `docs/07-deploy.md`
- [~] `.env.example` (toutes les variables) + schéma de validation
- [~] `docker-compose.yml` (caddy · web · directus · postgres · umami)
- [~] `Caddyfile` (3 sous-domaines, en-têtes sécurité + CSP)
- [x] `postgres/init.sql` (schémas `app`/`directus`/`umami` + rôles séparés) — **validé contre Postgres 17 réel** (3 rôles + 3 schémas, `app_user` n'a pas accès à `directus`). Bug corrigé : psql n'interpole pas `:'pw'` dans un bloc `$$` → passage par `set_config`/`current_setting` + `EXECUTE format(%L)`
- [ ] Dockerfile `web` (multi-stage, Nitro node-server, non-root)
- [ ] Job migrate avant rollout web
- [ ] Backups `pg_dump` → R2 (rclone) + test de restauration

### `apps/web` — Nuxt + Nitro (squelette)
- [~] `nuxt.config` + modules (seo, image, fonts, tailwind v4, reka-ui)
- [~] Layout global + `app.vue` + thème teal/orange — `docs/00-global.md`
- [ ] Composants d'inventaire (AppHeader, AppFooter, NavMobile, ConsentBanner, …)
- [ ] Validation d'env au boot (refus de démarrer si var manquante)

---

## Phase 1 — Pages & features (après socle)

### Données & contenu
- [ ] Migration initiale Drizzle appliquée (schéma `app`)
- [x] Collections Directus créées + snapshot versionné + rôles (cf. `packages/directus`, Phase 0)
- [ ] Client Directus typé (`@directus/sdk`) côté serveur Nuxt (token lecture seule)

### Endpoints Nitro — `docs/03-api-contracts.md`
- [ ] `POST /api/stripe/webhook` (raw body, signature, idempotence ON CONFLICT) + **test Vitest idempotence**
- [ ] `POST /api/contact` (valibot + Turnstile serveur + rate-limit + Resend)
- [ ] `POST /api/newsletter/subscribe` (double opt-in, token hashé)
- [ ] `GET /api/newsletter/confirm` (comparaison constante, expiration)
- [ ] Purge planifiée des `pending > 30j` (DB + Resend)
- [ ] `GET /api/shop/products` (merge Directus + Stripe, cache court)
- [ ] `POST /api/shop/checkout` (Checkout Session, FR, port forfait, 293 B)

### Pages — `docs/01..10`
- [ ] `/` Accueil — `docs/01-accueil.md`
- [ ] `/a-propos` — `docs/02-a-propos.md`
- [ ] `/organisations` Hub B2B — `docs/03-organisations-hub.md`
- [ ] `/particuliers` Hub B2C — `docs/04-particuliers-hub.md`
- [ ] Gabarit offre `/organisations/[slug]` + `/particuliers/[slug]` — `docs/05-offres-gabarit.md`
- [ ] `/boutique` + `/boutique/[slug]` + `/boutique/confirmation` — `docs/06-boutique.md`
- [ ] `/ressources` + `/ressources/[slug]` (fonctionne à 0 article) — `docs/07-ressources.md`
- [ ] `/newsletter` + `/newsletter/confirmation` — `docs/08-newsletter.md`
- [ ] `/contact` (form + Calendly post-consentement) — `docs/09-contact.md`
- [ ] `/mentions-legales` · `/cgv` · `/confidentialite` — `docs/10-legal.md`

### Sécurité & conformité — `docs/06-security.md`
- [ ] Rate-limiting endpoints publics (IP réelle via `CF-Connecting-IP`)
- [ ] Turnstile serveur (siteverify) + honeypot
- [ ] CSP stricte + en-têtes sécurité (Caddy)
- [ ] Bandeau de consentement maison (gate embeds tiers)
- [ ] Umami cookieless intégré

### Déploiement — `docs/07-deploy.md`
- [ ] CI Forgejo (lint + typecheck + tests bloquants → build → deploy)
- [ ] Miroir GitHub
- [ ] DNS Cloudflare (`@`, `cms`, `stats`) + token DNS scope
- [ ] Restauration d'un dump testée avant prod

---

## Phase 2+ (rappel, hors périmètre immédiat)
- Contenu détaillé des pages offres · rédaction articles · diffusion newsletter (broadcasts Resend)
- Vue Commandes (fulfillment) · inventaire Stripe automatisé · Europe/expédition élargie
- Bascule TVA (`VAT_ENABLED`) si dépassement de seuil — sans migration (ADR #4)
