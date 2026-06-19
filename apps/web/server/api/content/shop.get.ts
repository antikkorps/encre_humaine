/**
 * Réglages boutique — `GET /api/content/shop` (activation + libellés éditoriaux).
 * Cache court (60s) ; token Directus strictement serveur. Consommé par le lien de
 * navigation (`useShopPage`) et les pages `/boutique` (catalogue, fiche).
 */
export default defineCachedEventHandler(() => loadShopPage(), {
  maxAge: 60,
  name: "content-shop",
  getKey: () => "shop",
});
