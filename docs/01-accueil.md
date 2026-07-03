# 04 / 01 — Accueil

**Route** : `/` · **Source contenu** : `home_page` + `articles` (3 derniers publiés) + `testimonials` (vedette) · **Rendu** : SSG/ISR.

## Objectif
Dérouler un tunnel narratif B2B (PME) — du problème à la prise de rendez-vous — tout en gardant une porte d'entrée claire pour les particuliers et les ressources.

## Sections (ordre)
1. **Hero** — `hero_title` (h1), `hero_subtitle`, `hero_tagline` (ligne d'expertise • séparée), `hero_proofs` (micro-preuves ✓). 2 CTA : principal `hero_cta_primary_label` → `/contact` (RDV, papier), secondaire `hero_cta_secondary_label` → ancre `#approche` (scroll méthode). Fond encre sombre.
2. **Ligne de crédibilité** — `stats` (répéteur valeur/label). **Masquée si vide** (par défaut vide au seed : la preuve est portée par le hero).
3. **Problème** — `recognition_title`, `recognition_subtitle`, `recognition_items` (5–6 problématiques), `recognition_conclusion`. **Masquée si tout est vide.**
4. **Promesse / Offre** (`#offres`) — `build_title`, `build_blocks` (3 blocs `title`/`body`), CTA de section `build_cta_label` → `build_cta_url` (défaut `/organisations`). CTA masqué si sans libellé.
5. **Méthode** (`#approche`) — `method_title`, `method_subtitle`, `method_steps` (répéteur `title`/`body`, **numérotés à l'affichage**). Fond teal clair.
6. **Signature / Positionnement** — `why_title`, `why_subtitle`, `why_items` (piliers de la double expertise), `why_conclusion` (bloc différenciant).
7. **À propos** — `intro_photo` (2 colonnes) + `intro_title`/`intro_text` + CTA `intro_cta_label` → `/a-propos`. Fond gris clair.
8. **Particuliers** — `b2c_section_title`, `b2c_section_text`, `b2c_cards` (2 axes `title`/`body`), CTA `b2c_cta_label` → `/particuliers`. Accent orange.
9. **Témoignage vedette** — `featured_testimonial` ; **section masquée si absent**.
10. **Ressources** — `resources_title`, `resources_subtitle` + 3 derniers `articles` publiés (`ArticleCard`) + CTA `resources_cta_label` → `/ressources` ; **masquée si aucun article**.
11. **CTA final** — `final_cta_title` + `final_cta_description` (réassurance) + bouton `final_cta_label` → `/contact`. **Masqué si pas de titre.**

## Naming
CTA hero nommés par **fonction** (`primary`/`secondary`), pas par audience — l'audience B2B/B2C est portée par les sections 4 et 8. Aucun couplage au prestataire de RDV (le lien reste `/contact`).

## A11y / SEO
- `h1` = `hero_title` (unique). Titres de section en `h2`, cartes en `h3` (hiérarchie continue). OG image = `site_settings.default_og_image` par défaut.
- CTA = vrais liens (`<a>`/`<NuxtLink>`), libellés explicites. Ancres `#offres` / `#approche` avec `scroll-mt`.

## Critères d'acceptation
- Toutes les sections **disparaissent proprement** si vides (stats, problème, offre, méthode, signature, à propos, particuliers, témoignage, ressources, CTA final). Le hero reste toujours affiché (fallbacks = garde-fous, jamais du contenu éditorial).
- CTA principal hero → `/contact` ; secondaire → scroll `#approche`. Lighthouse ≥ 95 mobile. Aucune donnée en dur qui devrait venir de `home_page`.
