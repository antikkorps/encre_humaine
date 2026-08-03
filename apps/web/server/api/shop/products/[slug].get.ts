/**
 * Fiche produit — `GET /api/shop/products/:slug` (docs/06-boutique.md).
 * Merge Directus (published, description assainie) + Stripe (prix actif), caché
 * court (60s, clé = slug). 404 si le produit est dépublié/inexistant ou sans prix
 * actif (« produit dépublié ou inactif → absent »). Consommé par `/laboratoire/[slug]`.
 */
export default defineCachedEventHandler(
  async (event) => {
    const slug = getRouterParam(event, "slug") ?? "";
    const product = await loadProductDetail(slug);
    if (!product) {
      throw createError({ statusCode: 404, statusMessage: "Produit introuvable" });
    }
    return product;
  },
  {
    maxAge: 60,
    name: "shop-product",
    getKey: (event) => getRouterParam(event, "slug") ?? "",
  },
);
