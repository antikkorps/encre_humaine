# 04 / 05 — Gabarit page Offre (B2B & B2C)

**Routes** : `/organisations/{slug}` (audit-rh, competences-parcours, managers-equipes) · `/particuliers/{slug}` (clarifier-avancer, booster-recherche)
**Source** : `offers` (par `slug`) + `faq_items` + `testimonials` · **Rendu** : SSG/ISR (génération par slug).

> **Gabarit unique** pour les 5 pages (DRY). Schéma posé en phase 1 ; contenu détaillé rédigé en phase 2. Les routes et le gabarit existent dès la phase 1 pour ne pas refondre la nav.

## Sections (ordre de rendu, champs `offers`)
Toutes les sections **se masquent si leurs champs sont vides** (une offre n'en remplit qu'une partie).
1. **Accroche** — `accroche_title` + `accroche_subtitle` (hero) + `accroche_body` + `accroche_signature` + CTA (`cta_label`).
2. **Ce que ça change (bénéfices)** — `outcomes_title` / `_intro` / `outcomes` (répéteur title/body).
3. **Ce que je vois souvent (contexte)** — `context_title` / `context_items` / `context_conclusion`.
4. **Une approche qui relie** — `approche_title` / `approche_body` (rich text) / `approche_signature` (encadré).
5. **Ce que comprend la mission / Ce qu'on fait ensemble** — `mission_title` / `mission_intro` / `mission_includes`.
6. **Un regard / une expérience** (optionnel) — `background_title` / `background_body` (rich text, listes possibles). *Récit terrain, surtout B2C.*
7. **Comment ça se passe / Le format** — `format_title` / `format_body` (rich text).
8. **Pour qui (✓) et pas pour vous (✗)** — `audience_fit` (✓) + `audience_fit_exclude` (✗, optionnel) + `audience_fit_conclusion`.
9. **Ce que vous emportez** (optionnel) — `takeaways_title` / `_intro` / `takeaways` (répéteur, ✓).
10. **Investissement** — `price_label` + `price_note` (ex. paiement 2-3×, séance découverte offerte). **Mention `TVA non applicable, art. 293 B du CGI`** affichée près du prix (franchise en base).
11. **FAQ** — `faq_items` filtrés par scope (`FAQ_SCOPE_BY_SLUG` + `general`).
12. **Témoignage** — `featured_testimonial` ; masqué si vide.
13. **CTA final** — `cta_title` / `cta_body` / `cta_label` → `/contact`.

## Renvois croisés (bonne pratique du brief)
- `booster-recherche` → section « Clarifier vs Booster » (via `context`) + liste ✗ « pas encore clarifié votre projet → *Clarifier & Avancer* ».

## FAQ par scope (`faq_items`)
Chaque offre tire ses FAQ par `scope` (+ `general`), cf. `FAQ_SCOPE_BY_SLUG` : `audit-rh`→audit, `competences-parcours`→competences, `managers-equipes`→managers, `clarifier-avancer`→b2c (partagé avec le hub Particuliers), `booster-recherche`→**booster** (FAQ dédiée, ne fuit pas sur le hub/clarifier).

## A11y / SEO
- `h1` = `accroche_title`. SEO par offre (`meta_*`, `og_image`). Breadcrumb (hub → offre).

## Critères d'acceptation
- Une seule implémentation de gabarit sert les 5 offres. Ajout/édition d'une offre en back-office → page complète sans dev. Mention 293 B présente. Prix affichés sans ligne de TVA (franchise en base).
