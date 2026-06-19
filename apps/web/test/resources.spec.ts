// @vitest-environment node
//
// Composition de l'index Ressources — docs/07-ressources.md.
// Vérifie : ressource vedette (gating vs direct), filtres dérivés des groupes
// présents (ordre documenté), 0 article → état vide propre, SEO.
import { describe, expect, it } from "vitest";
import {
  buildFilters,
  mapFeaturedResource,
  mapResourcesContent,
} from "../server/utils/content/resources";

const BASE = "https://cms.example.fr";

describe("mapFeaturedResource", () => {
  it("null si pas de titre ou relation non résolue (string)", () => {
    expect(mapFeaturedResource(null, BASE)).toBeNull();
    expect(mapFeaturedResource("uuid", BASE)).toBeNull();
    expect(mapFeaturedResource({ title: "" }, BASE)).toBeNull();
  });

  it("lien direct si non gaté, masqué si gating email", () => {
    expect(
      mapFeaturedResource(
        { title: "Guide", description: "Un guide.", file: "f1", cover_image: "c1" },
        BASE,
      ),
    ).toEqual({
      title: "Guide",
      description: "Un guide.",
      coverUrl: `${BASE}/assets/c1`,
      requiresEmail: false,
      downloadUrl: `${BASE}/assets/f1`,
    });
    const gated = mapFeaturedResource({ title: "Guide", requires_email: true, file: "f1" }, BASE);
    expect(gated?.requiresEmail).toBe(true);
    expect(gated?.downloadUrl).toBeNull(); // gaté : pas de lien direct
  });
});

describe("buildFilters", () => {
  it("ne garde que les groupes présents, dans l'ordre documenté", () => {
    const filters = buildFilters([
      { title: "A", slug: "a", shortDescription: "", categoryGroup: "terrain" } as never,
      { title: "B", slug: "b", shortDescription: "", categoryGroup: "organisations" } as never,
      { title: "C", slug: "c", shortDescription: "", categoryGroup: "terrain" } as never,
    ]);
    expect(filters).toEqual([
      { group: "organisations", label: "Organisations" },
      { group: "terrain", label: "Terrain" },
    ]);
  });

  it("aucun filtre si aucun groupe", () => {
    expect(buildFilters([])).toEqual([]);
  });
});

describe("mapResourcesContent", () => {
  it("0 article : grille vide, aucun filtre (pas de section cassée)", () => {
    const c = mapResourcesContent({ accroche_title: "Ressources" }, [], {}, BASE);
    expect(c.accrocheTitle).toBe("Ressources");
    expect(c.articles).toEqual([]);
    expect(c.filters).toEqual([]);
    expect(c.featured).toBeNull();
  });

  it("dérive les filtres des articles et mappe le SEO", () => {
    const c = mapResourcesContent(
      { meta_title: "" },
      [
        {
          title: "Premier",
          slug: "premier",
          category: { name: "Sur le terrain", slug: "terrain", group: "terrain" },
        },
      ],
      { brand_name: "L'Encre Humaine" },
      BASE,
    );
    expect(c.articles).toHaveLength(1);
    expect(c.articles[0]?.categoryGroup).toBe("terrain");
    expect(c.filters).toEqual([{ group: "terrain", label: "Terrain" }]);
    expect(c.seo.title).toBe("L'Encre Humaine");
  });
});
