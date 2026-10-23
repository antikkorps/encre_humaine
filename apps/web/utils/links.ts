/**
 * Lien hors du site : ouvert dans un nouvel onglet, avec `rel="noopener"`.
 * Critère unique pour tous les composants qui rendent un lien saisi dans l'admin
 * (les copies locales divergeaient : `http:` oublié d'un côté).
 */
export function isExternalHref(href: string): boolean {
  return /^(https?:|mailto:)/i.test(href);
}
