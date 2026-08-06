# 04 / 07 — Ressources (Blog)

**Routes** : `/ressources` (index) · `/ressources/{slug}` (article)
**Source** : `resources_page` + `articles` + `article_categories` + `resources` · **Rendu** : SSG/ISR.

> Schéma et gabarits en phase 1 ; rédaction des articles en phase 2-3. La page doit fonctionner **avec 0 article** (état vide propre).

## `/ressources` — Page fusionnée « Les Tentacules » (blog + newsletter)
> **Fusion (2026-07) :** le blog et la newsletter sont réunis sur `/ressources` (cf. `08`). 7 sections :
1. **Hero** — `accroche_title` + `accroche_body` + `hero_signature` (🐙 signature).
2. **Explorer les Tentacules** — filtres par `article_categories.group` (Organisations / Parcours professionnels / Terrain), chrome statique (emoji + mots-clés). Composant filtre accessible.
3. **À lire en premier** — `featured_article` (M2O `articles`) : article éditorial vedette. Masqué si vide.
4. **Dernières tentacules publiées** — carrousel `ArticleCarousel` limité aux **3 dernières** publications du filtre actif, la carte poulpe finale (→ `/ressources/tous`) arrivant en 4e position, donc à un cran de flèche. **État vide propre si aucun article.**
   > Les cartes gardent la largeur de la maquette (21 rem) : les resserrer pour faire tenir les quatre d'un coup tassait les titres sur trois lignes et trouait le chapô justifié. La 4e carte dépasse donc légèrement — c'est le signal de défilement attendu.
5. **Newsletter intégrée** (`id="newsletter"`) — `newsletter_page` + `NewsletterForm` (cf. `08`).
6. **Positionnement** — `positioning_title` + `positioning_body` (rich text assaini). Masqué si vide.
7. **CTA final** — `cta_title` → ancre `#newsletter`.

Le lead magnet gaté (PDF `resources`, `requires_email`) vit désormais dans la section newsletter
(`welcome_gift_label`). `featured_resource` conservé au schéma mais déprécié (non rendu).

## `/ressources/tous` — Tous les articles

Page de **parcours exhaustif**, contrepartie de la limitation à 3 du carrousel : sans elle, les
publications au-delà de la 3e ne seraient listées nulle part (décision 2026-08-06).

1. **Hero** — titre statique + chapô.
2. **Recherche** — champ plein texte sur `title` + `excerpt` + nom de catégorie, **insensible à la
   casse et aux accents** (« equipe » trouve « équipe »).
3. **Filtres** — `ArticleFilters`, le composant mutualisé avec `/ressources`.
4. **Grille + chargement au défilement** — paliers de 9 via `IntersectionObserver`, doublé d'un
   bouton « Afficher plus » qui reste le contrôle accessible (clavier, lecteurs d'écran). L'observer
   est **réarmé à chaque palier**, sinon une sentinelle restée visible fige la liste en cours de route.

Aucun appel réseau supplémentaire : la page consomme le même `/api/content/resources` que
`/ressources` (cache partagé), et « charger plus » n'est qu'un compteur côté client.

> ⚠️ Route statique prioritaire sur `/ressources/[slug]` : un article dont le slug serait
> littéralement `tous` deviendrait inaccessible.

## `/ressources/{slug}` — Article
1. **En-tête** — titre, catégorie, date, temps de lecture, cover.
2. **Corps** — `body` (rich text sanitizé), titres ancrables.
3. **CTA** — encart newsletter (« Les Tentacules ») en fin d'article → `/ressources#newsletter`.
4. **Articles liés** (optionnel) — même `category`.

## A11y / SEO
- `h1` = titre. Données structurées `Article` (auteur = Eléonore, datePublished, image). Breadcrumb. Le formulaire de ressource réutilise le flux newsletter (`03` §3) si `requires_email`.

## Critères d'acceptation
- Index fonctionnel avec 0 article (pas de section cassée). Filtres par groupe opérationnels.
- **Aucun article inatteignable** : tout ce qui est publié se retrouve sur `/ressources/tous` (le carrousel de l'index n'en montre que 3). Recherche et filtres s'y combinent, et changer l'un ou l'autre remet la liste au premier palier. Téléchargement de ressource : si `requires_email`, passe par le double opt-in ; sinon lien direct. Article : rich text sanitizé, SEO `Article` présent.
