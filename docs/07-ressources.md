# 04 / 07 — Ressources (Blog)

**Routes** : `/ressources` (index) · `/ressources/{slug}` (article)
**Source** : `resources_page` + `articles` + `article_categories` + `resources` · **Rendu** : SSG/ISR.

> Schéma et gabarits en phase 1 ; rédaction des articles en phase 2-3. La page doit fonctionner **avec 0 article** (état vide propre).

## `/ressources` — Page fusionnée « Les Tentacules » (blog + newsletter)
> **Fusion (2026-07) :** le blog et la newsletter sont réunis sur `/ressources` (cf. `08`). 7 sections :
1. **Hero** — `accroche_title` + `accroche_body` + `hero_signature` (🐙 signature).
2. **Explorer les Tentacules** — filtres par `article_categories.group` (Organisations / Parcours professionnels / Terrain), chrome statique (emoji + mots-clés). Composant filtre accessible.
3. **À lire en premier** — `featured_article` (M2O `articles`) : article éditorial vedette. Masqué si vide.
4. **Dernières tentacules publiées** — grille `ArticleCard` (vignette, titre, `excerpt`, date, `reading_time`). **État vide propre si aucun article.**
5. **Newsletter intégrée** (`id="newsletter"`) — `newsletter_page` + `NewsletterForm` (cf. `08`).
6. **Positionnement** — `positioning_title` + `positioning_body` (rich text assaini). Masqué si vide.
7. **CTA final** — `cta_title` → ancre `#newsletter`.

Le lead magnet gaté (PDF `resources`, `requires_email`) vit désormais dans la section newsletter
(`welcome_gift_label`). `featured_resource` conservé au schéma mais déprécié (non rendu).

## `/ressources/{slug}` — Article
1. **En-tête** — titre, catégorie, date, temps de lecture, cover.
2. **Corps** — `body` (rich text sanitizé), titres ancrables.
3. **CTA** — encart newsletter (« Les Tentacules ») en fin d'article → `/ressources#newsletter`.
4. **Articles liés** (optionnel) — même `category`.

## A11y / SEO
- `h1` = titre. Données structurées `Article` (auteur = Eléonore, datePublished, image). Breadcrumb. Le formulaire de ressource réutilise le flux newsletter (`03` §3) si `requires_email`.

## Critères d'acceptation
- Index fonctionnel avec 0 article (pas de section cassée). Filtres par groupe opérationnels. Téléchargement de ressource : si `requires_email`, passe par le double opt-in ; sinon lien direct. Article : rich text sanitizé, SEO `Article` présent.
