// Carte témoignage — retours Éléonore du 2026-08-18 (bulle photo, poulpe de
// repli, étoiles de satisfaction). Ce qui est vérifié ici est ce qui casserait
// sans bruit côté CMS : une bulle vide quand la personne refuse sa photo, ou des
// étoiles affichées alors que la note n'est pas renseignée.
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import TestimonialCard from "~/components/TestimonialCard.vue";
import type { TestimonialItem } from "~/types/content";

const base: TestimonialItem = {
  quote: "Un vrai déclic.",
  authorName: "Marie",
  authorTitle: "DRH",
  company: "Acme",
  offers: [],
};

const mount = (testimonial: TestimonialItem) =>
  mountSuspended(TestimonialCard, { props: { testimonial } });

describe("TestimonialCard", () => {
  it("attribution « Prénom, fonction — entreprise »", async () => {
    const wrapper = await mount(base);
    expect(wrapper.text()).toContain("Marie, DRH — Acme");
  });

  it("sans photo : le poulpe tient la bulle (jamais de rond vide)", async () => {
    const wrapper = await mount(base);
    expect(wrapper.find("img").exists()).toBe(false);
    expect(wrapper.find("svg").exists()).toBe(true);
  });

  it("avec photo : la photo remplace le poulpe", async () => {
    const wrapper = await mount({
      ...base,
      photo: { url: "https://cms.example.fr/assets/f1", alt: "Marie", width: 400, height: 400 },
    });
    const img = wrapper.find("img");
    expect(img.exists()).toBe(true);
    expect(img.attributes("alt")).toBe("Marie");
  });

  it("étoiles : affichées seulement si la note est renseignée", async () => {
    expect((await mount(base)).find('[role="img"]').exists()).toBe(false);

    const noted = await mount({ ...base, rating: 4 });
    const stars = noted.find('[role="img"]');
    expect(stars.attributes("aria-label")).toBe("Satisfaction : 4 sur 5");
    expect(stars.element.children).toHaveLength(5);
  });
});
