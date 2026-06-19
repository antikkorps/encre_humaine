// @vitest-environment node
//
// Réglages boutique — server/utils/content/shop-page.ts.
// Vérifie : activation stricte, libellés génériques de repli, reprise éditoriale, SEO.
import { describe, expect, it } from "vitest";
import { mapShopPage } from "../server/utils/content/shop-page";

const BASE = "https://cms.example.fr";

describe("mapShopPage", () => {
  it("désactivée par défaut, libellés génériques (pas « jeux »)", () => {
    const c = mapShopPage({}, {}, BASE);
    expect(c.enabled).toBe(false);
    expect(c.title).toBe("La boutique");
    expect(c.intro).toBeNull();
    expect(c.emptyMessage).toContain("bientôt");
  });

  it("active la boutique et reprend les libellés éditoriaux", () => {
    const c = mapShopPage(
      {
        shop_enabled: true,
        title: "L'atelier",
        intro: "Nos créations.",
        empty_message: "Rien pour l'instant.",
      },
      { brand_name: "L'Encre Humaine", default_meta_description: "EH." },
      BASE,
    );
    expect(c.enabled).toBe(true);
    expect(c.title).toBe("L'atelier");
    expect(c.intro).toBe("Nos créations.");
    expect(c.emptyMessage).toBe("Rien pour l'instant.");
    expect(c.seo.title).toBe("L'Encre Humaine");
  });

  it("activation strictement booléenne (falsy → fermée)", () => {
    expect(mapShopPage({ shop_enabled: null }, {}, BASE).enabled).toBe(false);
    expect(mapShopPage({ shop_enabled: false }, {}, BASE).enabled).toBe(false);
  });
});
