// @vitest-environment node
//
// Composition de la page Newsletter — docs/08-newsletter.md.
// Vérifie : masquage des sections vides, promesse rich text assainie (injectée),
// cadeau m2o résolu vs non résolu, aperçu conditionné à l'extrait, SEO.
// (À ne pas confondre avec newsletter.spec.ts = crypto token + purge, PGlite.)
import { describe, expect, it } from "vitest";
import { mapNewsletterContent } from "../server/utils/content/newsletter";

const BASE = "https://cms.example.fr";
const wrap = (h?: string | null) => (h ? `clean(${h})` : "");

describe("mapNewsletterContent", () => {
  it("page vide : sections masquées", () => {
    const c = mapNewsletterContent({}, {}, BASE, wrap);
    expect(c.name).toBeNull();
    expect(c.subtitle).toBeNull();
    expect(c.promiseHtml).toBe("");
    expect(c.helpsWith).toEqual([]);
    expect(c.whatYouReceive).toEqual([]);
    expect(c.welcomeGiftLabel).toBeNull();
    expect(c.sample).toBeNull();
    expect(c.rgpdMention).toBeNull();
  });

  it("mappe le sous-titre et la liste « aide à » (entrées vides filtrées)", () => {
    const c = mapNewsletterContent(
      {
        subtitle: "Tous les 15 jours.",
        helps_with: [{ text: "comprendre une situation" }, { text: "" }],
      },
      {},
      BASE,
      wrap,
    );
    expect(c.subtitle).toBe("Tous les 15 jours.");
    expect(c.helpsWith).toEqual(["comprendre une situation"]);
  });

  it("cadeau : titre si m2o résolu, null si non résolu (string)", () => {
    expect(
      mapNewsletterContent(
        { welcome_gift_label: { title: "Guide des 7 leviers", slug: "guide-7-leviers" } },
        {},
        BASE,
        wrap,
      ).welcomeGiftLabel,
    ).toBe("Guide des 7 leviers");
    expect(
      mapNewsletterContent({ welcome_gift_label: "uuid-non-resolu" }, {}, BASE, wrap)
        .welcomeGiftLabel,
    ).toBeNull();
  });

  it("aperçu présent seulement avec un extrait", () => {
    expect(
      mapNewsletterContent({ sample_issue_label: "Le Fil #07" }, {}, BASE, wrap).sample,
    ).toBeNull();
    expect(
      mapNewsletterContent(
        { sample_excerpt: "Cette semaine…", sample_issue_label: "Le Fil #07" },
        {},
        BASE,
        wrap,
      ).sample,
    ).toEqual({ excerpt: "Cette semaine…", issueLabel: "Le Fil #07" });
  });

  it("assainit la promesse, mappe la liste et le SEO (fallback site_settings)", () => {
    const c = mapNewsletterContent(
      {
        name: "Le Fil",
        promise_body: "<p>Bimensuel, 5 min.</p>",
        what_you_receive: [{ text: "Des outils" }, "Des retours terrain", { text: "" }],
        rgpd_mention: "Désinscription en un clic.",
        meta_title: "",
      },
      { brand_name: "L'Encre Humaine", default_meta_description: "Conseil RH." },
      BASE,
      wrap,
    );
    expect(c.name).toBe("Le Fil");
    expect(c.promiseHtml).toBe("clean(<p>Bimensuel, 5 min.</p>)");
    expect(c.whatYouReceive).toEqual(["Des outils", "Des retours terrain"]);
    expect(c.rgpdMention).toBe("Désinscription en un clic.");
    expect(c.seo.title).toBe("L'Encre Humaine");
    expect(c.seo.description).toBe("Conseil RH.");
  });
});
