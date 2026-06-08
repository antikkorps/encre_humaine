# 04 / 07 — Ressources (Blog)

**Routes** : `/ressources` (index) · `/ressources/{slug}` (article)
**Source** : `resources_page` + `articles` + `article_categories` + `resources` · **Rendu** : SSG/ISR.

> Schéma et gabarits en phase 1 ; rédaction des articles en phase 2-3. La page doit fonctionner **avec 0 article** (état vide propre).

## `/ressources` — Index
1. **Accroche** — `resources_page.accroche_title` + `accroche_body`.
2. **Ressource gratuite en vedette** — `featured_resource` : visuel, titre, description, **formulaire email** (gating via double opt-in newsletter ou téléchargement direct selon `requires_email`).
3. **Filtres** — par `article_categories.group` (Organisations / Particuliers / Terrain). Composant filtre accessible.
4. **Grille d'articles** — `ArticleCard` : vignette, titre, `excerpt`, date, `reading_time`. **Masquée/État vide si aucun article.**

## `/ressources/{slug}` — Article
1. **En-tête** — titre, catégorie, date, temps de lecture, cover.
2. **Corps** — `body` (rich text sanitizé), titres ancrables.
3. **CTA** — encart newsletter (« Le Fil ») en fin d'article.
4. **Articles liés** (optionnel) — même `category`.

## A11y / SEO
- `h1` = titre. Données structurées `Article` (auteur = Eléonore, datePublished, image). Breadcrumb. Le formulaire de ressource réutilise le flux newsletter (`03` §3) si `requires_email`.

## Critères d'acceptation
- Index fonctionnel avec 0 article (pas de section cassée). Filtres par groupe opérationnels. Téléchargement de ressource : si `requires_email`, passe par le double opt-in ; sinon lien direct. Article : rich text sanitizé, SEO `Article` présent.
