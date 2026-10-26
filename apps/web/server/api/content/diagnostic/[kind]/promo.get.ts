/**
 * Invitation au diagnostic d'un public — `GET /api/content/diagnostic/:kind/promo`
 * (b2b | b2c). Version légère de `/api/content/diagnostic/:kind` pour les pages
 * qui ne font qu'y renvoyer (offres, hubs) : sans les questions du questionnaire.
 */
export default defineCachedEventHandler(
  async (event) => {
    const kind = getRouterParam(event, "kind");
    if (kind !== "b2b" && kind !== "b2c") {
      throw createError({ statusCode: 404, statusMessage: "Diagnostic introuvable" });
    }
    const { texts } = await loadDiagnosticContent(kind);
    return mapDiagnosticPromo(kind, texts);
  },
  {
    maxAge: 60,
    name: "content-diagnostic-promo",
    getKey: (event) => getRouterParam(event, "kind") ?? "",
    shouldBypassCache: (event) => getQuery(event).preview !== undefined,
  },
);
