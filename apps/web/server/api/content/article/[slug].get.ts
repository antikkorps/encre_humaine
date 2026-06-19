/**
 * Article de blog — `GET /api/content/article/:slug` (docs/07-ressources.md).
 * Cache court (60s, clé = slug) ; token Directus strictement serveur. 404 si aucun
 * article publié ne porte ce slug. Consommé par `/ressources/[slug]`.
 */
export default defineCachedEventHandler(
  async (event) => {
    const slug = getRouterParam(event, "slug") ?? "";
    const article = await loadArticleContent(slug);
    if (!article) {
      throw createError({ statusCode: 404, statusMessage: "Article introuvable" });
    }
    return article;
  },
  {
    maxAge: 60,
    name: "content-article",
    getKey: (event) => getRouterParam(event, "slug") ?? "",
  },
);
