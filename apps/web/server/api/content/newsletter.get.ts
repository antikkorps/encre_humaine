/**
 * Contenu composé de la page Newsletter — `GET /api/content/newsletter`
 * (docs/08-newsletter.md). Cache court (60s) ; token Directus strictement serveur.
 * Consommé par `/newsletter` via `useFetch`. L'inscription passe par son propre
 * canal (`POST /api/newsletter/subscribe`, double opt-in).
 */
export default defineCachedEventHandler(() => loadNewsletterContent(), {
  maxAge: 60,
  name: "content-newsletter",
  getKey: () => "newsletter",
});
