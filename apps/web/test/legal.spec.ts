// @vitest-environment node
//
// Documents légaux — server/utils/content/legal.ts (docs/10-legal.md).
// Vérifie : slug d'ancre, table des matières (h2 ancrés, ids uniques), mapper
// (corps assaini injecté, titre, date, SEO).
import { describe, expect, it } from "vitest";
import { buildToc, mapLegalDocument, slugifyHeading } from "../server/utils/content/legal";

const BASE = "https://cms.example.fr";
const wrap = (h?: string | null) => (h ? `clean(${h})` : "");

describe("slugifyHeading", () => {
  it("normalise accents/espaces/ponctuation en slug", () => {
    expect(slugifyHeading("Article 1 — Éditeur du site")).toBe("article-1-editeur-du-site");
    expect(slugifyHeading("   ")).toBe("section");
  });
});

describe("buildToc", () => {
  it("ancre les h2 et extrait le sommaire", () => {
    const { html, toc } = buildToc("<h2>Objet</h2><p>x</p><h2>Tarifs</h2>");
    expect(toc).toEqual([
      { id: "objet", text: "Objet" },
      { id: "tarifs", text: "Tarifs" },
    ]);
    expect(html).toContain('<h2 id="objet">Objet</h2>');
    expect(html).toContain('<h2 id="tarifs">Tarifs</h2>');
  });

  it("dédoublonne les ids identiques", () => {
    const { toc } = buildToc("<h2>Article</h2><h2>Article</h2>");
    expect(toc.map((t) => t.id)).toEqual(["article", "article-2"]);
  });

  it("ignore un h2 vide et n'affecte pas les autres balises", () => {
    const { html, toc } = buildToc("<h2></h2><h3>Sous-titre</h3>");
    expect(toc).toEqual([]);
    expect(html).toContain("<h3>Sous-titre</h3>");
  });
});

describe("mapLegalDocument", () => {
  it("assainit le corps, ancre les h2, mappe titre/date/SEO", () => {
    const doc = mapLegalDocument(
      { title: "Mentions légales", body: "<h2>Éditeur</h2>", date_updated: "2026-06-19T10:00:00Z" },
      { brand_name: "L'Encre Humaine", default_meta_description: "Conseil RH." },
      BASE,
      wrap,
    );
    expect(doc.title).toBe("Mentions légales");
    // sanitize d'abord (clean(...)), puis ancrage des h2 par buildToc.
    expect(doc.html).toBe('clean(<h2 id="editeur">Éditeur</h2>)');
    expect(doc.toc).toEqual([{ id: "editeur", text: "Éditeur" }]);
    expect(doc.updatedAt).toBe("2026-06-19T10:00:00Z");
    expect(doc.seo.title).toBe("Mentions légales");
    expect(doc.seo.description).toBe("Conseil RH.");
  });
});
