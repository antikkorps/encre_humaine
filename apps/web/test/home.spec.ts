// @vitest-environment node
//
// Composition du contenu de l'accueil — docs/01-accueil.md.
// Vérifie le mapping Directus → page : coercion des répéteurs JSON, masquage
// propre des sections vides, résolution SEO et fallbacks de hero/CTA (jamais de
// contenu éditorial en dur).
import { describe, expect, it } from "vitest";
import {
  mapArticles,
  mapB2c,
  mapBuild,
  mapHomeContent,
  mapIntro,
  mapMethod,
  mapRecognition,
  mapStats,
  mapTestimonial,
  mapWhy,
  type RawHome,
} from "../server/utils/content/home";

const BASE = "https://cms.example.fr";

describe("mapStats", () => {
  it("garde les items complets, masque les incomplets", () => {
    const stats = mapStats([
      { value: "10+", label: "ans d'expérience" },
      { value: "200", label: "" }, // label manquant → masqué
      { label: "sans valeur" }, // value manquante → masqué
      "bruit", // non-objet → ignoré
    ]);
    expect(stats).toEqual([{ value: "10+", label: "ans d'expérience" }]);
  });

  it("renvoie [] si la valeur n'est pas un tableau", () => {
    expect(mapStats(null)).toEqual([]);
    expect(mapStats("x")).toEqual([]);
  });
});

describe("mapRecognition", () => {
  it("null si totalement vide", () => {
    expect(mapRecognition({})).toBeNull();
  });

  it("compose titre, sous-titre, items (répéteur text) et conclusion", () => {
    expect(
      mapRecognition({
        recognition_title: "Par où commencer ?",
        recognition_items: [{ text: "Managers sans repères" }, { text: "" }, {}],
        recognition_conclusion: "  Vous avez besoin de méthode.  ",
      }),
    ).toEqual({
      title: "Par où commencer ?",
      subtitle: null,
      items: ["Managers sans repères"],
      conclusion: "Vous avez besoin de méthode.",
    });
  });
});

describe("mapBuild", () => {
  it("null si ni titre ni blocs", () => {
    expect(mapBuild({})).toBeNull();
  });

  it("mappe les blocs, CTA null si vide, URL par défaut /organisations", () => {
    expect(
      mapBuild({
        build_title: "Ce que je construis",
        build_blocks: [{ title: "Audit", body: "Faire le point." }, {}],
      }),
    ).toEqual({
      title: "Ce que je construis",
      blocks: [{ title: "Audit", body: "Faire le point." }],
      ctaLabel: null,
      ctaUrl: "/organisations",
    });
  });

  it("respecte le CTA et l'URL fournis", () => {
    const build = mapBuild({
      build_title: "T",
      build_cta_label: "Explorer",
      build_cta_url: "/offres",
    });
    expect(build).toMatchObject({ ctaLabel: "Explorer", ctaUrl: "/offres" });
  });
});

describe("mapMethod / mapWhy", () => {
  it("méthode : étapes titre/corps, masquée si vide", () => {
    expect(mapMethod({})).toBeNull();
    expect(
      mapMethod({
        method_title: "Ma méthode",
        method_steps: [{ title: "Comprendre", body: "J'écoute." }],
      }),
    ).toEqual({
      title: "Ma méthode",
      subtitle: null,
      steps: [{ title: "Comprendre", body: "J'écoute." }],
    });
  });

  it("signature : piliers + conclusion", () => {
    expect(
      mapWhy({
        why_title: "Trois expertises",
        why_items: [{ title: "Formation", body: "Concevoir." }],
        why_conclusion: "Double vision.",
      }),
    ).toEqual({
      title: "Trois expertises",
      subtitle: null,
      items: [{ title: "Formation", body: "Concevoir." }],
      conclusion: "Double vision.",
    });
  });
});

describe("mapIntro / mapB2c", () => {
  it("à propos : masqué si ni titre ni texte, CTA par défaut sinon", () => {
    expect(mapIntro({}, BASE)).toBeNull();
    expect(mapIntro({ intro_text: "Bonjour" }, BASE)).toEqual({
      title: "",
      text: "Bonjour",
      photo: null,
      ctaLabel: "Découvrir mon parcours",
    });
  });

  it("particuliers : cartes titre/corps, CTA par défaut", () => {
    expect(mapB2c({})).toBeNull();
    expect(
      mapB2c({
        b2c_section_title: "Transition ?",
        b2c_cards: [{ title: "Clarifier", body: "Faire le point." }],
      }),
    ).toEqual({
      title: "Transition ?",
      text: null,
      cards: [{ title: "Clarifier", body: "Faire le point." }],
      ctaLabel: "Découvrir les accompagnements",
    });
  });
});

