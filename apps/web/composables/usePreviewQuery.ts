/**
 * Propage `?preview` de la page vers l'appel `/api/content/*` : `useFetch` ne
 * transmet pas la query de la page. Combiné au bypass de cache serveur
 * (`cachedContent`), permet le Live Preview Directus des singletons — l'éditrice
 * voit son contenu à jour. `undefined` hors preview → param omis (cache normal).
 */
export function usePreviewQuery() {
  return { preview: useRoute().query.preview };
}
