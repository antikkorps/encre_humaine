// @vitest-environment node
//
// Helpers partagés des loaders de contenu — server/utils/content/_shared.ts.
// Coercion fichier → URL d'asset + alt, listes de répéteurs, résolution SEO.
import { describe, expect, it } from "vitest";
import {
  mapFaqItems,
  mapNumberedSteps,
  mapOffers,
  mapPhoto,
  mapSeo,
  mapStringList,
  mapTestimonialItem,
  mapTestimonials,
  mapTitledItems,
  safeHref,
  testimonialsForOffer,
} from "../server/utils/content/_shared";

const BASE = "https://cms.example.fr";
// Sanitizer factice : marque le passage (et "" sur entrée vide, comme le vrai).
const wrap = (h?: string | null) => (h ? `clean(${h})` : "");

describe("mapPhoto", () => {
  it("résout l'URL d'asset et l'alt depuis le titre du fichier", () => {
    expect(
      mapPhoto({ id: "f1", title: "Eléonore", description: null, width: 800, height: 600 }, BASE),
    ).toEqual({ url: `${BASE}/assets/f1`, alt: "Eléonore", width: 800, height: 600 });
  });

  it("ID brut (string) → URL d'asset, alt vide (pas de métadonnée)", () => {
    expect(mapPhoto("f9", BASE)).toEqual({
      url: `${BASE}/assets/f9`,
      alt: "",
      width: null,
      height: null,
    });
  });

  it("retombe sur la description si pas de titre, alt vide si rien", () => {
    expect(mapPhoto({ id: "f2", description: "Portrait" }, BASE)?.alt).toBe("Portrait");
    expect(mapPhoto({ id: "f3" }, BASE)?.alt).toBe("");
  });

  it("null si pas de fichier", () => {
    expect(mapPhoto(null, BASE)).toBeNull();
    expect(mapPhoto(undefined, BASE)).toBeNull();
  });
});

describe("mapStringList", () => {
  it("accepte des chaînes ou des répéteurs {text|value}, filtre le vide", () => {
    expect(mapStringList(["Audit", { text: "Coaching" }, { value: "RH" }, "", "  "])).toEqual([
      "Audit",
      "Coaching",
      "RH",
    ]);
  });

  it("renvoie [] hors tableau", () => {
    expect(mapStringList(undefined)).toEqual([]);
  });
});

describe("mapSeo", () => {
  it("priorise les champs de la page, fallback site_settings, OG → asset", () => {
    expect(
      mapSeo(
        {
          meta_title: "Titre page",
          meta_description: "Desc page",
          og_image: "og1",
          no_index: true,
        },
        { brand_name: "Marque", default_meta_description: "Desc défaut", default_og_image: "ogd" },
        BASE,
      ),
    ).toEqual({
      title: "Titre page",
      description: "Desc page",
      ogImage: `${BASE}/assets/og1`,
      noIndex: true,
    });
  });

  it("retombe sur site_settings quand la page n'a rien", () => {
    expect(
      mapSeo(
        {},
        { brand_name: "Marque", default_meta_description: "Desc défaut", default_og_image: "ogd" },
        BASE,
      ),
    ).toEqual({
      title: "Marque",
      description: "Desc défaut",
      ogImage: `${BASE}/assets/ogd`,
      noIndex: false,
    });
  });

  it("dernier fallback de titre = nom du site en dur", () => {
    expect(mapSeo({}, {}, BASE).title).toBe("L'Encre Humaine");
    expect(mapSeo({}, {}, BASE).description).toBeNull();
    expect(mapSeo({}, {}, BASE).ogImage).toBeNull();
  });
});

