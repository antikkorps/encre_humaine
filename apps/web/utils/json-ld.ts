/**
 * Sérialise un objet en JSON-LD sûr pour une injection via `<script>` (useHead
 * `innerHTML`). `JSON.stringify` n'échappe PAS `<` : un champ contenant
 * `</script>` casserait sinon le bloc. On échappe `<` → `<` (défense en
 * profondeur ; la CSP à nonce neutralise déjà l'exécution de scripts injectés).
 * `<` n'apparaît jamais dans la syntaxe JSON elle-même, le remplacement est donc
 * sans risque pour la validité du document.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
