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

/**
 * Mise en avant « gras doré » DANS le WYSIWYG (cf. `utils/accent.ts`, qui fait la
 * même chose pour les champs texte simple). Éléonore écrit `**un fragment**`
 * indifféremment dans un `input`, un `textarea` ou l'éditeur riche : la règle est
 * la même partout, sans avoir à retenir quel champ accepte quoi.
 *
 * Volontairement APRÈS l'assainissement : le `<strong>` posé ici est notre balise
 * (classe fixe, aucun attribut repris de l'entrée), donc rien d'éditeur n'est
 * réinjecté. `[^*<>]` borne le fragment à un morceau de TEXTE : une paire de `**`
 * à cheval sur une balise est laissée telle quelle plutôt que de produire un
 * emboîtement invalide. Le `<strong>` natif de l'éditeur, lui, reste sobre : il
 * sert de mise en relief structurelle dans les pages légales.
 */
const ACCENT_RE = /\*\*([^*<>]+?)\*\*/g;

/** Renvoie du HTML sûr prêt pour `RichText`, ou "" si l'entrée est vide. */
export function sanitizeRichText(html?: string | null): string {
  if (!html) return "";
  return sanitizeHtml(html, OPTIONS).replace(ACCENT_RE, '<strong class="accent">$1</strong>');
}
