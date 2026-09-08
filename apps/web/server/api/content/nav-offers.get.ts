/**
 * Offres pour la navigation & le pied de page — `GET /api/content/nav-offers`.
 * Cache court (60s), token Directus strictement serveur (docs/06 §1).
 */
export default cachedContent("nav-offers", () => loadNavOffers());
