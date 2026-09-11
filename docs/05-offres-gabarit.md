# 04 / 05 — Gabarit page Offre (B2B & B2C)

**Routes** : `/organisations/{slug}` (audit-rh, carte-des-talents, de-l-expert-au-manager) · `/particuliers/{slug}` (clarifier-son-projet, se-repositionner)
**Source** : `offers` (par `slug`) + `faq_items` + `testimonials` · **Rendu** : SSG/ISR (génération par slug).

> **Gabarit unique** pour les 5 pages (DRY). Schéma posé en phase 1 ; contenu détaillé rédigé en phase 2. Les routes et le gabarit existent dès la phase 1 pour ne pas refondre la nav.

## Sections (ordre de rendu, champs `offers`)
Toutes les sections **se masquent si leurs champs sont vides** (une offre n'en remplit qu'une partie).
1. **Accroche** — `accroche_title` + `accroche_subtitle` (hero) + `accroche_body` + `accroche_signature` + CTA (`cta_label`).
2. **Ce que ça change (bénéfices)** — `outcomes_title` / `_intro` / `outcomes` (répéteur title/body).
3. **Ce que je vois souvent (contexte)** — `context_title` / `context_items` / `context_conclusion`.
4. **Preuve par l'exemple** (run 16) — habillage `proof_eyebrow` / `proof_title` / `proof_intro` + cas de `case_studies` qui cochent l'offre dans `offer_scopes`. Même carte et même carrousel que l'accueil (1 cas → pleine largeur, 2+ → piste défilante) ; **masquée si aucun cas ne pointe l'offre**.
5. **Une approche qui relie** — `approche_title` / `approche_body` (rich text) / `approche_signature` (encadré).
6. **Un regard / une expérience** (optionnel) — `background_title` / `background_body` (rich text, listes possibles). *Récit terrain, surtout B2C.*
7. **Ce que comprend la mission / Ce qu'on fait ensemble** + **Pour qui (✓) et pas pour vous (✗)** (2 colonnes) — `mission_*` d'un côté, `audience_fit` (✓) + `audience_fit_exclude` (✗) + `audience_fit_conclusion` de l'autre.
8. **Investissement** — `price_label` + `price_note` (ex. paiement 2-3×, séance découverte offerte). **Mention `TVA non applicable, art. 293 B du CGI`** affichée près du prix (franchise en base). Remonté ici au run 16 : le prix se lit dans la foulée de ce qu'il achète.
9. **Comment ça se passe / Le format** — `format_title` / `format_body` (rich text).
10. **Ce que vous emportez** (optionnel) — `takeaways_title` / `_intro` / `takeaways` (répéteur, ✓).
11. **FAQ** — `faq_items` filtrés par scope (`FAQ_SCOPE_BY_SLUG` + `general`).
12. **Témoignages** — **centralisés** : liste `testimonials` filtrée par `audience` de l'offre (B2B → organisation, B2C → particulier), vedettes d'abord (`-featured, sort`) ; masqué si vide. (Plus de pin M2O par offre — voir `04` §Centralisation.)
13. **CTA final** — `cta_title` / `cta_body` / `cta_label` → `/contact`.

## Mise en forme (éditoriale — navy + or)
Traitement inspiré de la maquette Audit RH : hero éditorial aligné à gauche (eyebrow = `title`),
signature d'accroche en **bandeau marine + CTA**, bénéfices **numérotés** (01-0N) avec icône, contexte
en **cartes à icônes**, mission en **panneau marine sombre** + « pour qui » en panneau clair (2 colonnes),
investissement en cartes Format/Tarif, CTA final marine. Orga = fonds froids (teal-50) / B2C = fonds
chauds (orange-50) ; accents dorés + panneaux marine communs. Icônes **Material Symbols** via `@nuxt/icon`
(server bundle **local**, `fallbackToApi: false` → CSP-safe, zéro appel externe). Les répéteurs
`outcomes` / `context_items` / `mission_includes` portent un sous-champ `icon` (clé Iconify hyphénée,
ex. `trending-up`), avec repli par section.
> ⚠️ `@nuxt/icon` **épinglé en 1.15.0** : la 2.x tire `h3@2` (rc) incompatible avec Nuxt 4.4.8 (h3 v1).

## Renvois croisés (bonne pratique du brief)
- `se-repositionner` → section « Clarifier vs Booster » (via `context`) + liste ✗ « pas encore clarifié votre projet → *Clarifier & Avancer* ».

## FAQ par scope (`faq_items`)
Chaque offre tire ses FAQ par `scope` (+ `general`), cf. `FAQ_SCOPE_BY_SLUG` : `audit-rh`→audit, `carte-des-talents`→competences, `de-l-expert-au-manager`→managers, `clarifier-son-projet`→b2c (partagé avec le hub Particuliers), `se-repositionner`→**booster** (FAQ dédiée, ne fuit pas sur le hub/clarifier).

## A11y / SEO
- `h1` = `accroche_title`. SEO par offre (`meta_*`, `og_image`). Breadcrumb (hub → offre).

## Critères d'acceptation
- Un cas concret ne sort sur une page d'offre que si elle est **cochée** dans `case_studies.offer_scopes` (règle inverse du défaut des témoignages : un cas raconte une mission précise).
- Une seule implémentation de gabarit sert les 5 offres. Ajout/édition d'une offre en back-office → page complète sans dev. Mention 293 B présente. Prix affichés sans ligne de TVA (franchise en base).
