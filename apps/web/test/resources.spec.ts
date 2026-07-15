// @vitest-environment node
//
// Composition de la page fusionnée « Les Tentacules » (blog + newsletter) — /ressources.
// Vérifie : article vedette, filtres dérivés des groupes présents (ordre documenté +
// chrome emoji/mots-clés), positionnement rich text assaini, section newsletter,
// 0 article → état vide propre, SEO.
import { describe, expect, it } from "vitest";
import {
  buildFilters,
  mapFeaturedArticle,
  mapResourcesContent,
} from "../server/utils/content/resources";

const BASE = "https://cms.example.fr";
const wrap = (h?: string | null) => (h ? `clean(${h})` : "");

describe("mapFeaturedArticle", () => {
  it("null si relation non résolue (string) ou sans titre/slug", () => {
    expect(mapFeaturedArticle(null, BASE)).toBeNull();
    expect(mapFeaturedArticle("uuid", BASE)).toBeNull();
    expect(mapFeaturedArticle({ title: "", slug: "" }, BASE)).toBeNull();
  });

  it("mappe l'article vedette (réutilise mapArticle)", () => {
    const a = mapFeaturedArticle(
      {
        title: "À lire",
        slug: "a-lire",
        excerpt: "Chapô.",
        category: { name: "Terrain", slug: "terrain", group: "terrain" },
      },
      BASE,
    );
    expect(a).toMatchObject({ title: "À lire", slug: "a-lire", categoryGroup: "terrain" });
  });
});

describe("buildFilters", () => {
  it("ne garde que les groupes présents (ordre documenté) + chrome emoji/label", () => {
    const filters = buildFilters([
      { title: "A", slug: "a", categoryGroup: "terrain" } as never,
      { title: "B", slug: "b", categoryGroup: "organisations" } as never,
      { title: "C", slug: "c", categoryGroup: "terrain" } as never,
    ]);
    expect(filters).toHaveLength(2);
    expect(filters[0]).toMatchObject({
      group: "organisations",
      label: "Organisations",
      emoji: "🏢",
    });
    expect(filters[1]).toMatchObject({ group: "terrain", label: "Terrain", emoji: "🔎" });
    // le groupe « particuliers » est relabellé « Parcours professionnels »
    expect(filters.every((f) => typeof f.keywords === "string" && f.keywords.length)).toBe(true);
  });

  it("aucun filtre si aucun groupe", () => {
    expect(buildFilters([])).toEqual([]);
  });
});

describe("mapResourcesContent", () => {
  it("0 article : grille vide, aucun filtre, sections optionnelles masquées", () => {
    const c = mapResourcesContent({ accroche_title: "Tentacules" }, [], {}, {}, BASE, wrap);
    expect(c.accrocheTitle).toBe("Tentacules");
    expect(c.articles).toEqual([]);
    expect(c.filters).toEqual([]);
    expect(c.featuredArticle).toBeNull();
    expect(c.positioning).toBeNull();
    expect(c.ctaTitle).toBeNull();
    // la section newsletter est toujours composée (masquage géré au rendu)
    expect(c.newsletter.name).toBeNull();
  });

  it("compose filtres, positionnement assaini et section newsletter", () => {
    const c = mapResourcesContent(
      {
        meta_title: "",
        hero_signature: "🐙 Les Tentacules",
        positioning_title: "Approche terrain",
        positioning_body: "<p>Deux réalités</p><ul><li>RH</li></ul>",
        cta_title: "Y voir plus clair",
      },
      [
        {
          title: "Premier",
          slug: "premier",
          category: { name: "Parcours", slug: "particuliers", group: "particuliers" },
        },
      ],
      {
        name: "Les Tentacules",
        subtitle: "Tous les 15 jours.",
        helps_with: [{ text: "comprendre" }, { text: "" }],
        what_you_receive: [{ text: "une analyse" }],
        welcome_gift_label: { title: "5 questions" },
      },
      { brand_name: "L'Encre Humaine" },
      BASE,
      wrap,
    );
    expect(c.heroSignature).toBe("🐙 Les Tentacules");
    expect(c.filters).toHaveLength(1);
    expect(c.filters[0]).toMatchObject({ group: "particuliers", label: "Parcours professionnels" });
    expect(c.positioning).toEqual({
      title: "Approche terrain",
      bodyHtml: "clean(<p>Deux réalités</p><ul><li>RH</li></ul>)",
      photo: null,
    });
    expect(c.ctaTitle).toBe("Y voir plus clair");
    expect(c.newsletter.name).toBe("Les Tentacules");

    expect(c.newsletter.subtitle).toBe("Tous les 15 jours.");
    expect(c.newsletter.helpsWith).toEqual(["comprendre"]); // entrée vide filtrée
    expect(c.newsletter.whatYouReceive).toEqual(["une analyse"]);
    expect(c.newsletter.welcomeGiftLabel).toBe("5 questions");
    expect(c.seo.title).toBe("L'Encre Humaine");
  });

  it("visuel de positionnement : mappé quand fourni, absent sinon", () => {
    const withPhoto = mapResourcesContent(
      { positioning_title: "Approche terrain", positioning_photo: "f1" },
      [],
      {},
      {},
      BASE,
      wrap,
    );
    expect(withPhoto.positioning?.photo).toEqual({
      url: `${BASE}/assets/f1`,
      alt: "",
      width: null,
      height: null,
    });

    // Un visuel seul ne suffit pas à faire exister la section (titre/corps vides).
    const photoOnly = mapResourcesContent({ positioning_photo: "f1" }, [], {}, {}, BASE, wrap);
    expect(photoOnly.positioning).toBeNull();
  });
});
