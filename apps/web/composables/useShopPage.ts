/**
 * Réglages boutique partagés (activation + libellés) — `GET /api/content/shop`.
 * Clé explicite : l'en-tête, le pied de page et les pages `/laboratoire` partagent
 * une seule requête (dédupliquée par Nuxt). Type inféré de l'endpoint.
 */
export function useShopPage() {
  return useFetch("/api/content/shop", { key: "shop-page" });
}
