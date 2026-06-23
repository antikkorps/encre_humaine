// Menu mobile (Reka Dialog) — docs/00-global.md §Layout.
// Reka fournit focus trap / Escape / ARIA ; on vérifie ici le câblage a11y :
// déclencheur labellisé, ouverture vers un dialog titré, items rendus.
// Le contenu est téléporté (DialogPortal) → on interroge le document, pas le wrapper.
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import NavMobile from "~/components/NavMobile.vue";

const items = [
  { label: "Organisations", to: "/organisations" },
  { label: "Particuliers", to: "/particuliers" },
];

describe("NavMobile", () => {
  it("expose un déclencheur labellisé, fermé par défaut", async () => {
    const wrapper = await mountSuspended(NavMobile, { props: { items } });
    const trigger = wrapper.find("button");
    expect(trigger.attributes("aria-label")).toBe("Ouvrir le menu");
    // Panneau fermé : aucun dialog dans le document.
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("ouvre un dialog titré contenant la navigation", async () => {
    const wrapper = await mountSuspended(NavMobile, { props: { items } });
    await wrapper.find("button").trigger("click");
    await flushPromises();

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    // Titre accessible (wordmark) + tous les liens fournis + CTA.
    const text = dialog?.textContent ?? "";
    expect(text).toContain("L'Encre Humaine");
    expect(text).toContain("Organisations");
    expect(text).toContain("Particuliers");
    expect(text).toContain("Prendre RDV");
  });
});
