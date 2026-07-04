// @vitest-environment node
//
// Composition du contenu « À propos » — docs/02-a-propos.md.
// Vérifie : masquage propre des sections vides, passage des champs rich-text par
// l'assainisseur (injecté), répéteurs (convictions, principes, liste « je ne fais
// pas »), CTA + SEO.
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
  it("page vide : sections masquées, CTA replié sur son fallback", () => {
    const c = mapAboutContent({}, {}, BASE, wrap);
    expect(c.accroche).toBeNull();
    expect(c.story).toBeNull();
    expect(c.why).toBeNull();
    expect(c.octopus).toBeNull();
    expect(c.convictions).toBeNull();
    expect(c.work).toBeNull();
    expect(c.whatIDontDo).toBeNull();
    expect(c.portrait).toBeNull();
    expect(c.cta).toEqual({ title: "", body: null, label: "Travaillons ensemble" });
  });

  it("assainit les champs rich-text (accroche/story/why/octopus)", () => {
    const c = mapAboutContent(
      {
        accroche_body: "<p>a</p>",
        story_body: "<p>hi</p>",
        why_body: "<b>x</b>",
        octopus_body: "<i>o</i>",
      },
      {},
      BASE,
      wrap,
    );
    expect(c.accroche).toEqual({ title: "", bodyHtml: "clean(<p>a</p>)" });
    expect(c.story).toEqual({ title: "", photo: null, bodyHtml: "clean(<p>hi</p>)" });
    expect(c.why).toEqual({ title: "", bodyHtml: "clean(<b>x</b>)" });
    expect(c.octopus).toEqual({ subtitle: "", bodyHtml: "clean(<i>o</i>)" });
  });

  it("« Mon parcours » visible avec la seule photo (corps vide)", () => {
    const c = mapAboutContent({ story_photo: "f1" }, {}, BASE, wrap);
    expect(c.story).toEqual({
      title: "",
      photo: { url: `${BASE}/assets/f1`, alt: "", width: null, height: null },
      bodyHtml: "",
    });
  });

  it("liste « ce que je ne fais pas » + principes titre/corps", () => {
    const c = mapAboutContent(
      {
        what_i_dont_do_title: "Ce que je ne fais pas",
        what_i_dont_do: [{ text: "A" }, { text: "" }, {}],
        work_title: "Comment je travaille",
        how_i_work: [{ title: "J'écoute", body: "Avant de conseiller." }],
      },
      {},
      BASE,
      wrap,
    );
    expect(c.whatIDontDo).toEqual({ title: "Ce que je ne fais pas", items: ["A"] });
    expect(c.work).toEqual({
      title: "Comment je travaille",
      intro: null,
      principles: [{ title: "J'écoute", body: "Avant de conseiller." }],
      location: null,
    });
  });

  it("portrait visible avec la seule citation", () => {
    expect(mapAboutContent({ personal_quote: "Une citation." }, {}, BASE, wrap).portrait).toEqual({
      photo: null,
      quote: "Une citation.",
    });
  });

  it("convictions + CTA + SEO (fallback site_settings)", () => {
    const c = mapAboutContent(
      {
        convictions_title: "Mes convictions",
        convictions: [{ title: "Écoute", body: "D'abord." }],
        cta_title: "On se parle ?",
        cta_label: "Discutons-en",
        meta_title: "",
      },
      { brand_name: "L'Encre Humaine", default_meta_description: "Conseil RH." },
      BASE,
      wrap,
    );
    expect(c.convictions).toEqual({
      title: "Mes convictions",
      items: [{ title: "Écoute", body: "D'abord." }],
    });
    expect(c.cta).toEqual({ title: "On se parle ?", body: null, label: "Discutons-en" });
    expect(c.seo.title).toBe("L'Encre Humaine");
    expect(c.seo.description).toBe("Conseil RH.");
  });
});
