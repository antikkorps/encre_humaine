// Découpage d'un texte simple Directus en paragraphes et listes — les lignes
// « • … » doivent devenir une vraie liste HTML (audit SEO, 2026-10-22).
import { describe, expect, it } from "vitest";
import { parseTextBlocks } from "~/utils/text-blocks";

describe("parseTextBlocks", () => {
  it("sépare les paragraphes sur les lignes vides", () => {
    expect(parseTextBlocks("Un.\n\nDeux.")).toEqual([
      { kind: "p", text: "Un." },
      { kind: "p", text: "Deux." },
    ]);
  });

  it("garde les retours simples dans un même paragraphe", () => {
    expect(parseTextBlocks("Ligne 1\nLigne 2")).toEqual([{ kind: "p", text: "Ligne 1\nLigne 2" }]);
  });

  it("regroupe les lignes « • » consécutives en une liste", () => {
    expect(
      parseTextBlocks(
        "**Tant qu'elles restent invisibles :**\n\n• vos recrutements ;\n• vos managers.\n\nCe sujet dépasse.",
      ),
    ).toEqual([
      { kind: "p", text: "**Tant qu'elles restent invisibles :**" },
      { kind: "ul", items: ["vos recrutements ;", "vos managers."] },
      { kind: "p", text: "Ce sujet dépasse." },
    ]);
  });

  it("isole une liste collée à sa phrase d'introduction", () => {
    expect(parseTextBlocks("Un regard extérieur :\n• Un projet\n- Une équipe")).toEqual([
      { kind: "p", text: "Un regard extérieur :" },
      { kind: "ul", items: ["Un projet", "Une équipe"] },
    ]);
  });

  it("renvoie une liste vide pour un texte vide", () => {
    expect(parseTextBlocks("  \n ")).toEqual([]);
  });
});
