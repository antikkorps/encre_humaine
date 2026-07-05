// @vitest-environment node
//
// Composition du gabarit Offre — docs/05-offres-gabarit.md.
// Vérifie : audience bornée, répéteurs mission/outcomes/contexte (titre/corps),
// audience_fit (liste), passage du rich-text `format_body` par l'assainisseur
// (injecté), FAQ assainie, témoignage masqué si vide, CTA (titre/texte/sous-texte)
// avec fallbacks, SEO, et le mapping slug → scope(s) de FAQ.
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
    expect(c.accrocheSubtitle).toBeNull();
    expect(c.accrocheBody).toBeNull();
    expect(c.accrocheSignature).toBeNull();
    expect(c.outcomesTitle).toBeNull();
    expect(c.outcomesIntro).toBeNull();
    expect(c.outcomes).toEqual([]);
    expect(c.context).toBeNull();
    expect(c.approche).toBeNull();
    expect(c.missionTitle).toBeNull();
    expect(c.missionIntro).toBeNull();
    expect(c.missionIncludes).toEqual([]);
    expect(c.formatTitle).toBeNull();
    expect(c.formatBodyHtml).toBe("");
    expect(c.audienceFitTitle).toBeNull();
    expect(c.audienceFit).toEqual([]);
    expect(c.audienceFitConclusion).toBeNull();
    expect(c.durationLabel).toBeNull();
    expect(c.priceLabel).toBeNull();
    expect(c.priceNote).toBeNull();
    expect(c.faq).toEqual([]);
    expect(c.testimonial).toBeNull();
    expect(c.ctaTitle).toBeNull();
    expect(c.ctaBody).toBeNull();
    expect(c.ctaLabel).toBe("Prendre rendez-vous");
    expect(c.ctaSubtext).toBeNull();
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

  it("assainit format_body via le sanitizer injecté ; titre format & intro mission surchargeables", () => {
    const c = mapOfferContent(
      {
        format_body: "<p>Étapes</p>",
        format_title: "Le déroulé",
        mission_intro: "Sur mesure.",
      },
      [],
      {},
      BASE,
      wrap,
    );
    expect(c.formatBodyHtml).toBe("clean(<p>Étapes</p>)");
    expect(c.formatTitle).toBe("Le déroulé");
    expect(c.missionIntro).toBe("Sur mesure.");
  });

  it("mappe mission/outcomes (titre/corps), audience_fit (liste) et le contexte", () => {
    const c = mapOfferContent(
      {
        mission_includes: [
          { title: "Diagnostic", body: "Analyse." },
          { title: "", body: "" },
        ],
        outcomes: [
          { title: "Clarté", body: "Une feuille de route." },
          { title: "", body: "" },
        ],
        audience_fit: [{ text: "DRH de PME" }, { text: "" }],
        context_title: "Situations fréquentes",
        context_items: [{ title: "Compétences peu lisibles", body: "Pas formalisées." }],
        context_conclusion: "L'audit remet de la lecture.",
      },
      [],
      {},
      BASE,
      wrap,
    );
    expect(c.missionIncludes).toEqual([{ title: "Diagnostic", body: "Analyse." }]);
    expect(c.outcomes).toEqual([{ title: "Clarté", body: "Une feuille de route." }]);
    expect(c.audienceFit).toEqual(["DRH de PME"]);
    expect(c.context).toEqual({
      title: "Situations fréquentes",
      items: [{ title: "Compétences peu lisibles", body: "Pas formalisées." }],
      conclusion: "L'audit remet de la lecture.",
    });
  });

  it("mappe la section « approche » (corps rich-text assaini) ; masquée si tout est vide", () => {
    const c = mapOfferContent(
      {
        approche_title: "Parce qu'une compétence n'existe jamais seule.",
        approche_body: "<p>Derrière chaque compétence, il y a une personne.</p>",
        approche_signature: "Structurer sans déshumaniser.",
      },
      [],
      {},
      BASE,
      wrap,
    );
    expect(c.approche).toEqual({
      title: "Parce qu'une compétence n'existe jamais seule.",
      bodyHtml: "clean(<p>Derrière chaque compétence, il y a une personne.</p>)",
      signature: "Structurer sans déshumaniser.",
    });
    // Signature seule suffit à afficher la section (titre/corps facultatifs).
    expect(mapOfferContent({ approche_signature: "x" }, [], {}, BASE, wrap).approche).toEqual({
      title: null,
      bodyHtml: "",
      signature: "x",
    });
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

  it("mappe accroche, CTA, prix/durée et le SEO (fallback site_settings)", () => {
    const c = mapOfferContent(
      {
        accroche_title: "Audit RH",
        accroche_subtitle: "Où en êtes-vous ?",
        accroche_body: "Un état des lieux.",
        accroche_signature: "Un point de clarté.",
        outcomes_title: "Ce que ça change",
        outcomes_intro: "Comprendre vite.",
        duration_label: "4 semaines",
        price_label: "Sur devis",
        price_note: "Acompte 30 %.",
        cta_title: "On y va ?",
        cta_body: "Il faut d'abord lire.",
        cta_label: "Réserver un échange",
        cta_subtext: "30 min sans engagement.",
        meta_title: "",
      },
      [],
      { brand_name: "L'Encre Humaine", default_meta_description: "Conseil RH." },
      BASE,
      wrap,
    );
    expect(c.accrocheTitle).toBe("Audit RH");
    expect(c.accrocheSubtitle).toBe("Où en êtes-vous ?");
    expect(c.accrocheSignature).toBe("Un point de clarté.");
    expect(c.outcomesTitle).toBe("Ce que ça change");
    expect(c.outcomesIntro).toBe("Comprendre vite.");
    expect(c.ctaTitle).toBe("On y va ?");
    expect(c.ctaBody).toBe("Il faut d'abord lire.");
    expect(c.ctaLabel).toBe("Réserver un échange");
    expect(c.ctaSubtext).toBe("30 min sans engagement.");
    expect(c.durationLabel).toBe("4 semaines");
    expect(c.priceLabel).toBe("Sur devis");
    expect(c.priceNote).toBe("Acompte 30 %.");
    expect(c.seo.title).toBe("L'Encre Humaine");
    expect(c.seo.description).toBe("Conseil RH.");
  });
});
