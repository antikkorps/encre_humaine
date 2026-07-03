/**
 * Contenu composé de la page Contact — `GET /api/content/contact`
 * (docs/09-contact.md). Cache court (60s) ; token Directus strictement serveur.
 * Consommé par `/contact` via `useFetch`. La soumission du formulaire et la prise
 * de RDV passent par leurs propres canaux (`/api/contact`, embed Cal.com).
 */
export default cachedContent("contact", () => loadContactContent());
