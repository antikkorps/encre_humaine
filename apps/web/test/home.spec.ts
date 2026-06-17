// @vitest-environment node
//
// Composition du contenu de l'accueil — docs/01-accueil.md.
// Vérifie le mapping Directus → page : coercion des répéteurs JSON, masquage
// propre des sections vides (témoignage, articles, blocs), résolution SEO et
// fallbacks de hero (jamais de contenu éditorial en dur).
import { describe, expect, it } from "vitest";
import {
  mapArticles,
  mapBlock,
  mapHomeContent,
  mapStats,
  mapTestimonial,
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

describe("mapBlock", () => {
  it("masque le bloc sans titre", () => {
    expect(mapBlock("", "texte", ["t"], "/organisations")).toBeNull();
  });

  it("compose titre + texte + tags + lien", () => {
    expect(mapBlock("Organisations", "  J'accompagne…  ", ["Audit"], "/organisations")).toEqual({
      title: "Organisations",
      text: "J'accompagne…",
      tags: ["Audit"],
      to: "/organisations",
    });
  });

  it("text null si vide", () => {
    expect(mapBlock("Titre", "", [], "/x")?.text).toBeNull();
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
  it("page vide : sections dynamiques masquées, hero replié sur ses fallbacks", () => {
    const content = mapHomeContent({}, [], {}, BASE);
    expect(content.hero).toEqual({
      title: "L'Encre Humaine",
      subtitle: null,
      ctaB2bLabel: "Je suis une organisation",
      ctaB2cLabel: "Je suis un particulier",
    });
    expect(content.stats).toEqual([]);
    expect(content.blockB2b).toBeNull();
    expect(content.blockB2c).toBeNull();
    expect(content.intro).toBeNull();
    expect(content.featuredTestimonial).toBeNull();
    expect(content.articles).toEqual([]);
    expect(content.finalCta).toBeNull();
  });

  it("compose le contenu réel et résout le SEO (fallback settings)", () => {
    const home: RawHome = {
      hero_title: "Donner de l'élan aux organisations",
      hero_subtitle: "Conseil RH & accompagnement",
      block_b2b_title: "Organisations",
      block_b2c_title: "Particuliers",
      intro_title: "Qui je suis",
      final_cta_title: "On en parle ?",
      meta_title: "",
      meta_description: "",
    };
    const content = mapHomeContent(
      home,
      [],
      { brand_name: "L'Encre Humaine", default_meta_description: "Conseil RH." },
      BASE,
    );
    expect(content.hero.title).toBe("Donner de l'élan aux organisations");
    expect(content.blockB2b?.to).toBe("/organisations");
    expect(content.blockB2c?.to).toBe("/particuliers");
    expect(content.intro?.title).toBe("Qui je suis");
    expect(content.finalCta).toEqual({ title: "On en parle ?", label: "Travaillons ensemble" });
    // meta vides → fallback site_settings
    expect(content.seo.title).toBe("L'Encre Humaine");
    expect(content.seo.description).toBe("Conseil RH.");
    expect(content.seo.noIndex).toBe(false);
  });

  it("intro masquée si ni titre ni texte, mais visible avec le seul texte", () => {
    expect(mapHomeContent({ intro_text: "Bonjour" }, [], {}, BASE).intro).toEqual({
      title: "",
      text: "Bonjour",
      photo: null,
    });
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
