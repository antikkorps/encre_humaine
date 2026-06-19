# L'Encre Humaine

Site de **L'Encre Humaine** (Eléonore Morée) : conseil RH & accompagnement, et boutique de
*serious games*. Site vitrine + boutique en paiement invité (sans compte client), newsletter à
double opt-in, contenu éditorial géré par un CMS.

> **Approche *spec-driven*** : les specifications dans [`docs/`](docs/) sont la source de vérité.
> Tout le code en découle. Lire [`docs/CLAUDE.md`](docs/CLAUDE.md) puis, dans l'ordre,
> `00-global` → `01-data-model` → `02-content-model` → `03-api-contracts` → les pages →
> `shop` / `security` / `deploy`.

## Stack

| Domaine | Choix |
| --- | --- |
| Monorepo | **pnpm** (workspaces) |
| Front + back résiduel | **Nuxt 4** + **Nitro** (`apps/web/server/`) |
| UI | **Tailwind v4** + **Reka UI** (primitives headless) |
| Base de données | **PostgreSQL 17** + **Drizzle** (3 schémas isolés : `app` / `directus` / `umami`) |
| CMS | **Directus** (schéma versionné en code) |
| Paiement | **Stripe** (Checkout hébergé — pas de table `products`, Stripe fait foi sur prix/stock) |
| Email | **Resend** (commande, contact, newsletter) |
| Validation | **valibot** (schémas partagés client + serveur) |
| Anti-bot / analytics | **Turnstile** / **Umami** (cookieless) |
| Infra | **Docker** · **Caddy** (TLS DNS-01 Cloudflare) · **Cloudflare** · **R2** · CI **Forgejo** |

Détails et décisions d'architecture (ADR) : [`docs/00-global.md`](docs/00-global.md) et
[`docs/CLAUDE.md`](docs/CLAUDE.md).

## Structure du monorepo

```
apps/web/            # Nuxt 4 + Nitro — front public + endpoints serveur (server/)
packages/db/         # Drizzle : schéma `app`, migrations versionnées, types dérivés
packages/shared/     # validation valibot + schéma d'env (réutilisés client/serveur)
packages/directus/   # schéma Directus en code (bootstrap, snapshot, types générés)
infra/               # docker-compose, Caddy, init Postgres, sauvegardes chiffrées
  ├─ env/.env.example   # gabarit des variables d'environnement
  ├─ postgres/          # init.sql (rôles + schémas isolés)
  ├─ caddy/             # image Caddy custom (module DNS Cloudflare)
  └─ backup/            # pg_dump chiffré GPG → R2 (cron + restore)
docs/                # specifications — source de vérité
```

## Démarrage rapide

Prérequis : **Node ≥ 22**, **pnpm ≥ 10**, **Docker** (pour Postgres / Directus en local).

```bash
pnpm install            # installe toutes les dépendances du monorepo

make db-up              # démarre Postgres (crée infra/env/.env depuis l'exemple si absent)
make db-migrate         # applique les migrations Drizzle

pnpm dev                # lance Nuxt en dev → http://localhost:3000
```

> `apps/web` **valide ses variables d'environnement au boot** et refuse de démarrer sinon.
> En local, copier le gabarit (`make env` le fait automatiquement) suffit : les valeurs
> `change-me` conviennent tant qu'on ne sollicite pas les services tiers. Pour voir le **contenu
> réel**, lancer Directus (`make cms-up`) et renseigner un vrai `DIRECTUS_READ_TOKEN`.

## Commandes pnpm

| Commande | Effet |
| --- | --- |
| `pnpm dev` | Nuxt en mode développement (`apps/web`) |
| `pnpm build` | Build de production de `apps/web` |
| `pnpm lint` | Biome (lint + format check) sur tout le repo |
| `pnpm lint:fix` | Biome avec corrections automatiques |
| `pnpm typecheck` | Typecheck de tous les packages (`tsc` / `nuxi typecheck`) |
| `pnpm test` | Vitest sur tous les packages |
| `pnpm test:e2e` | Playwright (parcours critiques, `apps/web`) |
| `pnpm db:generate` | Génère une migration Drizzle depuis le schéma |
| `pnpm db:migrate` | Applique les migrations |
| `pnpm directus:snapshot` | Exporte le schéma Directus → `packages/directus/snapshots/` |
| `pnpm directus:apply` | Rejoue le snapshot sur l'instance courante |
| `pnpm directus:types` | Génère les types TS du schéma depuis le snapshot |

