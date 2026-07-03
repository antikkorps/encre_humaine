/**
 * Contenu composé du hub Organisations — `GET /api/content/org-hub`
 * (docs/03-organisations-hub.md). Cache court (60s) ; token Directus strictement
 * serveur (docs/06 §1). Consommé par `/organisations` via `useFetch`.
 */
export default cachedContent("org-hub", () => loadOrgHubContent());
