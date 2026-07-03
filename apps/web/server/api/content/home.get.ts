/**
 * Contenu composé de l'accueil — `GET /api/content/home` (docs/01-accueil.md).
 * Cache court (60s) pour amortir Directus (SSG/ISR) ; le token lecture reste
 * strictement serveur (docs/06 §1). La page consomme ce contrat via `useFetch`.
 */
export default cachedContent("home", () => loadHomeContent());
