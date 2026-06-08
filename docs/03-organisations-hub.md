# 04 / 03 — Hub Organisations (B2B)

**Route** : `/organisations` · **Source** : `org_hub_page` + `offers` (audience=organisation) + `testimonials` (b2b) · **Rendu** : SSG/ISR.

## Objectif
Présenter les 3 offres B2B, qualifier le besoin, orienter vers la bonne page offre. **Cette page oriente, elle ne détaille pas** (une phrase + un lien par offre).

## Sections (ordre)
1. **Accroche B2B** — `accroche_title` + `accroche_body`.
2. **Les 3 offres** — `OfferCard` × N depuis `offers` (b2b), triées par `sort` : icône, titre, `short_description`, `duration_label`, `price_label`, bouton « Découvrir » → page offre.
3. **Ma méthode en 4 étapes** — `method_steps` (Cadrage → Diagnostic → Construction → Restitution).
4. **Pour qui ?** — `audience_items` (répéteur).
5. **Témoignages B2B** — `testimonials` (audience=organisation) ; **masqué si vide**.
6. **CTA** — `cta_title` + bouton `/contact`.

## A11y / SEO
- `h1` = `accroche_title`. Cartes offres = liens accessibles, prix annoncés en texte.

## Critères d'acceptation
- Les cartes reflètent dynamiquement la collection `offers` (ajout d'une offre en back-office → carte sans dev). Liens corrects vers chaque page offre (slug). Témoignages masqués si absents.
