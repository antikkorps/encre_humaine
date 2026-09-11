// @vitest-environment node
//
// Composition du hub Organisations — docs/03-organisations-hub.md.
// Vérifie : accroche, offres dynamiques (résumé + audience), cartes d'enjeu
// (encadré libre + investissement/format, avec repli sur la fiche d'offre), méthode,
// différenciateur (rich text assaini), bloc « Vous êtes RH ou dirigeant ? », FAQ
// (scope=org) masquée si vide, témoignages b2b masqués si vides, CTA avec fallbacks, SEO.
import { describe, expect, it } from "vitest";
import { mapOrgHubContent } from "../server/utils/content/org-hub";

const BASE = "https://cms.example.fr";
const wrap = (h?: string | null) => (h ? `clean(${h})` : "");

describe("mapOrgHubContent", () => {
  it("hub vide : sections masquées, CTA replié sur ses fallbacks", () => {
    const c = mapOrgHubContent({}, [], [], [], {}, BASE, wrap);
    expect(c.accrocheTitle).toBeNull();
    expect(c.offers).toEqual([]);
    expect(c.offersTitle).toBe("Mes offres pour les organisations");
    expect(c.situationsTitle).toBeNull();
    expect(c.situations).toEqual([]);
    expect(c.method).toBeNull();
    expect(c.differentiator).toBeNull();
    expect(c.audience).toBeNull();
    expect(c.faq).toEqual([]);
    expect(c.testimonials).toEqual([]);
    expect(c.cta).toEqual({
      title: "Travaillons ensemble",
      body: null,
      label: "Prendre rendez-vous",
      subtext: null,
    });
  });

  it("compose accroche, offres, méthode, différenciateur (assaini), bloc RH, CTA", () => {
    const c = mapOrgHubContent(
      {
        accroche_title: "Vos pratiques RH doivent évoluer",
        accroche_subtitle: "Les équipes grandissent.",
        method_title: "Ma démarche",
        method_steps: [{ number: "01", title: "Comprendre", description: "J'écoute." }],
        differentiator_title: "Sans perdre les personnes",
        differentiator_body: "<p>double lecture</p>",
        audience_title: "**Vous êtes RH ou dirigeant ?**",
        audience_body: "Vous connaissez déjà ces sujets en théorie.",
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
      [{ question: "Faut-il un service RH ?", answer: "<p>Non.</p>" }],
      [{ quote: "Un vrai partenaire.", author_name: "Marie", audience: "organisation" }],
      { brand_name: "L'Encre Humaine" },
      BASE,
      wrap,
    );
    expect(c.accrocheTitle).toBe("Vos pratiques RH doivent évoluer");
    expect(c.accrocheSubtitle).toBe("Les équipes grandissent.");
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
      title: "**Vous êtes RH ou dirigeant ?**",
      body: "Vous connaissez déjà ces sujets en théorie.",
      conclusion: "Avancer ensemble.",
    });
    // FAQ propre au hub (scope=org) — réponse assainie comme partout ailleurs.
    expect(c.faq).toEqual([{ question: "Faut-il un service RH ?", answer: "clean(<p>Non.</p>)" }]);
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
      takeaway: null,
      price: null,
      duration: null,
      ctaLabel: "Découvrir l'offre",
      ctaLink: "/organisations/audit-rh",
    });
    // Slot C minimal : CTA link retombe sur l'offre managers.
    expect(c.situations[1]).toMatchObject({
      title: "Managers & équipes",
      ctaLink: "/organisations/de-l-expert-au-manager",
    });
  });

  it("carte d'enjeu : encadré libre, et investissement/format repris de l'offre si non saisis", () => {
    const c = mapOrgHubContent(
      {
        situation_a_title: "Audit RH",
        situation_a_takeaway_label: "Ce que ça vous évite",
        situation_a_takeaway_body: "Un chantier RH lancé au mauvais endroit.",
        situation_a_price: "à partir de 2 000 €",
        situation_a_duration: "à partir de 2 semaines",
        // Carte B : rien de saisi → repli sur la fiche de l'offre liée.
        situation_b_title: "Carte des Talents",
        // Carte C : un intitulé sans texte ne doit pas laisser d'encadré orphelin.
        situation_c_title: "De l'Expert au Manager",
        situation_c_takeaway_label: "Ce que vous y gagnez",
      },
      [
        {
          title: "Carte des Talents",
          slug: "carte-des-talents",
          price_label: "À partir de 4 000 €",
          duration_label: "À partir de 4 semaines",
        },
      ],
      [],
      [],
      {},
      BASE,
      wrap,
    );
    expect(c.situations[0]).toMatchObject({
      takeaway: { label: "Ce que ça vous évite", body: "Un chantier RH lancé au mauvais endroit." },
      price: "à partir de 2 000 €",
      duration: "à partir de 2 semaines",
    });
    expect(c.situations[1]).toMatchObject({
      price: "À partir de 4 000 €",
      duration: "À partir de 4 semaines",
    });
    expect(c.situations[2]).toMatchObject({ takeaway: null, price: null, duration: null });
  });
});