describe("mapTestimonial", () => {
  it("null si citation absente ou relation non résolue (string)", () => {
    expect(mapTestimonial(null)).toBeNull();
    expect(mapTestimonial("uuid-non-résolu")).toBeNull();
    expect(mapTestimonial({ quote: "" })).toBeNull();
  });

  it("mappe les champs et n'accepte qu'une audience valide", () => {
    expect(
      mapTestimonial({
        quote: "Un vrai déclic.",
        author_name: "Marie",
        author_title: "DRH",
        company: "Acme",
        context: "PME industrie",
        audience: "organisation",
      }),
    ).toEqual({
      quote: "Un vrai déclic.",
      authorName: "Marie",
      authorTitle: "DRH",
      company: "Acme",
      context: "PME industrie",
      audience: "organisation",
    });
    expect(mapTestimonial({ quote: "x", audience: "n'importe quoi" })?.audience).toBeUndefined();
  });
});

describe("mapArticles", () => {
  it("mappe, résout couverture/catégorie, filtre les articles sans slug", () => {
    const articles = mapArticles(
      [
        {
          title: "Premier",
          slug: "premier",
          excerpt: "Chapeau",
          reading_time: 4,
          published_at: "2026-03-14",
          cover_image: { id: "c1", title: "Couv" },
          category: { name: "Organisations" },
        },
        { title: "Sans slug", slug: "" }, // filtré
      ],
      BASE,
    );
    expect(articles).toHaveLength(1);
    expect(articles[0]).toMatchObject({
      title: "Premier",
      slug: "premier",
      coverImage: `${BASE}/assets/c1`,
      coverAlt: "Couv",
      categoryName: "Organisations",
      readingTime: 4,
      publishedAt: "2026-03-14",
    });
  });

  it("renvoie [] hors tableau", () => {
    expect(mapArticles(null, BASE)).toEqual([]);
  });
});

describe("mapHomeContent", () => {
  it("page vide : sections dynamiques masquées, hero/ressources repliés sur leurs fallbacks", () => {
    const content = mapHomeContent({}, [], {}, BASE);
    expect(content.hero).toEqual({
      title: "L'Encre Humaine",
      subtitle: null,
      signature: null,
      tagline: [],
      proofs: [],
      ctaPrimaryLabel: "Prendre rendez-vous",
      ctaSecondaryLabel: "Découvrir l'approche",
    });
    expect(content.stats).toEqual([]);
    expect(content.recognition).toBeNull();
    expect(content.build).toBeNull();
    expect(content.method).toBeNull();
    expect(content.why).toBeNull();
    expect(content.intro).toBeNull();
    expect(content.b2c).toBeNull();
    expect(content.featuredTestimonial).toBeNull();
    expect(content.articles).toEqual([]);
    expect(content.resources).toEqual({
      title: "Réflexions, outils et retours de terrain.",
      subtitle: null,
      ctaLabel: "Voir toutes les ressources",
    });
    expect(content.finalCta).toBeNull();
  });

  it("compose le contenu réel, le CTA final (+ réassurance) et résout le SEO (fallback settings)", () => {
    const home: RawHome = {
      hero_title: "Quand votre organisation grandit",
      hero_subtitle: "J'aide les PME à structurer.",
      hero_tagline: ["Audit RH", "GEPP"],
      hero_proofs: ["10+ ans"],
      recognition_title: "Par où commencer ?",
      build_title: "Ce que je construis",
      method_title: "Ma méthode",
      why_title: "Trois expertises",
      intro_title: "Je suis Eléonore Morée.",
      b2c_section_title: "Une transition ?",
      final_cta_title: "On en parle ?",
      final_cta_description: "Sans engagement.",
      meta_title: "",
      meta_description: "",
    };
    const content = mapHomeContent(
      home,
      [],
      { brand_name: "L'Encre Humaine", default_meta_description: "Conseil RH." },
      BASE,
    );
    expect(content.hero.title).toBe("Quand votre organisation grandit");
    expect(content.hero.tagline).toEqual(["Audit RH", "GEPP"]);
    expect(content.hero.proofs).toEqual(["10+ ans"]);
    expect(content.recognition?.title).toBe("Par où commencer ?");
    expect(content.build?.title).toBe("Ce que je construis");
    expect(content.method?.title).toBe("Ma méthode");
    expect(content.why?.title).toBe("Trois expertises");
    expect(content.intro?.title).toBe("Je suis Eléonore Morée.");
    expect(content.b2c?.title).toBe("Une transition ?");
    expect(content.finalCta).toEqual({
      title: "On en parle ?",
      description: "Sans engagement.",
      label: "Prendre rendez-vous",
    });
    // meta vides → fallback site_settings
    expect(content.seo.title).toBe("L'Encre Humaine");
    expect(content.seo.description).toBe("Conseil RH.");
    expect(content.seo.noIndex).toBe(false);
  });

  it("og_image de la page prime sur le défaut, no_index propagé", () => {
    const content = mapHomeContent(
      { og_image: "page-og", no_index: true },
      [],
      { default_og_image: "default-og" },
      BASE,
    );
    expect(content.seo.ogImage).toBe(`${BASE}/assets/page-og`);
    expect(content.seo.noIndex).toBe(true);
  });
});