describe("mapTestimonialItem / mapTestimonials", () => {
  it("null si citation absente, relation non résolue (string) ou non-objet", () => {
    expect(mapTestimonialItem(null)).toBeNull();
    expect(mapTestimonialItem("uuid")).toBeNull();
    expect(mapTestimonialItem({ quote: "" })).toBeNull();
  });

  it("mappe les champs et borne l'audience", () => {
    expect(
      mapTestimonialItem({
        quote: "Top.",
        author_name: "Marie",
        author_title: "DRH",
        company: "Acme",
        context: "PME",
        audience: "organisation",
      }),
    ).toEqual({
      quote: "Top.",
      authorName: "Marie",
      authorTitle: "DRH",
      company: "Acme",
      context: "PME",
      audience: "organisation",
      offers: [],
      rating: undefined,
    });
    expect(mapTestimonialItem({ quote: "x", audience: "autre" })?.audience).toBeUndefined();
  });

  it("résout la photo (bulle) et borne la note de satisfaction à 1–5", () => {
    const t = mapTestimonialItem({ quote: "x", photo: "file-uuid", rating: 4 }, BASE);
    expect(t?.photo).toEqual({
      url: `${BASE}/assets/file-uuid`,
      alt: "",
      width: null,
      height: null,
    });
    expect(t?.rating).toBe(4);
    // Sans base d'assets (mappers appelés sans URL), pas de photo → poulpe à l'affichage.
    expect(mapTestimonialItem({ quote: "x", photo: "file-uuid" })?.photo).toBeUndefined();
    // Notes hors bornes ou non entières : ignorées (aucune étoile affichée).
    for (const rating of [0, 6, 2.5, "beaucoup", null]) {
      expect(mapTestimonialItem({ quote: "x", rating }, BASE)?.rating).toBeUndefined();
    }
  });

  it("filtre les entrées invalides de la liste", () => {
    expect(mapTestimonials([{ quote: "ok" }, { quote: "" }, "uuid", null])).toEqual([
      {
        quote: "ok",
        authorName: "",
        authorTitle: undefined,
        company: undefined,
        context: undefined,
        audience: undefined,
        offers: [],
        rating: undefined,
      },
    ]);
    expect(mapTestimonials(null)).toEqual([]);
  });
});

describe("testimonialsForOffer", () => {
  const item = (quote: string, audience: string, offers: string[] = []) =>
    ({ quote, authorName: "", audience, offers }) as never;

  const orgSansOffre = item("org", "organisation");
  const b2cSansOffre = item("b2c", "particulier");
  const epingleAudit = item("audit", "organisation", ["audit-rh"]);
  const epingleDeux = item("deux", "organisation", ["audit-rh", "managers-equipes"]);
  const items = [orgSansOffre, b2cSansOffre, epingleAudit, epingleDeux];

  it("sans case cochée : le témoignage suit le public de l'offre", () => {
    expect(testimonialsForOffer([orgSansOffre, b2cSansOffre], "audit-rh", "organisation")).toEqual([
      orgSansOffre,
    ]);
    expect(
      testimonialsForOffer([orgSansOffre, b2cSansOffre], "clarifier-avancer", "particulier"),
    ).toEqual([b2cSansOffre]);
  });

  it("avec des offres cochées : il ne sort que sur celles-là", () => {
    expect(testimonialsForOffer(items, "audit-rh", "organisation")).toEqual([
      orgSansOffre,
      epingleAudit,
      epingleDeux,
    ]);
    // Épinglé ailleurs → absent de cette offre, même si le public correspond.
    expect(testimonialsForOffer(items, "competences-parcours", "organisation")).toEqual([
      orgSansOffre,
    ]);
    expect(testimonialsForOffer(items, "managers-equipes", "organisation")).toEqual([
      orgSansOffre,
      epingleDeux,
    ]);
  });

  it("offre sans public : seuls les témoignages épinglés sortent", () => {
    expect(testimonialsForOffer(items, "audit-rh", null)).toEqual([epingleAudit, epingleDeux]);
  });
});

