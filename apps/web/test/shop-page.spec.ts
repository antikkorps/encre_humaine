// @vitest-environment node
//
// Contenu du Laboratoire — server/utils/content/shop-page.ts.
// Vérifie : ouverture stricte de la vente, libellés de repli, sections
// éditoriales masquées quand elles sont vides, répéteurs, SEO.
import { describe, expect, it } from "vitest";
import { mapLabItems, mapShopPage } from "../server/utils/content/shop-page";

const BASE = "https://cms.example.fr";
// Sanitizer factice : marque le passage (et "" sur entrée vide, comme le vrai).
const wrap = (h?: string | null) => (h ? `clean(${h})` : "");

describe("mapLabItems", () => {
  it("garde les items ayant un titre OU un corps, masque les vides", () => {
    expect(
      mapLabItems([
        { icon: "casino", title: "Jeux", body: "Apprendre en jouant.", status: "En cours" },
        { title: "", body: "" },
        { body: "Sans titre" },
        "bruit",
      ]),
    ).toEqual([
      { icon: "casino", title: "Jeux", body: "Apprendre en jouant.", status: "En cours" },
      { icon: "", title: "", body: "Sans titre", status: "" },
    ]);
  });

  it("renvoie [] hors tableau", () => {
    expect(mapLabItems(null)).toEqual([]);
  });
});

describe("mapShopPage", () => {
  it("page vide : vente fermée, sections masquées, libellés de repli", () => {
    const c = mapShopPage({}, {}, BASE, wrap);
    expect(c.enabled).toBe(false);
    expect(c.title).toBe("Le Laboratoire");
    expect(c.intro).toBeNull();
    expect(c.heroBodyHtml).toBeNull();
    expect(c.catalog).toBeNull();
    expect(c.focus).toBeNull();
    expect(c.manifesto).toBeNull();
    expect(c.why).toBeNull();
    expect(c.newsletter).toEqual({ title: null, body: null });
    expect(c.emptyMessage).toContain("bientôt");
  });

  it("ouvre la vente et reprend les libellés éditoriaux", () => {
    const c = mapShopPage(
      {
        shop_enabled: true,
        title: "L'atelier",
        intro: "Nos créations.",
        empty_message: "Rien pour l'instant.",
      },
      { brand_name: "L'Encre Humaine", default_meta_description: "EH." },
      BASE,
      wrap,
    );
    expect(c.enabled).toBe(true);
    expect(c.title).toBe("L'atelier");
    expect(c.intro).toBe("Nos créations.");
    expect(c.emptyMessage).toBe("Rien pour l'instant.");
    expect(c.seo.title).toBe("L'Encre Humaine");
  });

  it("ouverture strictement booléenne (falsy → fermée)", () => {
    expect(mapShopPage({ shop_enabled: null }, {}, BASE, wrap).enabled).toBe(false);
    expect(mapShopPage({ shop_enabled: false }, {}, BASE, wrap).enabled).toBe(false);
  });

  it("assainit les champs rich-text et compose les sections", () => {
    const c = mapShopPage(
      {
        hero_body: "<p>intro</p>",
        catalog_title: "Ce que vous trouverez bientôt",
        catalog_items: [{ icon: "casino", title: "Jeux", status: "En cours de conception" }],
        focus_eyebrow: "En ce moment…",
        focus_title: "Une première collection",
        focus_body: "<p>terrain</p>",
        focus_cta_label: "Contribuer au questionnaire",
        focus_cta_url: "https://exemple.fr/form",
        manifesto_title: "Et si une heure de jeu…",
        manifesto_body: "<p>jeu</p>",
        why_items: [{ title: "Ancré dans le terrain" }],
        newsletter_title: "Être informé des sorties ?",
      },
      {},
      BASE,
      wrap,
    );
    expect(c.heroBodyHtml).toBe("clean(<p>intro</p>)");
    expect(c.catalog?.items).toHaveLength(1);
    expect(c.focus).toMatchObject({
      eyebrow: "En ce moment…",
      bodyHtml: "clean(<p>terrain</p>)",
      ctaUrl: "https://exemple.fr/form",
    });
    expect(c.manifesto?.bodyHtml).toBe("clean(<p>jeu</p>)");
    expect(c.why?.items[0]?.title).toBe("Ancré dans le terrain");
    expect(c.newsletter.title).toBe("Être informé des sorties ?");
  });

  it("« En ce moment » visible avec le seul corps, sans titre", () => {
    const c = mapShopPage({ focus_body: "<p>x</p>" }, {}, BASE, wrap);
    expect(c.focus?.title).toBeNull();
    expect(c.focus?.bodyHtml).toBe("clean(<p>x</p>)");
  });
});
