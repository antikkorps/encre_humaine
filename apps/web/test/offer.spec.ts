// @vitest-environment node
//
// Composition du gabarit Offre — docs/05-offres-gabarit.md.
// Vérifie : audience bornée, répéteurs mission/outcomes/audience_fit, passage du
// rich-text `format_body` par l'assainisseur (injecté), FAQ assainie, témoignage
// masqué si vide, SEO, et le mapping slug → scope(s) de FAQ.
import { describe, expect, it } from "vitest";
import {
  FAQ_SCOPE_BY_SLUG,
  faqScopesForSlug,
  mapOfferContent,
} from "../server/utils/content/offer";

const BASE = "https://cms.example.fr";
// Sanitizer factice : marque le passage (et "" sur entrée vide, comme le vrai).
const wrap = (h?: string | null) => (h ? `clean(${h})` : "");

describe("faqScopesForSlug", () => {
  it("ajoute toujours « general » au scope spécifique de l'offre", () => {
    expect(faqScopesForSlug("audit-rh")).toEqual(["audit", "general"]);
    expect(faqScopesForSlug("clarifier-avancer")).toEqual(["b2c", "general"]);
  });

  it("slug inconnu → seulement « general »", () => {
    expect(faqScopesForSlug("offre-inexistante")).toEqual(["general"]);
  });

  it("couvre les 5 slugs documentés", () => {
    expect(Object.keys(FAQ_SCOPE_BY_SLUG)).toHaveLength(5);
  });
});

describe("mapOfferContent", () => {
  it("offre minimale : sections vides masquées, audience nulle, CTA replié", () => {
    const c = mapOfferContent({}, [], {}, BASE, wrap);
    expect(c.audience).toBeNull();
    expect(c.accrocheTitle).toBeNull();
    expect(c.accrocheBody).toBeNull();
    expect(c.missionIncludes).toEqual([]);
    expect(c.formatBodyHtml).toBe("");
    expect(c.outcomes).toEqual([]);
    expect(c.audienceFit).toEqual([]);
    expect(c.durationLabel).toBeNull();
    expect(c.priceLabel).toBeNull();
    expect(c.priceNote).toBeNull();
    expect(c.faq).toEqual([]);
    expect(c.testimonial).toBeNull();
    expect(c.ctaLabel).toBe("Prendre rendez-vous");
  });

  it("borne l'audience (valide conservée, invalide → null)", () => {
    expect(mapOfferContent({ audience: "organisation" }, [], {}, BASE, wrap).audience).toBe(
      "organisation",
    );
    expect(mapOfferContent({ audience: "particulier" }, [], {}, BASE, wrap).audience).toBe(
      "particulier",
    );
    expect(mapOfferContent({ audience: "autre" }, [], {}, BASE, wrap).audience).toBeNull();
  });

  it("assainit format_body via le sanitizer injecté", () => {
    expect(
      mapOfferContent({ format_body: "<p>Étapes</p>" }, [], {}, BASE, wrap).formatBodyHtml,
    ).toBe("clean(<p>Étapes</p>)");
  });

  it("mappe les répéteurs mission/outcomes/audience_fit", () => {
    const c = mapOfferContent(
      {
        mission_includes: [{ text: "Diagnostic" }, "Plan d'action", { text: "" }],
        outcomes: [
          { title: "Clarté", body: "Une feuille de route." },
          { title: "", body: "" }, // vide → filtré
        ],
        audience_fit: [{ text: "DRH de PME" }, { text: "" }],
      },
      [],
      {},
      BASE,
      wrap,
    );
    expect(c.missionIncludes).toEqual(["Diagnostic", "Plan d'action"]);
    expect(c.outcomes).toEqual([{ title: "Clarté", body: "Une feuille de route." }]);
    expect(c.audienceFit).toEqual(["DRH de PME"]);
  });

  it("assainit la FAQ et masque le témoignage non résolu (string)", () => {
    const c = mapOfferContent(
      { featured_testimonial: "uuid-non-resolu" },
      [{ question: "Combien de temps ?", answer: "<p>4 semaines.</p>" }],
      {},
      BASE,
      wrap,
    );
    expect(c.faq).toEqual([
      { question: "Combien de temps ?", answer: "clean(<p>4 semaines.</p>)" },
    ]);
    expect(c.testimonial).toBeNull();
  });

  it("mappe le témoignage vedette résolu", () => {
    const c = mapOfferContent(
      {
        featured_testimonial: { quote: "Décisif.", author_name: "Marie", audience: "organisation" },
      },
      [],
      {},
      BASE,
      wrap,
    );
    expect(c.testimonial?.quote).toBe("Décisif.");
    expect(c.testimonial?.authorName).toBe("Marie");
  });

  it("mappe prix/durée/CTA et le SEO (fallback site_settings)", () => {
    const c = mapOfferContent(
      {
        accroche_title: "Audit RH express",
        accroche_body: "Un état des lieux actionnable.",
        duration_label: "4 semaines",
        price_label: "1 500 – 2 500 € HT",
        price_note: "Acompte 30 %.",
        cta_label: "Réserver un échange",
        meta_title: "",
      },
      [],
      { brand_name: "L'Encre Humaine", default_meta_description: "Conseil RH." },
      BASE,
      wrap,
    );
    expect(c.accrocheTitle).toBe("Audit RH express");
    expect(c.accrocheBody).toBe("Un état des lieux actionnable.");
    expect(c.durationLabel).toBe("4 semaines");
    expect(c.priceLabel).toBe("1 500 – 2 500 € HT");
    expect(c.priceNote).toBe("Acompte 30 %.");
    expect(c.ctaLabel).toBe("Réserver un échange");
    expect(c.seo.title).toBe("L'Encre Humaine");
    expect(c.seo.description).toBe("Conseil RH.");
  });
});
