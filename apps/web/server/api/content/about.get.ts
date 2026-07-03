/**
 * Contenu composé de la page « À propos » — `GET /api/content/about`
 * (docs/02-a-propos.md). Cache court (60s) ; rich text déjà assaini côté serveur,
 * token Directus strictement serveur (docs/06 §1). Consommé par la page via `useFetch`.
 */
export default cachedContent("about", () => loadAboutContent());
