/**
 * Catalogue boutique — `GET /api/shop/products` (docs/05-shop.md §2).
 * Merge Directus (published) + Stripe (prix actifs), mis en cache court (60s)
 * pour amortir les appels tiers ; les pages consomment ce contrat (ISR).
 */
export default defineCachedEventHandler(
  async () => {
    return { products: await loadCatalog() };
  },
  { maxAge: 60, name: "shop-products", getKey: () => "all" },
);
