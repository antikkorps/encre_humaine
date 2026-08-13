/**
 * Mise en avant « doré gras » dans les champs TEXTE SIMPLE de Directus.
 *
 * Convention éditoriale (demande Éléonore du 2026-08-13 : « visibilité en gras
 * et en jaune », « repères en jaune gras », …) : dans n'importe quel champ texte,
 * `**un fragment**` s'affiche en gras doré. Éléonore peut donc mettre un mot en
 * avant depuis l'admin, sans passer par une modification de code ni un
 * déploiement (cf. mémoire « éviter les allers-retours »).
 *
 * Ce n'est volontairement PAS du markdown : uniquement `**…**`, et le rendu se
 * fait en `<strong>` via le composant `AccentText`, jamais en `v-html` — donc
 * aucune surface d'injection, contrairement aux champs WYSIWYG (cf. `RichText`).
 * Les champs WYSIWYG, eux, ont déjà leur gras natif : cette convention ne
 * concerne que les `input`/`textarea`.
 */

export interface AccentSegment {
  text: string;
  /** `true` → fragment à mettre en avant (gras doré). */
  accent: boolean;
}

/** `**…**` non gourmand, multi-lignes (les textareas contiennent des `\n`). */
const ACCENT_RE = /\*\*([\s\S]+?)\*\*/g;

/**
 * Découpe un texte en segments normaux / mis en avant. Les `**` non appariés
 * restent du texte brut (aucune perte de contenu, quoi qu'écrive l'éditrice).
 */
export function parseAccent(text: string): AccentSegment[] {
  const segments: AccentSegment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(ACCENT_RE)) {
    const start = match.index ?? 0;
    if (start > cursor) segments.push({ text: text.slice(cursor, start), accent: false });
    segments.push({ text: match[1] ?? "", accent: true });
    cursor = start + match[0].length;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), accent: false });
  return segments;
}
