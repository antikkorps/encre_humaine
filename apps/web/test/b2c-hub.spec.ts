// @vitest-environment node
//
// Composition du hub Particuliers — docs/04-particuliers-hub.md.
// Vérifie : cartes situation détaillées (pour qui / liste / résultat, liens de
// repli), deux rich text assainis (how_i_work + why_different + FAQ), bénéfices,
// format, témoignage M2O masqué si vide, FAQ b2c, CTA avec fallback, SEO.
import { describe, expect, it } from "vitest";
import { mapB2cHubContent, mapSituation } from "../server/utils/content/b2c-hub";

const BASE = "https://cms.example.fr";
const wrap = (h?: string | null) => (h ? `clean(${h})` : "");

describe("mapSituation", () => {
  it("null si carte entièrement vide", () => {
    expect(mapSituation({}, "/default")).toBeNull();
    expect(mapSituation({ ctaLabel: "Go", ctaLink: "/x" }, "/default")).toBeNull();
  });

  it("mappe le détail (pour qui / liste / résultat) et retombe sur le lien d'offre", () => {
    expect(
      mapSituation(
        {
          title: "Clarifier",
          audience: "Vous hésitez.",
          items: [{ text: "Comprendre" }, { text: "Explorer" }],
          result: "Un cap clair.",
          ctaLabel: "Découvrir",
        },
        "/particuliers/clarifier",
      ),
    ).toEqual({
      title: "Clarifier",
      body: null,
      audience: "Vous hésitez.",
      items: ["Comprendre", "Explorer"],
      result: "Un cap clair.",
      ctaLabel: "Découvrir",
      ctaLink: "/particuliers/clarifier",
    });
  });

  it("visible avec la seule liste ; préfère le lien fourni, ctaLabel null si absent", () => {
    const s = mapSituation({ items: [{ text: "CV" }], ctaLink: "/sur-mesure" }, "/default");
    expect(s?.items).toEqual(["CV"]);
    expect(s?.ctaLink).toBe("/sur-mesure");
    expect(s?.ctaLabel).toBeNull();
  });
});

describe("mapB2cHubContent", () => {
  it("hub vide : sections masquées, CTA replié sur son fallback", () => {
    const c = mapB2cHubContent({}, [], {}, BASE, wrap);
    expect(c.accrocheTitle).toBeNull();
    expect(c.accrocheCtaLabel).toBeNull();
    expect(c.outcomes).toEqual([]);
    expect(c.situations).toEqual([]);
    expect(c.howIWorkHtml).toBeNull();
    expect(c.whyDifferentHtml).toBeNull();
    expect(c.formatItems).toEqual([]);
    expect(c.testimonial).toBeNull();
    expect(c.faq).toEqual([]);
    expect(c.ctaLabel).toBe("Réserver une séance découverte gratuite");
  });

  it("compose bénéfices, cartes détaillées, 2 rich text, format, témoignage et FAQ", () => {
    const c = mapB2cHubContent(
      {
        accroche_title: "On avance ensemble",
        accroche_signature: "Compris, pas parfait.",
        accroche_cta_label: "Réserver un premier échange",
        outcomes_title: "Ce que vous trouvez",
        outcomes: [
          { title: "Clarté", body: "Des mots." },
          { title: "", body: "" },
        ],
        situation_a_title: "Clarifier",
        situation_a_audience: "Vous questionnez.",
        situation_a_items: [{ text: "Comprendre" }],
        situation_a_result: "Un cap.",
        situation_a_cta_label: "Découvrir",
        situation_b_title: "Booster",
        how_i_work_body: "<p>En visio.</p>",
        how_i_work_signature: "Structurer sans déshumaniser.",
        why_different_body: "<p>10 ans.</p><ul><li>RH</li></ul>",
        format_title: "À votre rythme",
        format_items: [{ text: "Séances d'une heure" }, { text: "En visio" }],
        format_body: "Pas des devoirs.",
        testimonial: { quote: "Ça m'a aidée.", author_name: "Léa", audience: "particulier" },
        cta_title: "Un espace pour y voir clair ?",
        cta_body: "Prendre du recul.",
        cta_label: "Réserver",
        cta_subtext: "Échange gratuit.",
      },
      [{ question: "CPF ?", answer: "<p>Non.</p>" }],
      { brand_name: "L'Encre Humaine" },
      BASE,
      wrap,
    );
    // bénéfices : entrée vide filtrée
    expect(c.outcomes).toEqual([{ title: "Clarté", body: "Des mots." }]);
    expect(c.accrocheSignature).toBe("Compris, pas parfait.");
    expect(c.accrocheCtaLabel).toBe("Réserver un premier échange");
    // cartes situation détaillées
    expect(c.situations).toHaveLength(2);
    expect(c.situations[0]).toMatchObject({
      title: "Clarifier",
      audience: "Vous questionnez.",
      items: ["Comprendre"],
      result: "Un cap.",
      ctaLabel: "Découvrir",
      ctaLink: "/particuliers/clarifier-avancer",
    });
    // bloc B sans cta_link → lien d'offre par défaut
    expect(c.situations[1]?.ctaLink).toBe("/particuliers/booster-recherche");
    // deux rich text distincts assainis
    expect(c.howIWorkHtml).toBe("clean(<p>En visio.</p>)");
    expect(c.howIWorkSignature).toBe("Structurer sans déshumaniser.");
    expect(c.whyDifferentHtml).toBe("clean(<p>10 ans.</p><ul><li>RH</li></ul>)");
    // format
    expect(c.formatItems).toEqual(["Séances d'une heure", "En visio"]);
    expect(c.formatBody).toBe("Pas des devoirs.");
    // témoignage + FAQ + CTA final
    expect(c.testimonial).toMatchObject({ quote: "Ça m'a aidée.", audience: "particulier" });
    expect(c.faq).toEqual([{ question: "CPF ?", answer: "clean(<p>Non.</p>)" }]);
    expect(c.ctaTitle).toBe("Un espace pour y voir clair ?");
    expect(c.ctaBody).toBe("Prendre du recul.");
    expect(c.ctaLabel).toBe("Réserver");
    expect(c.ctaSubtext).toBe("Échange gratuit.");
    expect(c.seo.title).toBe("L'Encre Humaine");
  });
});
