/**
 * Contenu composé du hub Particuliers — `GET /api/content/b2c-hub`
 * (docs/04-particuliers-hub.md). Cache court (60s) ; rich text déjà assaini
 * serveur, token Directus strictement serveur (docs/06 §1). Consommé par
 * `/particuliers` via `useFetch`.
 */
export default defineCachedEventHandler(() => loadB2cHubContent(), {
  maxAge: 60,
  name: "content-b2c-hub",
  getKey: () => "b2c-hub",
});
