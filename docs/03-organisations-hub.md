# 04 / 03 — Hub Organisations (B2B)

**Route** : `/organisations` · **Source** : `org_hub_page` + `offers` (audience=organisation) + `faq_items` (`scope=org`) + `testimonials` (b2b) · **Rendu** : SSG/ISR.

## Objectif
Présenter les 3 offres B2B, qualifier le besoin, orienter vers la bonne page offre. **Cette page oriente, elle ne détaille pas** (une phrase + un lien par offre).

## Sections (ordre)
1. **Accroche B2B** — `accroche_title` + `accroche_body`.
2. **Trois enjeux, trois accompagnements** — cartes détaillées `situation_{a,b,c}_*` si elles sont renseignées, sinon repli sur `OfferCard` × N depuis `offers` (b2b), triées par `sort`. Chaque carte finit par : « Résultat », un 2e encadré au libellé libre (`takeaway_label` / `takeaway_body` — « Ce que ça vous évite », « Pourquoi ça compte », « Ce que vous y gagnez »), la ligne **Investissement · Format**, puis le CTA vers la page d'offre.
3. **Ma méthode en 4 étapes** — `method_steps` (Cadrage → Diagnostic → Construction → Restitution).
4. **Vous êtes RH ou dirigeant ?** — `audience_title` (doré via `**…**`) + `audience_body` + `audience_conclusion`.
5. **FAQ** — `faq_items` `scope=org` ; **masquée si vide**. Périmètre propre au hub, symétrique de `scope=b2c_hub` côté Particuliers : les FAQ des 3 offres B2B ne remontent pas ici (elles restent sur leur page offre).
6. **Témoignages B2B** — `testimonials` (audience=organisation) ; **masqué si vide**.
7. **CTA** — `cta_title` + bouton `/contact`.

> **Run 16 (2026-09-11)** — deux blocs retirés à la demande d'Éléonore : « Ce que j'observe le plus souvent » (`observe_*`) et la liste « cet accompagnement est fait pour vous si… » (`audience_items`). Les champs existent toujours dans l'admin (masqués) : le texte est conservé, il n'est simplement plus rendu.

## A11y / SEO
- `h1` = `accroche_title`. Cartes offres = liens accessibles, prix annoncés en texte.

## Critères d'acceptation
- Investissement et format d'une carte d'enjeu ne sont **jamais saisis deux fois** : vides sur la carte, ils reprennent ceux de la fiche de l'offre liée (par `ctaLink`).
- Les cartes reflètent dynamiquement la collection `offers` (ajout d'une offre en back-office → carte sans dev). Liens corrects vers chaque page offre (slug). Témoignages masqués si absents.
- FAQ masquée tant qu'aucune question n'est rangée dans `scope=org` : la page se livre sans contenu FAQ, l'éditrice l'ouvre quand elle le décide, sans intervention de dev.
