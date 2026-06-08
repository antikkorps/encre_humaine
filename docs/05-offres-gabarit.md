# 04 / 05 — Gabarit page Offre (B2B & B2C)

**Routes** : `/organisations/{slug}` (audit-rh, competences-parcours, managers-equipes) · `/particuliers/{slug}` (clarifier-avancer, booster-recherche)
**Source** : `offers` (par `slug`) + `faq_items` + `testimonials` · **Rendu** : SSG/ISR (génération par slug).

> **Gabarit unique** pour les 5 pages (DRY). Schéma posé en phase 1 ; contenu détaillé rédigé en phase 2. Les routes et le gabarit existent dès la phase 1 pour ne pas refondre la nav.

## Sections (ordre, champs `offers`)
1. **Accroche** — `accroche_title` + `accroche_body`.
2. **Ce que comprend la mission / Ce qu'on fait ensemble** — `mission_includes` (répéteur).
3. **(B2B) Comment ça se passe** — étapes (réutilise `method_steps` du hub ou champ dédié) · **(B2C) Le format** — `format_body`.
4. **Ce que vous en retirez / repartez avec** — `outcomes` (répéteur title/body).
5. **Pour qui (et pas pour qui)** — `audience_fit` (répéteur).
6. **Investissement** — `price_label` + `price_note` (ex. acompte 30 %, paiement 2×, séance découverte offerte). **Mention `TVA non applicable, art. 293 B du CGI`** affichée près du prix (franchise en base).
7. **FAQ** — `faq` (M2M `faq_items` ou filtre par scope).
8. **Témoignage** — `featured_testimonial` ; masqué si vide.
9. **CTA** — `cta_label` → `/contact` (ou Calendly pour B2C : séance découverte).

## Renvois croisés (bonne pratique du brief)
- `booster-recherche` → encart « Pas encore sûr de votre cap ? Commencez par *Clarifier & Avancer* ».

## A11y / SEO
- `h1` = `accroche_title`. SEO par offre (`meta_*`, `og_image`). Breadcrumb (hub → offre).

## Critères d'acceptation
- Une seule implémentation de gabarit sert les 5 offres. Ajout/édition d'une offre en back-office → page complète sans dev. Mention 293 B présente. Prix affichés sans ligne de TVA (franchise en base).
