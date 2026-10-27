// Carte de cas concret — en mode `compact` (accueil), le récit complet n'est
// masqué QUE s'il est lisible ailleurs : sans « Lire le cas », il disparaîtrait
// du site (revue du 2026-10-23).
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import CaseStudyCard from "~/components/CaseStudyCard.vue";

const base = {
  title: "Plan de formation",
  summary: "Résumé.",
  situation: "La situation.",
  actions: "Les actions.",
  result: "Le résultat.",
  offers: [],
  showOnHome: true,
};

describe("CaseStudyCard compact", () => {
  it("réduit au résumé + « Lire le cas » quand le cas complet a une page", async () => {
    const wrapper = await mountSuspended(CaseStudyCard, {
      props: { caseStudy: { ...base, readMoreUrl: "/organisations/x#cas-1" }, compact: true },
    });
    expect(wrapper.text()).toContain("Lire le cas");
    expect(wrapper.text()).not.toContain("Le résultat.");
  });

  it("garde le récit complet quand le cas n'a pas de page où le lire", async () => {
    const wrapper = await mountSuspended(CaseStudyCard, {
      props: { caseStudy: base, compact: true },
    });
    expect(wrapper.text()).toContain("Le résultat.");
    expect(wrapper.text()).not.toContain("Lire le cas");
  });

  it("affiche la carte résumée en entier : étiquette, situation, résultat, bouton", async () => {
    const wrapper = await mountSuspended(CaseStudyCard, {
      props: {
        caseStudy: {
          ...base,
          readMoreUrl: "/organisations/x#cas-1",
          teaser: {
            label: "Plan de formation",
            situation: "30 000 € de formation.",
            result: "3 consultants formés.",
            button: "Lire le cas : plan de formation",
          },
        },
        compact: true,
      },
    });
    const text = wrapper.text();
    expect(text).toContain("Plan de formation");
    expect(text).toContain("30 000 € de formation.");
    expect(text).toContain("Résultat\u00a0: 3 consultants formés.");
    expect(text).toContain("3 consultants formés.");
    expect(text).not.toContain("Résumé.");
    const link = wrapper.get('a[href="/organisations/x#cas-1"]');
    expect(link.text()).toContain("Lire le cas : plan de formation");
    // Éléonore : aucun texte coupé automatiquement.
    expect(wrapper.html()).not.toContain("line-clamp");
  });
});
