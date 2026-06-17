// @vitest-environment node
//
// Composition du hub Organisations — docs/03-organisations-hub.md.
// Vérifie : offres dynamiques (résumé + audience), méthode, « pour qui »,
// témoignages b2b masqués si vides, CTA avec fallbacks, SEO.
import { describe, expect, it } from "vitest";
import { mapOrgHubContent } from "../server/utils/content/org-hub";

const BASE = "https://cms.example.fr";

describe("mapOrgHubContent", () => {
  it("hub vide : listes vides, CTA replié sur ses fallbacks", () => {
    const c = mapOrgHubContent({}, [], [], {}, BASE);
    expect(c.accrocheTitle).toBeNull();
    expect(c.accrocheBody).toBeNull();
    expect(c.offers).toEqual([]);
    expect(c.methodSteps).toEqual([]);
    expect(c.audienceItems).toEqual([]);
    expect(c.testimonials).toEqual([]);
    expect(c.cta).toEqual({ title: "Travaillons ensemble", label: "Prendre rendez-vous" });
  });

  it("compose offres b2b, méthode, pour-qui, témoignages et CTA réel", () => {
    const c = mapOrgHubContent(
      {
        accroche_title: "Donner de l'élan à vos équipes",
        accroche_body: "Conseil RH sur mesure.",
        method_steps: [{ number: 1, title: "Cadrage", description: "Le besoin." }],
        audience_items: [{ text: "PME en croissance" }, "Associations"],
        cta_title: "Un projet RH ?",
        cta_label: "Échangeons",
      },
      [
        { title: "Audit RH", slug: "audit-rh", short_description: "État des lieux." },
        { slug: "sans-titre" }, // filtré
      ],
      [{ quote: "Un vrai partenaire.", author_name: "Marie", audience: "organisation" }],
      { brand_name: "L'Encre Humaine" },
      BASE,
    );
    expect(c.accrocheTitle).toBe("Donner de l'élan à vos équipes");
    expect(c.offers).toHaveLength(1);
    expect(c.offers[0]).toMatchObject({ slug: "audit-rh", audience: "organisation" });
    expect(c.methodSteps).toEqual([{ number: "1", title: "Cadrage", description: "Le besoin." }]);
    expect(c.audienceItems).toEqual(["PME en croissance", "Associations"]);
    expect(c.testimonials).toHaveLength(1);
    expect(c.cta).toEqual({ title: "Un projet RH ?", label: "Échangeons" });
    expect(c.seo.title).toBe("L'Encre Humaine");
  });
});
