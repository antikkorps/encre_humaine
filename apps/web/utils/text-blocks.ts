/**
 * Découpe un champ texte simple de Directus (textarea) en blocs : paragraphes et
 * listes à puces. Éléonore tape ses puces « • » (ou « - ») à la main ; rendues
 * comme du texte, elles formaient un seul paragraphe que ni les moteurs ni les
 * lecteurs d'écran ne lisent comme une liste. Le marquage `**…**` est laissé
 * intact : il est interprété ensuite par `AccentText`, bloc par bloc.
 */

export type TextBlock = { kind: "p"; text: string } | { kind: "ul"; items: string[] };

/** « • » ou « - » : le tiret demi-cadratin « – » ouvre souvent une phrase en français. */
const BULLET_RE = /^\s*[•-]\s+/;

export function parseTextBlocks(text: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  let lines: string[] = [];
  const flushParagraph = () => {
    if (lines.length) blocks.push({ kind: "p", text: lines.join("\n") });
    lines = [];
  };

  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    if (BULLET_RE.test(line)) {
      flushParagraph();
      const last = blocks.at(-1);
      const item = line.replace(BULLET_RE, "");
      if (last?.kind === "ul") last.items.push(item);
      else blocks.push({ kind: "ul", items: [item] });
    } else if (line.trim() === "") {
      flushParagraph();
    } else {
      lines.push(line);
    }
  }
  flushParagraph();
  return blocks;
}
