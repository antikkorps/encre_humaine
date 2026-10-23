/**
 * Textes d'un diagnostic — `GET /api/content/diagnostic/:kind` (b2b | b2c),
 * docs/11-diagnostics.md. Cache court (60s, clé = kind) ; token Directus
 * strictement serveur. Consommé par `/diagnostic-rh`, `/diagnostic-projet` et
 * la page de rapport.
 */
export default defineCachedEventHandler(
  async (event) => {
    const kind = getRouterParam(event, "kind");
    if (kind !== "b2b" && kind !== "b2c") {
      throw createError({ statusCode: 404, statusMessage: "Diagnostic introuvable" });
    }
    return loadDiagnosticContent(kind);
  },
  {
    maxAge: 60,
    name: "content-diagnostic",
    getKey: (event) => getRouterParam(event, "kind") ?? "",
    shouldBypassCache: (event) => getQuery(event).preview !== undefined,
  },
);
