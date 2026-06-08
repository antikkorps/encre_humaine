# 04 / 04 — Hub Particuliers (B2C)

**Route** : `/particuliers` · **Source** : `b2c_hub_page` + `faq_items` (scope=b2c) + `testimonials` (b2c) · **Rendu** : SSG/ISR.

## Objectif
Accueillir avec empathie, orienter vers la bonne offre. **Ton différent du B2B** : moins de chiffres, plus d'émotion.

## Sections (ordre)
1. **Accroche empathique** — `accroche_title` + `accroche_body`.
2. **Deux situations, deux offres** — bloc A (`situation_a_*` → `/particuliers/clarifier-avancer`) / bloc B (`situation_b_*` → `/particuliers/booster-recherche`).
3. **Comment je travaille** — `how_i_work_body` (séances visio, rythme adapté, « je ne suis pas thérapeute »).
4. **Témoignage** — `featured_testimonial` (b2c) ; **masqué si vide**.
5. **FAQ** — `faq_items` (scope=b2c) via `FaqAccordion` (CPF non, c'est pour qui, durée, 1ʳᵉ séance).
6. **CTA** — bouton « Réserver une séance découverte gratuite » → `/contact`.

## A11y / SEO
- `h1` = `accroche_title`. Accordéon FAQ accessible (ARIA, clavier).

## Critères d'acceptation
- Les 2 blocs situation pointent vers les bonnes offres. FAQ rendue depuis Directus, repliable au clavier. Témoignage masqué si absent.
