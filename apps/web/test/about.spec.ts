// @vitest-environment node
//
// Composition du contenu « À propos » — docs/02-a-propos.md.
// Vérifie : masquage propre des sections vides, passage des 4 champs rich-text
// par l'assainisseur (injecté), répéteurs convictions/how_i_work, SEO.
import { describe, expect, it } from "vitest";
import { mapAboutContent, mapConvictions } from "../server/utils/content/about";

const BASE = "https://cms.example.fr";
// Sanitizer factice : marque le passage (et "" sur entrée vide, comme le vrai).
const wrap = (h?: string | null) => (h ? `clean(${h})` : "");

describe("mapConvictions", () => {
  it("garde les items ayant titre OU corps, masque les vides", () => {
    expect(
      mapConvictions([
        { title: "Confiance", body: "Le socle." },
        { title: "", body: "" },
        { body: "Sans titre" },
        "bruit",
      ]),
    ).toEqual([
      { title: "Confiance", body: "Le socle." },
      { title: "", body: "Sans titre" },
    ]);
  });

  it("renvoie [] hors tableau", () => {
    expect(mapConvictions(null)).toEqual([]);
  });
});

describe("mapAboutContent", () => {
  it("page vide : toutes les sections masquées, CTA replié sur son fallback", () => {
    const c = mapAboutContent({}, {}, BASE, wrap);
    expect(c.accroche).toBeNull();
    expect(c.story).toBeNull();
    expect(c.why).toBeNull();
    expect(c.octopusHtml).toBeNull();
    expect(c.convictions).toEqual([]);
    expect(c.howIWork).toEqual([]);
    expect(c.whatIDontDoHtml).toBeNull();
    expect(c.portrait).toBeNull();
    expect(c.ctaLabel).toBe("Travaillons ensemble");
  });

  it("assainit les 4 champs rich-text via le sanitizer injecté", () => {
    const c = mapAboutContent(
      {
        story_body: "<p>hi</p>",
        why_body: "<b>x</b>",
        octopus_body: "<i>o</i>",
        what_i_dont_do: "<p>no</p>",
      },
      {},
      BASE,
      wrap,
    );
    expect(c.story).toEqual({ photo: null, bodyHtml: "clean(<p>hi</p>)" });
    expect(c.why).toEqual({ title: "", bodyHtml: "clean(<b>x</b>)" });
    expect(c.octopusHtml).toBe("clean(<i>o</i>)");
    expect(c.whatIDontDoHtml).toBe("clean(<p>no</p>)");
  });

  it("section « Mon histoire » visible avec la seule photo (corps vide)", () => {
    const c = mapAboutContent({ story_photo: "f1" }, {}, BASE, wrap);
    expect(c.story).toEqual({
      photo: { url: `${BASE}/assets/f1`, alt: "", width: null, height: null },
      bodyHtml: "",
    });
  });

  it("section « Pourquoi » visible avec le seul titre", () => {
    expect(mapAboutContent({ why_title: "Pourquoi" }, {}, BASE, wrap).why).toEqual({
      title: "Pourquoi",
      bodyHtml: "",
    });
  });

  it("portrait visible avec la seule citation", () => {
    expect(mapAboutContent({ personal_quote: "Une citation." }, {}, BASE, wrap).portrait).toEqual({
      photo: null,
      quote: "Une citation.",
    });
  });

  it("mappe les répéteurs et le SEO (fallback site_settings)", () => {
    const c = mapAboutContent(
      {
        accroche: "Donner du sens au travail",
        convictions: [{ title: "Écoute", body: "D'abord." }],
        how_i_work: [{ text: "Cadrer" }, "Co-construire", { text: "" }],
        cta_label: "Discutons-en",
        meta_title: "",
      },
      { brand_name: "L'Encre Humaine", default_meta_description: "Conseil RH." },
      BASE,
      wrap,
    );
    expect(c.accroche).toBe("Donner du sens au travail");
    expect(c.convictions).toEqual([{ title: "Écoute", body: "D'abord." }]);
    expect(c.howIWork).toEqual(["Cadrer", "Co-construire"]);
    expect(c.ctaLabel).toBe("Discutons-en");
    expect(c.seo.title).toBe("L'Encre Humaine");
    expect(c.seo.description).toBe("Conseil RH.");
  });
});