describe("mapOffers", () => {
  it("mappe le résumé, applique l'audience de repli, filtre titre/slug manquants", () => {
    const offers = mapOffers(
      [
        {
          title: "Audit RH",
          slug: "audit-rh",
          icon: "search",
          short_description: "Un état des lieux.",
          duration_label: "4 semaines",
          price_label: "1 500 – 2 500 € HT",
        },
        { title: "Sans slug", slug: "" }, // filtré
        { slug: "sans-titre" }, // filtré
      ],
      "organisation",
    );
    expect(offers).toEqual([
      {
        title: "Audit RH",
        slug: "audit-rh",
        audience: "organisation",
        icon: "search",
        shortDescription: "Un état des lieux.",
        durationLabel: "4 semaines",
        priceLabel: "1 500 – 2 500 € HT",
      },
    ]);
  });

  it("préfère l'audience de l'offre si valide, sinon le repli", () => {
    expect(
      mapOffers([{ title: "T", slug: "s", audience: "particulier" }], "organisation")[0]?.audience,
    ).toBe("particulier");
    expect(mapOffers([{ title: "T", slug: "s", audience: "x" }], "organisation")[0]?.audience).toBe(
      "organisation",
    );
  });
});

describe("mapTitledItems", () => {
  it("garde les items ayant titre OU corps, filtre les vides et le bruit", () => {
    expect(
      mapTitledItems([
        { title: "Clarté", body: "Une feuille de route." },
        { title: "", body: "" },
        { body: "Sans titre" },
        "bruit",
      ]),
    ).toEqual([
      { title: "Clarté", body: "Une feuille de route." },
      { title: "", body: "Sans titre" },
    ]);
  });

  it("renvoie [] hors tableau", () => {
    expect(mapTitledItems(null)).toEqual([]);
  });
});

describe("mapNumberedSteps", () => {
  it("tolère number en nombre ou chaîne, filtre les étapes vides", () => {
    expect(
      mapNumberedSteps([
        { number: 1, title: "Cadrage", description: "On pose le besoin." },
        { number: "2", title: "Diagnostic", description: "" },
        { number: 3, title: "", description: "" }, // vide → filtré
      ]),
    ).toEqual([
      { number: "1", title: "Cadrage", description: "On pose le besoin." },
      { number: "2", title: "Diagnostic", description: "" },
    ]);
  });

  it("renvoie [] hors tableau", () => {
    expect(mapNumberedSteps(null)).toEqual([]);
  });
});

describe("mapFaqItems", () => {
  it("assainit answer via le sanitizer injecté, filtre les entrées vides", () => {
    expect(
      mapFaqItems(
        [
          { question: "C'est pour qui ?", answer: "<p>Pour vous.</p>" },
          { question: "", answer: "" }, // vide → filtré
          { answer: "<b>Sans question</b>" },
        ],
        wrap,
      ),
    ).toEqual([
      { question: "C'est pour qui ?", answer: "clean(<p>Pour vous.</p>)" },
      { question: "", answer: "clean(<b>Sans question</b>)" },
    ]);
  });

  it("renvoie [] hors tableau", () => {
    expect(mapFaqItems(null, wrap)).toEqual([]);
  });
});

describe("safeHref", () => {
  it("laisse passer http(s), mailto, tel et les chemins relatifs", () => {
    for (const href of [
      "https://cal.com/eleonore/30min",
      "http://exemple.fr",
      "mailto:contact@encrehumaine.fr",
      "tel:+33600000000",
      "/organisations/audit-rh",
      "#rdv",
      "?filtre=terrain",
      "ressources/le-flou",
    ]) {
      expect(safeHref(href)).toBe(href);
    }
  });

  it("refuse les schémas exécutables, y compris obfusqués (espaces, tabulation, casse)", () => {
    for (const href of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "java\tscript:alert(1)",
      "  javascript:alert(1)  ",
      "data:text/html;base64,PHNjcmlwdD4=",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
    ]) {
      expect(safeHref(href)).toBe("");
    }
  });

  it("refuse les URL protocol-relative (externe déguisée en chemin)", () => {
    expect(safeHref("//ailleurs.tld/piege")).toBe("");
  });

  it('renvoie "" pour une entrée vide ou non-chaîne', () => {
    expect(safeHref("")).toBe("");
    expect(safeHref("   ")).toBe("");
    expect(safeHref(null)).toBe("");
    expect(safeHref(42)).toBe("");
  });
});
