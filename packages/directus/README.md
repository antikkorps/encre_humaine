# @encre/directus — Schéma Directus (versionné par snapshots)

Source de vérité du modèle de contenu : **`docs/02-content-model.md`**.

Ce package versionne le **snapshot de schéma** Directus (`snapshots/schema.yaml`) pour
qu'il soit reproductible sur une instance vierge et diffable en review (docs/02 §8).

## Workflow

1. Lancer la stack (`infra/docker-compose.yml`) → Directus disponible sur `cms.…`.
2. Créer/modifier les collections via l'UI Directus (Franck = Administrateur).
3. Exporter : `pnpm directus:snapshot` → met à jour `snapshots/schema.yaml`.
4. Committer le snapshot.
5. Sur une instance vierge : `pnpm directus:apply` rejoue le schéma.

## À créer (docs/02-content-model.md)

**Singletons** : `site_settings`, `home_page`, `about_page`, `org_hub_page`,
`b2c_hub_page`, `resources_page`, `newsletter_page`, `contact_page`.

**Collections** : `legal_documents`, `offers`, `testimonials`, `faq_items`,
`products` (éditorial uniquement, `stripe_product_id` — **aucun prix/stock**),
`articles`, `article_categories`, `resources`. (`newsletter_issues` différé phase 3.)

**Blocs transverses** : statut `draft|published|archived` (Nuxt ne lit que `published`),
bloc SEO (`meta_title`, `meta_description`, `og_image`, `no_index`).

**Rôles** (docs/02 §6) :
- **Administrateur** (Franck) : structure, rôles, réglages système.
- **Éditrice** (Eléonore) : CRUD contenu + fichiers ; pas de structure/rôles/réglages.
- **API lecture** (app Nuxt) : lecture seule, `status = published` uniquement → `DIRECTUS_READ_TOKEN`.

**Isolation base** (docs/07 §3) : le rôle Postgres de Directus est restreint au schéma
`directus` — il ne voit pas `app` (`orders`/`leads`/`subscribers`).
