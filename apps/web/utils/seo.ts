/**
 * Carte de partage par défaut (Open Graph), embarquée dans le bundle
 * (`public/og-default.png`, 1200×630).
 *
 * Pourquoi une image EN DUR alors que Directus a déjà `site_settings.
 * default_og_image` et un `og_image` par page : ces champs sont facultatifs, et
 * tant qu'ils sont vides le site ne sert AUCUN `og:image` — un lien partagé sur
 * LinkedIn s'affiche alors en carte grise sans visuel. Le champ Directus reste
 * la source prioritaire ; ceci n'est que le dernier recours, pour qu'un aperçu
 * existe toujours, y compris sur les pages sans SEO éditorial (laboratoire,
 * pages légales, erreurs).
 *
 * Chemin RELATIF volontaire : le plugin `absoluteImageUrls` de nuxt-seo-utils
 * le réécrit en URL absolue au rendu serveur (`site.url`), et les crawlers
 * sociaux ne lisent que ce HTML-là — ils n'exécutent pas de JS.
 */
export const DEFAULT_OG_IMAGE = "/og-default.png";
