# 04 / 00 — Conventions globales des pages

> Layout partagé, navigation, footer, SEO par défaut, inventaire de composants, états globaux. Chaque spec de page (`01`..`09`) hérite de ces conventions.

## Layout

- **En-tête** (sticky léger) : logo (poulpe + « L'Encre Humaine »), nav principale, CTA « Prendre RDV ».
- **Nav principale** : Accueil · À propos · Pour les organisations · Pour les particuliers · Ressources · Travaillons ensemble.
- **Menu mobile** : composant accessible (primitive headless), fermeture clavier/Escape, focus trap.
- **Pied de page** : pitch court, colonnes (Organisations / Particuliers / Liens), contact (email, LinkedIn, localisation), mentions légales + CGV + confidentialité, mention `TVA non applicable, art. 293 B du CGI` (depuis `site_settings`).
- **Bandeau de consentement** : présent globalement, gate les embeds tiers (cf. `06-security`).

## SEO (défauts, cf. `00` §4)

- `@nuxtjs/seo` : sitemap, robots, canonical, OG/Twitter, meta par page.
- `meta_title` / `meta_description` issus du contenu (fallbacks `site_settings`).
- Données structurées : `LocalBusiness` (global, depuis `site_settings`) + `Article` (pages article) + `BreadcrumbList`.
- Langue : `fr-FR` uniquement.

## Performance (objectif Lighthouse ≥ 95 mobile)

- SSG/ISR par défaut, hydratation minimale.
- `@nuxt/image` partout (AVIF/WebP, responsive, lazy hors viewport, dimensions explicites → CLS ~0).
- Polices : `nuxt/fonts`, `font-display: swap`, préchargement de la police de titres.
- Aucune lib JS lourde côté public (cf. décision thème en suspens : Tailwind + primitives headless).

## Accessibilité (WCAG 2.2 AA)

- Hiérarchie de titres correcte (un seul `h1`/page), landmarks, `skip-to-content`.
- Contrastes AA sur teal/orange (à vérifier sur les nuances retenues).
- États focus visibles, navigation clavier complète, `alt` sur toute image de contenu.
- Cibles tactiles ≥ 24px.

## États à prévoir sur chaque composant dynamique

- **Vide** (ex. aucun témoignage, aucun article) → masquage propre, jamais de section cassée ni de placeholder visible.
- **Chargement** (catalogue) → squelette discret.
- **Erreur** (échec fetch Stripe/Directus) → message sobre, pas d'écran blanc.

## Composants réutilisables (inventaire)

`AppHeader`, `AppFooter`, `NavMobile`, `ConsentBanner`, `CtaBlock`, `TestimonialCard`, `OfferCard`, `ArticleCard`, `ProductCard`, `FaqAccordion`, `StatRow`, `SectionHeading`, `ContactForm`, `NewsletterForm`, `BookingEmbed` (prise de RDV, chargé au consentement), `RichText` (rendu sûr du WYSIWYG Directus).
