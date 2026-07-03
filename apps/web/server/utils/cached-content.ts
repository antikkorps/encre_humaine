/**
 * Endpoints de contenu Directus : cache court (60s) pour amortir Directus, avec
 * bypass quand la requête porte `?preview` (Live Preview Directus → l'éditrice
 * voit son contenu à jour sans attendre le TTL ; les singletons sont toujours
 * « live »). Le token lecture Directus reste strictement serveur (docs/06 §1).
 * DRY : une seule politique de cache pour tous les endpoints de contenu.
 */
export function cachedContent<T>(key: string, loader: () => Promise<T> | T) {
  return defineCachedEventHandler(loader, {
    maxAge: 60,
    name: `content-${key}`,
    getKey: () => key,
    // Live Preview : `?preview` → contenu frais (on ne lit pas le cache).
    shouldBypassCache: (event) => getQuery(event).preview !== undefined,
  });
}
