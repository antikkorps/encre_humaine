# CLAUDE.md — Amorce projet : site L'Encre Humaine

Tu vas construire le site **L'Encre Humaine** (Eléonore Morée, conseil RH & accompagnement + vente de serious games). Ce dépôt suit une approche **spec-driven** : les specs dans `specs/` sont la source de vérité. Lis-les **dans l'ordre** avant de coder.

## Ordre de lecture obligatoire
1. `specs/00-overview.md` — socle, stack, **décisions actées (ADR)**, politique de dépendances, DoD.
2. `specs/01-data-model.md` — schéma Drizzle (schéma `app`).
3. `specs/02-content-model.md` — collections Directus, rôles.
4. `specs/03-api-contracts.md` — webhook Stripe, contact, newsletter (logique dure).
5. `specs/04-pages/` — `00-global` puis chaque page.
6. `specs/05-shop.md` · `specs/06-security.md` · `specs/07-deploy.md`.

En cas de doute ou de contradiction : **00-overview prime**, et tu remontes la question plutôt que d'inventer.

## Stack (rappel)
Monorepo **pnpm** · **Nuxt (Nitro)** front + backend résiduel (`server/`) · **Tailwind** (couche composants interactifs à trancher : Reka UI ou Nuxt UI thémé) · **Drizzle** + **PostgreSQL** (schémas isolés) · **Directus** (CMS) · **Stripe** (Checkout hébergé) · **Resend** (email) · **Calendly** (embed) · **Turnstile** (anti-bot) · **Umami** (analytics) · **Caddy** + **Docker** + **Cloudflare** + **R2** · CI **Forgejo**.

## Principes non négociables
- **DRY** : une seule source par concept. Types **dérivés** de Drizzle et du SDK Directus, jamais ré-écrits.
- **SOTA sobre** : aucune dépendance gratuite ; préférer Nitro à un service de plus.
- **Spec-driven** : pas de code sans spec ; respecter les **critères d'acceptation** de chaque fichier.
- **Perf & SEO** : Lighthouse ≥ 95 mobile, CWV au vert (critère de DoD).
- **a11y** : WCAG 2.2 AA.

## Garde-fous (erreurs à NE PAS commettre)
- ❌ **Pas de table `products`** dans Drizzle (Stripe = prix/stock, Directus = éditorial, lien `stripe_product_id`).
- ❌ **Pas de comptes client / auth publique** en phase 1 (achat invité).
- ❌ **Pas de Fastify / service backend séparé** (tout dans Nitro).
- ❌ **Pas de Stripe Tax** en phase 1 : **franchise en base**, mention « TVA non applicable, art. 293 B du CGI ». Bascule par flag `VAT_ENABLED`.
- ❌ **Pas de double opt-in natif Resend** : l'implémenter (token hashé, registre de consentement, purge 30 j).
- ❌ **Ne jamais** exposer un secret/token tiers au client ; token Directus = lecture seule, published only, server-side.
- ❌ **Pas d'IP persistée** sur les leads de contact.
- ❌ **Pas d'i18n** : FR uniquement.
- ❌ **Pas de localStorage** dans des artefacts ; ici app réelle, mais garder l'état serveur/é­tat client propre.
- ✅ Idempotence du **webhook Stripe** (contrainte unique + ON CONFLICT) — **doit avoir un test Vitest**.
- ✅ Sections dynamiques **se masquent proprement si vides** (témoignages, articles).
- ✅ Directus **ne doit pas** pouvoir lire le schéma `app` (rôles Postgres séparés).

## Périmètre Phase 1 (à livrer)
Accueil · À propos · Hub Organisations · Hub Particuliers · Contact · Mentions légales/CGV/Confidentialité · **Boutique** (catalogue + fiche + Checkout) · **Newsletter** (inscription + double opt-in) · socle technique complet (CMS, sécurité, SEO, déploiement dockerisé).
Gabarit des pages offres + routes prêts (contenu détaillé = phase 2).

## Structure cible du dépôt
```
apps/web/            # Nuxt + Nitro (front + server/)
packages/db/         # Drizzle: schéma + migrations + types exportés
packages/shared/     # schémas de validation (valibot/zod), types, env schema
packages/directus/   # snapshots de schéma Directus (versionnés)
infra/               # docker-compose, Caddyfile, .env.example
specs/               # specs (source de vérité)
```

## Politique de dépendances
- Au scaffolding : **dernière version stable ≥ 30 jours** de chaque dépendance.
- **Renovate** : `minimumReleaseAge: "30 days"`, advisories de sécurité prioritaires (outrepassent le délai). Versions pinnées, lockfile committé.

## Commandes (à mettre en place dans le scaffolding)
```
pnpm install
pnpm dev               # Nuxt en dev
pnpm lint              # Biome
pnpm typecheck         # vue-tsc
pnpm test              # Vitest
pnpm test:e2e          # Playwright (parcours critiques)
pnpm db:generate       # drizzle-kit generate
pnpm db:migrate        # drizzle-kit migrate (schéma app)
pnpm directus:snapshot # export schéma Directus
pnpm directus:apply    # import snapshot sur instance vierge
docker compose up      # stack complet
```

## Definition of Done (par page/feature)
Spec respectée + critères d'acceptation ✅ · Biome/typecheck zéro warning · Vitest + Playwright (parcours critiques) verts · Lighthouse ≥ 95 mobile · WCAG AA · env validé au boot · contenu éditable par Eléonore là où prévu · `docker compose up` reproductible.

## Méthode de travail attendue
1. Scaffolder le monorepo (structure ci-dessus) + outillage (Biome, Vitest, Playwright, Tailwind, validation d'env).
2. `packages/db` (schéma `01`) → migrations.
3. `packages/directus` (collections `02`) → snapshot.
4. `apps/web` : layout global (`04/00`), puis pages dans l'ordre, en branchant le contenu Directus.
5. Endpoints (`03`) + boutique (`05`) avec tests d'idempotence.
6. Sécurité (`06`) : validation, rate-limit, Turnstile, CSP, consentement.
7. Infra (`07`) : compose, Caddy, Postgres init (schémas/rôles), CI Forgejo, backups.

Travaille par incréments testables. Quand une décision n'est pas couverte par une spec, **demande** — ne devine pas.
