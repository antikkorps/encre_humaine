// @vitest-environment node
//
// Composition du hub Organisations — docs/03-organisations-hub.md.
// Vérifie : accroche, constats, offres dynamiques (résumé + audience), méthode,
// différenciateur (rich text assaini), pour-qui, témoignages b2b masqués si
// vides, CTA (titre/texte/sous-texte) avec fallbacks, SEO.
import { describe, expect, it } from "vitest";
import { mapOrgHubContent } from "../server/utils/content/org-hub";

const BASE = "https://cms.example.fr";
const wrap = (h?: string | null) => (h ? `clean(${h})` : "");

describe("mapOrgHubContent", () => {
  it("hub vide : sections masquées, CTA replié sur ses fallbacks", () => {
    const c = mapOrgHubContent({}, [], [], {}, BASE, wrap);
    expect(c.accrocheTitle).toBeNull();
    expect(c.observe).toBeNull();
    expect(c.offers).toEqual([]);
    expect(c.offersTitle).toBe("Mes offres pour les organisations");
    expect(c.situationsTitle).toBeNull();
    expect(c.situations).toEqual([]);
    expect(c.method).toBeNull();
    expect(c.differentiator).toBeNull();
    expect(c.audience).toBeNull();
    expect(c.testimonials).toEqual([]);
    expect(c.cta).toEqual({
      title: "Travaillons ensemble",
      body: null,
      label: "Prendre rendez-vous",
      subtext: null,
    });
  });

  it("compose accroche, constats, offres, méthode, différenciateur (assaini), CTA", () => {
    const c = mapOrgHubContent(
      {
        accroche_title: "Vos pratiques RH doivent évoluer",
        accroche_subtitle: "Les équipes grandissent.",
        observe_title: "Un besoin de clarté",
        observe_items: [{ title: "Compétences peu visibles", body: "Pas identifiées." }],
        observe_conclusion: "Plus de lisibilité.",
        method_title: "Ma démarche",
        method_steps: [{ number: "01", title: "Comprendre", description: "J'écoute." }],
        differentiator_title: "Sans perdre les personnes",
        differentiator_body: "<p>double lecture</p>",
        audience_title: "Fait pour vous si…",
        audience_items: [{ text: "Vous grandissez vite" }, "Vous voulez structurer"],
        audience_conclusion: "Avancer ensemble.",
        offers_title: "Trois façons d'aider",
        testimonials_title: "Elles en parlent",
        cta_title: "On commence ?",
        cta_body: "Un regard extérieur aide.",
        cta_label: "Prendre RDV",
        cta_subtext: "30 min sans engagement.",
      },
      [
        { title: "Audit RH", slug: "audit-rh", short_description: "État des lieux." },
        { slug: "sans-titre" }, // filtré (pas de titre)
      ],
      [{ quote: "Un vrai partenaire.", author_name: "Marie", audience: "organisation" }],
      { brand_name: "L'Encre Humaine" },
      BASE,
      wrap,
    );
    expect(c.accrocheTitle).toBe("Vos pratiques RH doivent évoluer");
    expect(c.accrocheSubtitle).toBe("Les équipes grandissent.");
    expect(c.observe).toEqual({
      title: "Un besoin de clarté",
      intro: null,
      items: [{ title: "Compétences peu visibles", body: "Pas identifiées." }],
      conclusion: "Plus de lisibilité.",
    });
    expect(c.offers).toHaveLength(1);
    expect(c.offers[0]).toMatchObject({ slug: "audit-rh", audience: "organisation" });
    expect(c.offersTitle).toBe("Trois façons d'aider");
    expect(c.method).toEqual({
      title: "Ma démarche",
      intro: null,
      steps: [{ number: "01", title: "Comprendre", description: "J'écoute." }],
    });
    expect(c.differentiator).toEqual({
      title: "Sans perdre les personnes",
      bodyHtml: "clean(<p>double lecture</p>)",
    });
    expect(c.audience).toEqual({
      title: "Fait pour vous si…",
      items: ["Vous grandissez vite", "Vous voulez structurer"],
      conclusion: "Avancer ensemble.",
    });
    expect(c.testimonials).toHaveLength(1);
    expect(c.testimonialsTitle).toBe("Elles en parlent");
    expect(c.cta).toEqual({
      title: "On commence ?",
      body: "Un regard extérieur aide.",
      label: "Prendre RDV",
      subtext: "30 min sans engagement.",
    });
    expect(c.seo.title).toBe("L'Encre Humaine");
  });

  it("compose les trois enjeux (cartes détaillées) ; slots vides filtrés, CTA link par défaut", () => {
    const c = mapOrgHubContent(
      {
        situations_title: "Chaque organisation avance à son rythme.",
        situations_intro: "L'accompagnement s'adapte à votre réalité de terrain.",
        situation_a_title: "Audit RH & feuille de route",
        situation_a_audience: "Vos pratiques RH se sont construites au fil de l'eau.",
        situation_a_items: [{ text: "Analyse des pratiques" }, "Priorisation des enjeux"],
        situation_a_result: "Une feuille de route réaliste.",
        situation_a_cta_label: "Découvrir l'offre",
        // situation B entièrement vide → filtrée
        situation_c_title: "Managers & équipes",
      },
      [],
      [],
      {},
      BASE,
      wrap,
    );
    expect(c.situationsTitle).toBe("Chaque organisation avance à son rythme.");
    expect(c.situationsIntro).toBe("L'accompagnement s'adapte à votre réalité de terrain.");
    expect(c.situations).toHaveLength(2); // A + C ; B vide filtrée
    expect(c.situations[0]).toEqual({
      title: "Audit RH & feuille de route",
      body: null,
      audience: "Vos pratiques RH se sont construites au fil de l'eau.",
      items: ["Analyse des pratiques", "Priorisation des enjeux"],
      result: "Une feuille de route réaliste.",
      ctaLabel: "Découvrir l'offre",
      ctaLink: "/organisations/audit-rh",
    });
    // Slot C minimal : CTA link retombe sur l'offre managers.
    expect(c.situations[1]).toMatchObject({
      title: "Managers & équipes",
      ctaLink: "/organisations/managers-equipes",
    });
  });
});
