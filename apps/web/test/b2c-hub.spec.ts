// @vitest-environment node
//
// Composition du hub Particuliers — docs/04-particuliers-hub.md.
// Vérifie : blocs situation (liens de repli), rich text assaini (how_i_work +
// FAQ), témoignage M2O masqué si vide, FAQ b2c, CTA avec fallback, SEO.
import { describe, expect, it } from "vitest";
import { mapB2cHubContent, mapSituation } from "../server/utils/content/b2c-hub";

const BASE = "https://cms.example.fr";
const wrap = (h?: string | null) => (h ? `clean(${h})` : "");

describe("mapSituation", () => {
  it("null si ni titre ni corps", () => {
    expect(mapSituation("", "", "Go", "/x", "/default")).toBeNull();
  });

  it("mappe et retombe sur le lien d'offre par défaut", () => {
    expect(
      mapSituation("Clarifier", "Vous hésitez.", "Découvrir", "", "/particuliers/clarifier"),
    ).toEqual({
      title: "Clarifier",
      body: "Vous hésitez.",
      ctaLabel: "Découvrir",
      ctaLink: "/particuliers/clarifier",
    });
  });

  it("préfère le lien fourni, ctaLabel null si absent", () => {
    const s = mapSituation("T", "B", "", "/sur-mesure", "/default");
    expect(s?.ctaLink).toBe("/sur-mesure");
    expect(s?.ctaLabel).toBeNull();
  });
});

describe("mapB2cHubContent", () => {
  it("hub vide : sections masquées, CTA replié sur son fallback", () => {
    const c = mapB2cHubContent({}, [], {}, BASE, wrap);
    expect(c.accrocheTitle).toBeNull();
    expect(c.situations).toEqual([]);
    expect(c.howIWorkHtml).toBeNull();
    expect(c.testimonial).toBeNull();
    expect(c.faq).toEqual([]);
    expect(c.ctaLabel).toBe("Réserver une séance découverte gratuite");
  });

  it("compose situations, rich text assaini, témoignage et FAQ", () => {
    const c = mapB2cHubContent(
      {
        accroche_title: "On avance ensemble",
        situation_a_title: "Clarifier",
        situation_a_body: "Faire le point.",
        situation_a_cta_label: "Découvrir",
        situation_b_title: "Booster",
        how_i_work_body: "<p>En visio.</p>",
        testimonial: { quote: "Ça m'a aidée.", author_name: "Léa", audience: "particulier" },
        cta_label: "Réserver",
      },
      [{ question: "Durée ?", answer: "<p>1h.</p>" }],
      { brand_name: "L'Encre Humaine" },
      BASE,
      wrap,
    );
    expect(c.situations).toHaveLength(2);
    expect(c.situations[0]).toMatchObject({
      title: "Clarifier",
      ctaLabel: "Découvrir",
      ctaLink: "/particuliers/clarifier-avancer",
    });
    // bloc B sans cta_link → lien d'offre par défaut
    expect(c.situations[1]?.ctaLink).toBe("/particuliers/booster-recherche");
    expect(c.howIWorkHtml).toBe("clean(<p>En visio.</p>)");
    expect(c.testimonial).toMatchObject({ quote: "Ça m'a aidée.", audience: "particulier" });
    expect(c.faq).toEqual([{ question: "Durée ?", answer: "clean(<p>1h.</p>)" }]);
    expect(c.ctaLabel).toBe("Réserver");
    expect(c.seo.title).toBe("L'Encre Humaine");
  });
});