## Commandes make (stack Docker locale)

La prod n'utilise que `infra/docker-compose.yml` ; en local on ajoute l'overlay
`docker-compose.dev.yml` (expose Postgres sur `127.0.0.1:55432`, Directus sur `8055`).
`make help` liste toutes les cibles.

| Cible | Effet |
| --- | --- |
| `make env` | Crée `infra/env/.env` depuis l'exemple si absent |
| `make db-up` / `make db-down` | Démarre / stoppe Postgres (volume conservé) |
| `make db-migrate` | Applique les migrations Drizzle depuis l'hôte |
| `make psql` / `make psql-app` | Shell psql (superuser / `app_user`, `search_path=app`) |
| `make query Q="..."` | Exécute une requête SQL ponctuelle en `app_user` |
| `make cms-up` / `make cms-down` | Démarre / stoppe Postgres + Directus |
| `make cms-bootstrap` | Crée/met à jour collections, champs, rôles & permissions (idempotent) |
| `make cms-snapshot` / `make cms-apply` | Exporte / rejoue le schéma Directus |
| `make cms-types` | Génère les types TS (sans Docker, lit le snapshot) |
| `make backup-run` / `make restore NAME=...` | Sauvegarde chiffrée → R2 / restauration |
| `make db-reset` / `make clean` | ⚠️ Détruit le volume Postgres / tous les volumes |

## Environnement

Toutes les variables sont décrites dans [`infra/env/.env.example`](infra/env/.env.example)
(Postgres, Directus, Stripe, Resend, Turnstile, Cal.com, R2, sauvegardes, Umami, Cloudflare).

- Copier en `infra/env/.env` (jamais committé). `make env` / `make db-up` le font à partir du gabarit.
- Le service `web` valide ces variables au boot (schéma valibot dans `packages/shared`).
- **Aucun secret tiers n'est exposé au client** : le token Directus est en lecture seule,
  *published only*, et reste strictement côté serveur.

## Tests

- **Vitest** par package (`packages/{shared,db}` en env Node, `apps/web` en env Nuxt + happy-dom).
  La logique « dure » (webhook Stripe, newsletter, purge RGPD) est testée sous **PGlite** (vrai
  Postgres en mémoire), avec preuve d'idempotence du webhook.
- **Playwright** pour les parcours critiques (`apps/web/e2e/`).

```bash
pnpm test        # unitaires + intégration
pnpm test:e2e    # bout en bout
```

## Garde-fous (rappel)

- Pas de table `products` (Stripe = prix/stock, Directus = éditorial, lien `stripe_product_id`).
- Pas de compte client / auth publique en phase 1 (achat invité).
- Tout le backend dans **Nitro** (pas de service séparé).
- Franchise en base de TVA par défaut (mention art. 293 B du CGI), bascule par `VAT_ENABLED`.
- Double opt-in newsletter maison (token hashé, purge 30 j) — pas le double opt-in natif Resend.
- Idempotence du webhook Stripe (contrainte unique + `ON CONFLICT`), couverte par un test.
- FR uniquement, pas d'i18n.

Détail complet : [`docs/CLAUDE.md`](docs/CLAUDE.md) (§ « Garde-fous »).

## Déploiement

Stack reproductible via Docker (`infra/docker-compose.yml`) : Caddy (TLS automatique DNS-01
Cloudflare), `web` (Nuxt/Nitro), `migrate` (job one-shot), Postgres, Directus, sauvegardes
chiffrées vers R2. Procédure détaillée : [`docs/07-deploy.md`](docs/07-deploy.md).
