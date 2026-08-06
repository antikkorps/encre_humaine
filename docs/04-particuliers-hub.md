# 04 / 04 — Hub Particuliers (B2C)

**Route** : `/particuliers` · **Source** : `b2c_hub_page` + `faq_items` (scope=b2c) + `testimonials` (b2c) · **Rendu** : SSG/ISR.

## Objectif
Accueillir avec empathie, orienter vers la bonne offre. **Ton différent du B2B** : moins de chiffres, plus d'émotion. Gabarit riche calqué sur `offers` (bénéfices, cartes détaillées, encadrés signature).

## Sections (ordre)
1. **Accroche empathique** — `accroche_title` (h1) + `accroche_subtitle` (hero) + `accroche_body` (texte) + `accroche_signature` (phrase signature) + `accroche_cta_label` → `/contact`.
2. **Ce que vous venez chercher** (bénéfices) — `outcomes_title` + `outcomes_intro` + `outcomes` (répéteur titre/corps).
3. **Deux situations, deux accompagnements** (cartes détaillées) — `situations_title` + `situations_intro` ; par carte A/B : `situation_x_title`, `situation_x_audience` (« Pour qui ? »), `situation_x_items` (« Ce que nous travaillons »), `situation_x_result` (« Résultat »), CTA `situation_x_cta_*` → offre (`/particuliers/clarifier-avancer` / `/particuliers/booster-recherche`).
4. **Ma façon d'accompagner** — `how_i_work_title` + `how_i_work_body` (rich text) + `how_i_work_signature` (encadré).
5. **Pourquoi c'est différent** — `why_different_title` + `why_different_body` (rich text, liste possible).
6. **Comment se déroule l'accompagnement** — `format_title` + `format_items` (puces) + `format_body`.
7. **FAQ** — `faq_items` (scope=b2c) via `FaqAccordion` (CPF non, c'est pour qui, 1ᵉʳ échange). ⚠️ Ce périmètre est **partagé** avec l'offre `/particuliers/clarifier-avancer` : une question modifiée ici change les deux pages. Le libellé admin du périmètre le dit explicitement (docs/02 §5 `faq_items`).
8. **Témoignages** — **centralisés** : liste `testimonials` filtrée `audience=particulier`, vedettes d'abord (`-featured, sort`) ; **masqué si vide**.

> **Centralisation (2026-07) :** les témoignages ne sont plus pinnés par page (M2O). Chaque surface
> (org hub, hub particuliers, pages offres) tire la liste `testimonials` filtrée par `audience`
> (helpers `TESTIMONIAL_FIELDS` / `TESTIMONIAL_SORT` dans `_shared`). Tagger un témoignage `audience` +
> `featured` suffit pour qu'il apparaisse au bon endroit. L'accueil garde son témoignage vedette (M2O).
9. **Appel à l'action** — `cta_title` + `cta_body` + `cta_label` + `cta_subtext`, bouton → `/contact`.

Les deux champs rich text (`how_i_work_body`, `why_different_body`) et les réponses FAQ sont **assainis côté serveur** (docs/06 §1). Sections vides **masquées proprement**.

## A11y / SEO
- `h1` = `accroche_title`. Accordéon FAQ accessible (ARIA, clavier). Accent orange (public B2C).

## Critères d'acceptation
- Les 2 cartes situation pointent vers les bonnes offres. FAQ rendue depuis Directus, repliable au clavier. Témoignage masqué si absent. Bénéfices, format et encadrés signature masqués si vides.
