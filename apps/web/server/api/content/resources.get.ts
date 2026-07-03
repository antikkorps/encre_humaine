/**
 * Contenu composé de l'index Ressources — `GET /api/content/resources`
 * (docs/07-ressources.md). Cache court (60s) ; token Directus strictement serveur.
 * Consommé par `/ressources` via `useFetch`.
 */
export default cachedContent("resources", () => loadResourcesContent());
