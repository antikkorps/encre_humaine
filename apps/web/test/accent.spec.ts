// @vitest-environment node
//
// Convention éditoriale `**…**` (gras doré) — cf. apps/web/utils/accent.ts.
// Le contrat qui compte : aucun caractère du texte d'Éléonore ne doit être perdu,
// quoi qu'elle saisisse dans l'admin.
import { describe, expect, it } from "vitest";
import { parseAccent } from "../utils/accent";

/** Texte reconstitué = texte d'origine, marques retirées. */
const rendered = (text: string) =>
  parseAccent(text)
    .map((s) => s.text)
    .join("");

describe("parseAccent", () => {
  it("isole le fragment marqué", () => {
    expect(parseAccent("Vous avez besoin de **visibilité**, de méthode.")).toEqual([
      { text: "Vous avez besoin de ", accent: false },
      { text: "visibilité", accent: true },
      { text: ", de méthode.", accent: false },
    ]);
  });

  it("marque plusieurs fragments et gère un texte entièrement marqué", () => {
    expect(parseAccent("**Structurer sans déshumaniser.**")).toEqual([
      { text: "Structurer sans déshumaniser.", accent: true },
    ]);
    expect(parseAccent("**a** et **b**").filter((s) => s.accent)).toHaveLength(2);
  });

  it("ne coupe pas au-delà du premier fragment (non gourmand)", () => {
    const segments = parseAccent("**un** texte **deux**");
    expect(segments.map((s) => s.text)).toEqual(["un", " texte ", "deux"]);
  });

  it("traverse les retours à la ligne des textareas", () => {
    expect(parseAccent("Les personnes ont besoin de **repères**.\nEt de sens.")[1]).toEqual({
      text: "repères",
      accent: true,
    });
  });

  it("laisse les `**` non appariés en texte brut (aucune perte)", () => {
    for (const raw of ["", "sans marque", "**orphelin", "a ** b", "***gras***"]) {
      expect(rendered(raw)).toBe(raw.replace(/\*\*([\s\S]+?)\*\*/g, "$1"));
    }
    expect(parseAccent("**orphelin")).toEqual([{ text: "**orphelin", accent: false }]);
    expect(parseAccent("")).toEqual([]);
  });
});
