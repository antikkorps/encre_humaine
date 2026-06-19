/**
 * Document légal — `GET /api/content/legal/:slug` (docs/10-legal.md).
 * Cache court (60s, clé = slug) ; token Directus strictement serveur. 404 si aucun
 * document publié pour ce slug. Consommé par les pages légales via `LegalPage`.
 */
export default defineCachedEventHandler(
  async (event) => {
    const slug = getRouterParam(event, "slug") ?? "";
    const doc = await loadLegalDocument(slug);
    if (!doc) {
      throw createError({ statusCode: 404, statusMessage: "Document introuvable" });
    }
    return doc;
  },
  {
    maxAge: 60,
    name: "content-legal",
    getKey: (event) => getRouterParam(event, "slug") ?? "",
  },
);
