# @encre/directus — Schéma & accès Directus (schema-as-code)

Source d'intention : **`docs/02-content-model.md`**. Source applicable : **`src/schema.ts`**
(via le DSL `src/fields.ts`). Le **snapshot** YAML (`snapshots/schema.yaml`) en est
l'artefact reproductible et diffable (docs/02 §8).

Le modèle n'est **pas** dessiné à la main dans l'UI : il est décrit en TypeScript et
appliqué par un moteur idempotent. Re-jouable à volonté — ne crée que ce qui manque.

## Architecture

- `fields.ts` — DSL compact `Spec` → payloads Directus (champs, relations, jonctions M2M).
- `schema.ts` — le modèle de docs/02 : 8 singletons + 8 collections (`allCollections`).
- `bootstrap.ts` — moteur idempotent : collections → champs → relations, puis accès.
- `access.ts` — rôles, policies & permissions (Directus 11) : Éditrice + API lecture.
- `snapshot.ts` / `apply.ts` — export / rejeu du schéma via le CLI Directus (`node cli.js`
  dans le conteneur ; `directus` n'est pas dans le PATH de l'image).
- `api.ts` / `env.ts` / `compose.ts` — client REST minimal, config, helper docker compose.

## Workflow

1. Lancer la stack : `make cms-up` (Postgres + Directus sur `127.0.0.1:8055` en local).
2. Modifier le modèle dans `schema.ts` / `fields.ts` (jamais via l'UI : l'UI n'est pas la source).
3. Appliquer : `make cms-bootstrap` (≡ `pnpm --filter @encre/directus bootstrap`) — idempotent.
4. Exporter le snapshot : `make cms-snapshot` → met à jour `snapshots/schema.yaml`.
5. Committer `schema.ts`/`fields.ts` **et** le snapshot.
6. Sur une instance vierge : `make cms-apply` rejoue le schéma, puis `make cms-bootstrap`
   (re)crée rôles/permissions/token (le snapshot Directus **ne** couvre **pas** les accès).

## État (vérifié contre Directus 11.12 réel)

- **16 collections** : 8 singletons (`site_settings`, `home_page`, `about_page`,
  `org_hub_page`, `b2c_hub_page`, `resources_page`, `newsletter_page`, `contact_page`)
  + 8 collections (`legal_documents`, `offers`, `products`, `testimonials`, `faq_items`,
  `articles`, `article_categories`, `resources`). Jonction M2M `products_files`.
  (`newsletter_issues` différé phase 3.)
- `products` = **éditorial uniquement** (`stripe_product_id`, aucun prix/stock → Stripe).
- **Blocs transverses** : statut `draft|published|archived` (Nuxt ne lit que `published`),
  bloc SEO (`meta_title`, `meta_description`, `og_image`, `no_index`), audit, tri.
- **Rôles** (docs/02 §6) :
  - **Administrateur** (système, Franck) : structure, rôles, réglages — non recréé par le bootstrap.
  - **Éditrice** (Eléonore) : CRUD contenu + fichiers ; pas de structure/rôles/réglages.
  - **API lecture** (app Nuxt) : lecture seule, `status = published` uniquement, via
    un user à token statique (`DIRECTUS_READ_TOKEN`).
- Round-trip prouvé : `snapshot` → `apply` = « No changes to apply ».

**Isolation base** (docs/07 §3) : le rôle Postgres de Directus est restreint au schéma
`directus` — il ne voit pas `app` (`orders`/`leads`/`subscribers`).
