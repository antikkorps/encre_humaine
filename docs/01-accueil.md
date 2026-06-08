# 04 / 01 — Accueil

**Route** : `/` · **Source contenu** : `home_page` + `articles` (3 derniers publiés) + `testimonials` (vedette) · **Rendu** : SSG/ISR.

## Objectif
Qualifier les deux audiences en < 5 s et générer le premier clic vers le bon parcours (B2B / B2C).

## Sections (ordre)
1. **Hero** — `hero_title`, `hero_subtitle`, 2 CTA : « Je suis une organisation » → `/organisations` (teal), « Je suis un particulier » → `/particuliers` (orange). Fond teal, au-dessus de la ligne de flottaison.
2. **Ligne de crédibilité** — `stats` (répéteur valeur/label), fond gris clair. Masquer un item incomplet.
3. **Ce que je fais** — 2 blocs (B2B / B2C) : icône, titre, texte, tags, lien vers le hub.
4. **Qui je suis** — `intro_photo` (chaleureuse) + `intro_title`/`intro_text` + lien `/a-propos`.
5. **Témoignage vedette** — `featured_testimonial` ; **section masquée si absent**.
6. **Derniers articles** — 3 derniers `articles` publiés (`ArticleCard`) ; **masquée si aucun**.
7. **CTA final** — `final_cta_title` + bouton `/contact`.

## A11y / SEO
- `h1` = `hero_title`. OG image = `site_settings.default_og_image`.
- CTA = vrais liens (`<a>`/`<NuxtLink>`), libellés explicites.

## Critères d'acceptation
- Les 2 CTA hero mènent aux bons hubs. Sections témoignage et articles **disparaissent proprement** si vides. Lighthouse ≥ 95 mobile. Aucune donnée en dur qui devrait venir de `home_page`.
