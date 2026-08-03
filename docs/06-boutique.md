# 04 / 06 — Le Laboratoire (ex-boutique)

**Routes** : `/laboratoire` (vitrine + catalogue) · `/laboratoire/{slug}` (fiche produit)
`/boutique` et `/boutique/{slug}` → **301** vers les routes ci-dessus (renommage run 9).

La page est d'abord une **vitrine** de ce qui se prépare (familles d'outils, chantier en
cours, parti pris du jeu, invitation newsletter), pilotée par `shop_page`. Le catalogue
produits et le paiement n'apparaissent que si `shop_enabled` est vrai.
**Source** : `products` (Directus, éditorial) + Stripe (prix/dispo) via `/api/shop/products` · **Rendu** : ISR (revalidation courte) — le prix vient de Stripe.

> Logique d'achat détaillée dans `05-shop`. Ici : présentation et parcours utilisateur.

## `/laboratoire` — Catalogue
1. **En-tête** — titre + intro courte.
2. **Grille produits** — `ProductCard` : visuel (`@nuxt/image`), nom, `tagline`, prix (Stripe), bouton « Voir ».
   - États : **chargement** (squelette), **vide** (« bientôt disponible »), **erreur** (message sobre).
   - N'affiche que les produits `published` (Directus) **et** actifs (Stripe).

## `/laboratoire/{slug}` — Fiche produit
1. **Galerie** — `images` (zoom/lightbox accessible).
2. **Infos** — `name`, `tagline`, prix (Stripe), `description` (rich text), `game_details` (label/value).
3. **Achat** — sélecteur de quantité + bouton « Ajouter » / « Acheter ». Panier minimal multi-produits OU achat direct (cf. `05-shop`).
4. **Mention** — `TVA non applicable, art. 293 B du CGI` près du prix.
5. **Cross-sell** (optionnel) — autres `products` `featured`.

## Parcours
Catalogue → fiche → panier/checkout → **Stripe Checkout hébergé** → retour `/laboratoire/confirmation` → email (Resend). Détail `05-shop`.

## A11y / SEO
- `h1` = nom du produit. Données structurées `Product` (nom, image, prix, disponibilité). Galerie navigable au clavier, `alt` sur visuels.

## Critères d'acceptation
- Prix toujours issus de Stripe (jamais en dur). Produit dépublié (Directus) ou inactif (Stripe) → absent du catalogue. Mention 293 B présente. États vide/chargement/erreur gérés. Lighthouse ≥ 95.
