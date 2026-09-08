# 04 / 01 — Accueil

**Route** : `/` · **Source contenu** : `home_page` + `articles` (3 derniers publiés) + `testimonials` (vedette) + `case_studies` (cas concrets) · **Rendu** : SSG/ISR.

## Objectif
Dérouler un tunnel narratif B2B (PME) — du problème à la prise de rendez-vous — tout en gardant une porte d'entrée claire pour les particuliers et les ressources.

## Sections (ordre)
1. **Hero** — `hero_eyebrow` (pastille de positionnement, ex. « Conseil RH pour dirigeants de PME et ETI »), `hero_title` (h1), `hero_subtitle`, `hero_tagline` (ligne d'expertise • séparée), `hero_proofs` (micro-preuves ✓). 2 CTA : principal `hero_cta_primary_label` → `/contact` (RDV, papier), secondaire `hero_cta_secondary_label` → ancre `#approche` (scroll méthode). Fond encre sombre.
2. **Ligne de crédibilité** — `stats` (répéteur valeur/label). **Masquée si vide** (par défaut vide au seed : la preuve est portée par le hero).
3. **Problème** — `recognition_title`, `recognition_subtitle`, `recognition_items` (5–6 problématiques), `recognition_conclusion` (**pas d'italique** : le poids vient de la taille et de la mise en avant dorée). **Masquée si tout est vide.**
4. **Promesse / Offre** (`#offres`) — `build_title`, `build_blocks` (3 blocs `title`/`body`/`url`/`link_label`), CTA de section `build_cta_label` → `build_cta_url` (défaut `/organisations`). CTA masqué si sans libellé. Section **centrée de bout en bout** et **titres des 3 cartes en doré** (Éléonore, 2026-08-13). Les blocs sont **numérotés 1-2-3** (pas d'icône) et **chacun renvoie vers sa page d'offre** — le chiffre dit qu'il y a trois offres, le lien évite un détour par le hub (audit du 2026-09-08).
5. **Méthode** (`#approche`) — `method_title`, `method_subtitle`, `method_steps` (répéteur `title`/`body`, **numérotés à l'affichage**). Fond teal clair.
6. **Preuve par l'exemple** — `proof_eyebrow`, `proof_title`, `proof_intro` + les cas publiés de `case_studies` (situation / ce qui a été mis en place / résultat, image optionnelle). **1 cas → pleine largeur ; 2+ → carrousel** (`SnapCarousel`). **Masquée tant qu'aucun cas n'est publié.** Répond au reproche central de l'audit : aucun exemple complet et concret sur le site.
7. **Secteurs d'intervention** — `sectors_eyebrow`, `sectors_title`, `sectors_intro`, `sectors_items` (répéteur `icon`/`title`/`body`). **Masquée si vide.**
8. **Ma conviction** — respiration, pas une section comme les autres : `why_subtitle` (phrase de transition) puis `why_conclusion` seule, en gros, sous un intitulé discret `why_eyebrow` (défaut « Ma conviction »). Les « trois expertises » qui vivaient ici sont passées sur `/a-propos` (`about_page.expertises_*`) : elles faisaient doublon avec les secteurs. `why_title` / `why_items` restent en base, **masqués dans l'admin**.
9. **À propos** — `intro_photo` (2 colonnes) + `intro_title`/`intro_text` + CTA `intro_cta_label` → `/a-propos`. Fond gris clair.
10. **Particuliers** — `b2c_section_title`, `b2c_section_text`, `b2c_cards` (2 axes `title`/`body`), CTA `b2c_cta_label` → `/particuliers`. Accent orange.
11. **Témoignage vedette** — `featured_testimonial` ; **section masquée si absent**.
12. **Ressources** — `resources_title`, `resources_subtitle` + 3 derniers `articles` publiés (`ArticleCard`) + CTA `resources_cta_label` → `/ressources` ; **masquée si aucun article**.
13. **CTA final** — `final_cta_title` + `final_cta_description` (réassurance) + bouton `final_cta_label` → `/contact`. **Masqué si pas de titre.**

## Naming
CTA hero nommés par **fonction** (`primary`/`secondary`), pas par audience — l'audience B2B/B2C est portée par les sections 4 et 8. Aucun couplage au prestataire de RDV (le lien reste `/contact`).

## A11y / SEO
- `h1` = `hero_title` (unique). Titres de section en `h2`, cartes en `h3` (hiérarchie continue). OG image = `site_settings.default_og_image` par défaut.
- CTA = vrais liens (`<a>`/`<NuxtLink>`), libellés explicites. Ancres `#offres` / `#approche` avec `scroll-mt`.

## Critères d'acceptation
- Toutes les sections **disparaissent proprement** si vides (stats, problème, offre, méthode, preuve, secteurs, conviction, à propos, particuliers, témoignage, ressources, CTA final). Le hero reste toujours affiché (fallbacks = garde-fous, jamais du contenu éditorial).
- CTA principal hero → `/contact` ; secondaire → scroll `#approche`. Lighthouse ≥ 95 mobile. Aucune donnée en dur qui devrait venir de `home_page`.
