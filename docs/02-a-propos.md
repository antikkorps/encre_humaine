# 04 / 02 — À propos

**Route** : `/a-propos` · **Source** : `about_page` · **Rendu** : SSG/ISR.

## Objectif
Créer confiance et connexion. Page souvent la plus lue d'un site de consultant indépendant. Ton première personne, sans fausse modestie.

## Sections (ordre)
1. **Accroche** — `accroche` (grand texte, fond clair).
2. **Mon histoire** — `story_photo` (gauche) + `story_body` (rich text, droite sur desktop).
3. **Pourquoi L'Encre Humaine** — `why_title` + `why_body`.
4. **Le poulpe** — `octopus_body` (ton avec humour).
5. **Ce en quoi je crois** — `convictions` (répéteur title/body).
6. **Ma façon de travailler** — `how_i_work` (répéteur).
7. **Ce que je ne fais pas** — `what_i_dont_do`.
8. **Portrait + citation** — `portrait_photo` + `personal_quote`.
9. **CTA** — `cta_label` → `/contact`.

## A11y / SEO
- `h1` = titre de l'accroche. Images de portrait avec `alt` descriptif.
- `RichText` : rendu sécurisé du WYSIWYG (sanitization).

## Critères d'acceptation
- Tout le contenu provient de `about_page` (éditable). Mise en page 2 colonnes desktop / empilée mobile. Rich text rendu proprement et sanitizé.
