/**
 * Contenu composé d'une offre — `GET /api/content/offer/:slug`
 * (docs/05-offres-gabarit.md). Cache court (60s, clé = slug) ; token Directus
 * strictement serveur (docs/06 §1). Consommé par `/organisations/[slug]` et
 * `/particuliers/[slug]` via `OfferPage.vue`. 404 si aucune offre publiée ne
 * porte ce slug (la correspondance d'audience est vérifiée côté page).
 */
export default defineCachedEventHandler(
  async (event) => {
    const slug = getRouterParam(event, "slug") ?? "";
    const content = await loadOfferContent(slug);
    if (!content) {
      throw createError({ statusCode: 404, statusMessage: "Offre introuvable" });
    }
    return content;
  },
  {
    maxAge: 60,
    name: "content-offer",
    getKey: (event) => getRouterParam(event, "slug") ?? "",
  },
);
