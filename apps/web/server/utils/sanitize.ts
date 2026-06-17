import sanitizeHtml from "sanitize-html";

/**
 * Assainissement du HTML issu du WYSIWYG Directus (`input-rich-text-html`) —
 * docs/06 §1, contrat de `RichText.vue`. **Toujours côté serveur, au fetch** :
 * le client ne reçoit que du HTML déjà filtré (défense en profondeur, même si
 * l'éditrice est de confiance). L'allowlist colle aux balises stylées par
 * `.rich-text` dans `assets/css/main.css` — tout le reste est retiré.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "em",
    "b",
    "i",
    "u",
    "s",
    "a",
    "ul",
    "ol",
    "li",
    "blockquote",
    "h2",
    "h3",
    "h4",
    "code",
    "pre",
  ],
  allowedAttributes: { a: ["href", "target", "rel"] },
  // Pas de `data:`/`javascript:` : on borne aux schémas sûrs (liens texte/mail/tel).
  allowedSchemes: ["http", "https", "mailto", "tel"],
  // Liens externes durcis (anti tab-nabbing) ; `target` conservé s'il est posé.
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
  },
  disallowedTagsMode: "discard",
};

/** Renvoie du HTML sûr prêt pour `RichText`, ou "" si l'entrée est vide. */
export function sanitizeRichText(html?: string | null): string {
  if (!html) return "";
  return sanitizeHtml(html, OPTIONS);
}
