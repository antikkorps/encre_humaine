// Bandeau de consentement — docs/06-security.md §7.
// Vérifie : affichage tant qu'aucun choix n'est fait, puis disparition après
// accord/refus, et la valeur de `thirdParty` selon le choix (gate des embeds).
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises, type VueWrapper } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import ConsentBanner from "~/components/ConsentBanner.vue";
import { useConsent } from "~/composables/useConsent";

function clearConsentCookie() {
  // Nettoyage entre tests (happy-dom) : la Cookie Store API n'y est pas dispo.
  // biome-ignore lint/suspicious/noDocumentCookie: réinitialisation de test, hors runtime app.
  document.cookie = "eh_consent=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
}

function findButton(wrapper: VueWrapper, label: string) {
  const btn = wrapper.findAll("button").find((b) => b.text().includes(label));
  if (!btn) throw new Error(`bouton "${label}" introuvable`);
  return btn;
}

describe("ConsentBanner", () => {
  beforeEach(() => {
    clearConsentCookie();
  });

  it("s'affiche tant qu'aucun choix n'a été fait", async () => {
    const wrapper = await mountSuspended(ConsentBanner);
    const region = wrapper.find('[role="region"]');
    expect(region.exists()).toBe(true);
    expect(region.attributes("aria-label")).toBe("Consentement aux contenus tiers");
  });

  it("disparaît et autorise les tiers après acceptation", async () => {
    const wrapper = await mountSuspended(ConsentBanner);
    await findButton(wrapper, "Autoriser les contenus tiers").trigger("click");
    await flushPromises();

    expect(wrapper.find('[role="region"]').exists()).toBe(false);
    expect(useConsent().thirdParty.value).toBe(true);
  });

  it("disparaît sans autoriser les tiers après refus", async () => {
    const wrapper = await mountSuspended(ConsentBanner);
    await findButton(wrapper, "Continuer sans").trigger("click");
    await flushPromises();

    expect(wrapper.find('[role="region"]').exists()).toBe(false);
    expect(useConsent().thirdParty.value).toBe(false);
    // Un choix explicite a bien été enregistré (pas de réaffichage).
    expect(useConsent().decided.value).toBe(true);
  });
});
