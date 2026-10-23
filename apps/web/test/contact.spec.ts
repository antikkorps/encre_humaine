// @vitest-environment node
//
// Composition de la page Contact — docs/09-contact.md.
// Vérifie : masquage des sections vides, prise de RDV conditionnée à booking_url,
// répéteur next_steps, FAQ assainie (sanitizer injecté), coordonnées, SEO.
import { describe, expect, it } from "vitest";
import { mapContactContent } from "../server/utils/content/contact";

const BASE = "https://cms.example.fr";
const wrap = (h?: string | null) => (h ? `clean(${h})` : "");

describe("mapContactContent", () => {
  it("page vide : sections masquées, RDV absent, coordonnées nulles", () => {
    const c = mapContactContent({}, [], {}, BASE, wrap);
    expect(c.accrocheTitle).toBeNull();
    expect(c.accrocheBody).toBeNull();
    expect(c.booking).toBeNull();
    expect(c.callbackIntro).toBeNull();
    expect(c.callbackFormIntro).toBeNull();
    expect(c.accrocheCtaNote).toBeNull();
    expect(c.benefits).toBeNull();
    expect(c.contactTitle).toBeNull();
    expect(c.nextSteps).toEqual([]);
    expect(c.stepsConclusion).toBeNull();
    expect(c.responseTimeNote).toBeNull();
    expect(c.reasons).toBeNull();
    expect(c.finalCta).toBeNull();
    expect(c.faq).toEqual([]);
    expect(c.contact).toEqual({ email: null, linkedin: null, location: null });
  });

  it("RDV présent seulement si booking_url configuré (intro + réassurance depuis la page)", () => {
    expect(
      mapContactContent({ booking_intro: "Réservons 30 min." }, [], {}, BASE, wrap).booking,
    ).toBeNull();
    expect(
      mapContactContent(
        { booking_intro: "Réservons 30 min.", booking_reassurance: "Aucun tentacule." },
        [],
        { booking_url: "https://cal.com/eleonore/decouverte" },
        BASE,
        wrap,
      ).booking,
    ).toEqual({
      url: "https://cal.com/eleonore/decouverte",
      byAudience: { organisation: null, particulier: null },
      intro: "Réservons 30 min.",
      reassurance: "Aucun tentacule.",
    });
  });

  // Un agenda par public (2026-10-23) : RDV 30 min côté organisations, séance
  // découverte côté particuliers ; `booking_url` reste le lien par défaut.
  it("expose un lien par public, le lien par défaut retombant sur le premier renseigné", () => {
    const booking = mapContactContent(
      {},
      [],
      {
        booking_url_org: "https://cal.com/eleonore/rdv-30",
        booking_url_b2c: "https://cal.com/eleonore/decouverte",
      },
      BASE,
      wrap,
    ).booking;
    expect(booking).toMatchObject({
      url: "https://cal.com/eleonore/rdv-30",
      byAudience: {
        organisation: "https://cal.com/eleonore/rdv-30",
        particulier: "https://cal.com/eleonore/decouverte",
      },
    });
  });

  it("mappe « me contacter si… » (org/particuliers) et le CTA final ; masqués si vides", () => {
    const c = mapContactContent(
      {
        callback_intro: "Je vous rappelle.",
        callback_form_intro: "Sous 48 heures ouvrées.",
        steps_conclusion: "Pas de vente forcée.",
        reasons_title: "Vous pouvez me contacter si…",
        reasons_org: [{ text: "Structurer vos RH" }, { text: "" }],
        reasons_b2c: [{ text: "Une transition" }],
        final_cta_title: "Parlons-en",
        final_cta_body: "30 minutes suffisent.",
      },
      [],
      {},
      BASE,
      wrap,
    );
    expect(c.callbackIntro).toBe("Je vous rappelle.");
    expect(c.callbackFormIntro).toBe("Sous 48 heures ouvrées.");
    expect(c.stepsConclusion).toBe("Pas de vente forcée.");
    expect(c.reasons).toEqual({
      title: "Vous pouvez me contacter si…",
      orgLead: null,
      org: ["Structurer vos RH"], // entrée vide filtrée
      b2cLead: null,
      b2c: ["Une transition"],
    });
    expect(c.finalCta).toEqual({
      title: "Parlons-en",
      body: "30 minutes suffisent.",
      subtext: null,
    });
  });

  it("mappe « Pourquoi prendre rendez-vous ? » ; affiché dès qu'un champ est rempli", () => {
    const c = mapContactContent(
      {
        accroche_cta_note: "30 minutes, sans engagement.",
        contact_title: "Deux façons de commencer",
        benefits_title: "Ce avec quoi vous repartez",
        benefits: [
          { title: "Vous savez nommer ce qui bloque.", body: "Un problème nommé se traite." },
          { title: "", body: "" },
        ],
        benefits_b2c: "Si vous êtes un particulier : un premier éclairage.",
      },
      [],
      {},
      BASE,
      wrap,
    );
    expect(c.accrocheCtaNote).toBe("30 minutes, sans engagement.");
    expect(c.contactTitle).toBe("Deux façons de commencer");
    expect(c.benefits).toEqual({
      title: "Ce avec quoi vous repartez",
      items: [{ title: "Vous savez nommer ce qui bloque.", body: "Un problème nommé se traite." }],
      org: null,
      b2c: "Si vous êtes un particulier : un premier éclairage.",
    });
    expect(
      mapContactContent({ benefits_org: "Organisation" }, [], {}, BASE, wrap).benefits,
    ).toEqual({
      title: null,
      items: [],
      org: "Organisation",
      b2c: null,
    });
  });

  it("mappe next_steps, FAQ assainie, coordonnées et SEO (fallback site_settings)", () => {
    const c = mapContactContent(
      {
        accroche_title: "Parlons-en",
        next_steps: [{ number: 1, title: "Vous écrivez", description: "Un mot suffit." }],
        response_time_note: "Réponse sous 48h ouvrées.",
        meta_title: "",
      },
      [{ question: "C'est payant ?", answer: "<p>Le 1er échange est offert.</p>" }],
      {
        brand_name: "L'Encre Humaine",
        default_meta_description: "Conseil RH.",
        contact_email: "eleonore@example.com",
        linkedin_url: "https://linkedin.com/in/eleonore",
        location_label: "Bouches-du-Rhône",
      },
      BASE,
      wrap,
    );
    expect(c.accrocheTitle).toBe("Parlons-en");
    expect(c.nextSteps).toEqual([
      { number: "1", title: "Vous écrivez", description: "Un mot suffit." },
    ]);
    expect(c.responseTimeNote).toBe("Réponse sous 48h ouvrées.");
    expect(c.faq).toEqual([
      { question: "C'est payant ?", answer: "clean(<p>Le 1er échange est offert.</p>)" },
    ]);
    expect(c.contact).toEqual({
      email: "eleonore@example.com",
      linkedin: "https://linkedin.com/in/eleonore",
      location: "Bouches-du-Rhône",
    });
    expect(c.seo.title).toBe("L'Encre Humaine");
    expect(c.seo.description).toBe("Conseil RH.");
  });
});
