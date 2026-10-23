// FAQ en accordéon — les réponses repliées doivent rester DANS le HTML : Google et
// les IA ne cliquent pas, une réponse absente du code source leur est invisible
// (audit SEO Éléonore, 2026-10-22).
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import FaqAccordion from "~/components/FaqAccordion.vue";

const items = [
  { question: "Qu'est-ce que la GEPP ?", answer: "<p>Anticiper les compétences.</p>" },
  { question: "Quand faire un audit ?", answer: "<p>Quand l'entreprise a grandi.</p>" },
];

describe("FaqAccordion", () => {
  it("rend les réponses repliées dans le HTML, masquées mais trouvables", async () => {
    const wrapper = await mountSuspended(FaqAccordion, { props: { items } });
    const html = wrapper.html();
    expect(html).toContain("Anticiper les compétences.");
    expect(html).toContain("Quand l'entreprise a grandi.");
    // happy-dom réduit `hidden="until-found"` à un booléen : on vérifie le masquage.
    expect(wrapper.findAll("[role=region][hidden]")).toHaveLength(2);
  });
});
